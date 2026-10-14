import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install } from "../src/installer/install.mjs";
import { orchestrate } from "../framework/.yaaw-ios/system/engine/runtime.mjs";

test("runtime can be deleted and reconstructed from durable/framework state", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaaw-ios-runtime-"));
  await install(root);
  let result = await orchestrate(root, "yaaw-ios-review");
  assert.equal(result.observed.project.type, "EMPTY_PROJECT");
  assert.equal(result.handoff.role, "reviewer");
  assert.equal(result.handoff.requires_fresh_context, true);
  await rm(join(root, ".yaaw-ios", "runtime"), { recursive: true, force: true });
  result = await orchestrate(root, "yaaw-ios-review");
  assert.equal(result.handoff.role, "reviewer");
  const saved = JSON.parse(await readFile(join(root, ".yaaw-ios", "runtime", "handoff.json"), "utf8"));
  assert.equal(saved.requires_fresh_context, true);
});

test("root orchestrator is not a child worker", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaaw-ios-runtime-root-"));
  await install(root);
  const result = await orchestrate(root, "yaaw-ios-orchestrator");
  assert.equal(result.handoff.role, "orchestrator");
  assert.equal(result.handoff.root_authority, true);
});
