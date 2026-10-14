import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertSafeDestination, isWithin } from "../src/installer/boundary.mjs";

test("isWithin rejects parent escape", () => {
  assert.equal(isWithin("/a/project", "/a/project/file"), true);
  assert.equal(isWithin("/a/project", "/a/other"), false);
});

test("boundary rejects symlink parent escape", async t => {
  if (process.platform === "win32") return t.skip("symlink permission varies on Windows CI");
  const root = await mkdtemp(join(tmpdir(), "yaaw-ios-boundary-"));
  const outside = await mkdtemp(join(tmpdir(), "yaaw-ios-outside-"));
  await mkdir(join(root, "safe"), { recursive: true });
  await symlink(outside, join(root, "safe", "link"));
  await assert.rejects(() => assertSafeDestination(root, join(root, "safe", "link", "file.txt")), /escape outside project root/);
});
