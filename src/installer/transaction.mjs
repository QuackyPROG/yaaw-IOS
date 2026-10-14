import { lstat, mkdir, readFile, rm, rmdir } from "node:fs/promises";
import { dirname } from "node:path";
import { assertSafeDestination } from "./boundary.mjs";
import { atomicWrite, exists } from "../util/fs.mjs";

export class Transaction {
  constructor(projectRoot, failAfter = null) {
    this.projectRoot = projectRoot;
    this.failAfter = failAfter;
    this.backups = new Map();
    this.createdDirs = new Set();
    this.count = 0;
  }

  async checkpoint() {
    this.count += 1;
    if (this.failAfter && this.count >= this.failAfter) {
      throw new Error("Simulated installer transaction failure");
    }
  }

  async capture(path) {
    if (this.backups.has(path)) return;
    if (!(await exists(path))) {
      this.backups.set(path, { existed: false });
      return;
    }
    const info = await lstat(path);
    if (!info.isFile()) throw new Error(`Expected file but found non-file: ${path}`);
    this.backups.set(path, { existed: true, bytes: await readFile(path) });
  }

  async ensureParents(path) {
    const missing = [];
    let current = dirname(path);
    while (!(await exists(current))) {
      missing.push(current);
      current = dirname(current);
    }
    for (const dir of missing.reverse()) {
      await assertSafeDestination(this.projectRoot, dir);
      await mkdir(dir);
      this.createdDirs.add(dir);
    }
  }

  async write(path, content) {
    await assertSafeDestination(this.projectRoot, path);
    await this.ensureParents(path);
    await this.capture(path);
    const desired = Buffer.isBuffer(content) ? content : Buffer.from(content);
    if (this.backups.get(path)?.existed) {
      const current = await readFile(path);
      if (current.equals(desired)) return false;
    }
    await atomicWrite(path, desired);
    await this.checkpoint();
    return true;
  }

  async remove(path) {
    await assertSafeDestination(this.projectRoot, path);
    if (!(await exists(path))) return false;
    await this.capture(path);
    await rm(path, { force: true });
    await this.checkpoint();
    return true;
  }

  async rollback() {
    for (const [path, backup] of [...this.backups.entries()].reverse()) {
      try {
        if (backup.existed) await atomicWrite(path, backup.bytes);
        else await rm(path, { force: true });
      } catch {}
    }
    for (const dir of [...this.createdDirs].sort((a, b) => b.length - a.length)) {
      try { await rmdir(dir); } catch {}
    }
  }
}
