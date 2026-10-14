import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

export async function exists(path) {
  try { await lstat(path); return true; } catch { return false; }
}

export async function ensureDir(path) {
  await mkdir(path, { recursive: true });
}

export async function atomicWrite(path, content) {
  await ensureDir(dirname(path));
  const temp = `${path}.yaaw-ios-tmp-${process.pid}-${Date.now()}`;
  await writeFile(temp, content);
  await rename(temp, path);
}

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function sha256File(path) {
  return sha256Bytes(await readFile(path));
}

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function writeJson(path, value) {
  await atomicWrite(path, JSON.stringify(value, null, 2) + "\n");
}

export async function walkFiles(root) {
  const { readdir } = await import("node:fs/promises");
  if (!(await exists(root))) return [];
  const out = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = `${current}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) out.push(path);
    }
  }
  await walk(root);
  return out;
}

export function rel(root, path) {
  return relative(root, path).replaceAll("\\", "/");
}

export async function removeIfExists(path, options = {}) {
  if (await exists(path)) await rm(path, { force: true, recursive: Boolean(options.recursive) });
}
