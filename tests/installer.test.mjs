import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install } from "../src/installer/install.mjs";
import { verifyIntegrity } from "../src/system/integrity.mjs";

async function temp() { return mkdtemp(join(tmpdir(), "yaaw-ios-install-")); }

test("install is idempotent and preserves durable memory", async () => {
  const root = await temp();
  await install(root);
  const product = join(root, ".yaaw-ios", "project", "product.md");
  await writeFile(product, "accepted durable product truth\n");
  const second = await install(root);
  assert.equal(await readFile(product, "utf8"), "accepted durable product truth\n");
  assert.equal((await verifyIntegrity(root)).healthy, true);
  assert.equal(second.changed.length, 0);
});

test("install preserves unrelated Codex config and custom agents/skills", async () => {
  const root = await temp();
  await mkdir(join(root, ".codex", "agents"), { recursive: true });
  await mkdir(join(root, ".agents", "skills", "mine"), { recursive: true });
  await writeFile(join(root, ".codex", "config.toml"), 'model = "user-owned"\n');
  await writeFile(join(root, ".codex", "agents", "custom.toml"), 'model = "custom"\n');
  await writeFile(join(root, ".agents", "skills", "mine", "SKILL.md"), "# mine\n");
  await install(root);
  assert.match(await readFile(join(root, ".codex", "config.toml"), "utf8"), /model = "user-owned"/);
  assert.equal(await readFile(join(root, ".codex", "agents", "custom.toml"), "utf8"), 'model = "custom"\n');
  assert.equal(await readFile(join(root, ".agents", "skills", "mine", "SKILL.md"), "utf8"), "# mine\n");
  const manifest = JSON.parse(await readFile(join(root, ".yaaw-ios", "install", "manifest.json"), "utf8"));
  assert.equal(manifest.managed_files.some(x => x.path.includes("custom.toml") || x.path.includes("skills/mine")), false);
});

test("coexists without mutating .yaaw-core", async () => {
  const root = await temp();
  await mkdir(join(root, ".yaaw-core"), { recursive: true });
  await writeFile(join(root, ".yaaw-core", "sentinel.txt"), "se-owned\n");
  await install(root);
  assert.equal(await readFile(join(root, ".yaaw-core", "sentinel.txt"), "utf8"), "se-owned\n");
});

test("integrity ignores unrelated managed-section host edits but catches YAAW section edits", async () => {
  const root = await temp();
  await install(root);
  const agents = join(root, "AGENTS.md");
  await writeFile(agents, (await readFile(agents, "utf8")) + "\n# user note\n");
  assert.equal((await verifyIntegrity(root)).healthy, true);
  await writeFile(agents, (await readFile(agents, "utf8")).replace("Root Codex session is the Orchestrator.", "tampered"));
  const bad = await verifyIntegrity(root);
  assert.equal(bad.healthy, false);
  assert.match(bad.issues.join("\n"), /MODIFIED_SECTION/);
});

test("transaction rollback restores prior bytes on failure", async () => {
  const root = await temp();
  await writeFile(join(root, "AGENTS.md"), "user-owned\n");
  await assert.rejects(() => install(root, { failAfter: 2 }), /Simulated installer transaction failure/);
  assert.equal(await readFile(join(root, "AGENTS.md"), "utf8"), "user-owned\n");
  await assert.rejects(() => readFile(join(root, ".yaaw-ios", "system", "SYSTEM.md"), "utf8"));
});
