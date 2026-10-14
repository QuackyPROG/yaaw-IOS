import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { detectProjectType } from "../framework/.yaaw-ios/system/engine/project-detect.mjs";

async function temp() { return mkdtemp(join(tmpdir(), "yaaw-ios-detect-")); }

test("detects empty project", async () => {
  const root = await temp();
  assert.equal((await detectProjectType(root)).type, "EMPTY_PROJECT");
});

test("detects Expo and does not confuse native folders", async () => {
  const root = await temp();
  await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { expo: "~57.0.0", "react-native": "0.86.0" } }));
  await mkdir(join(root, "ios"));
  const result = await detectProjectType(root);
  assert.equal(result.type, "EXISTING_EXPO_PROJECT");
  assert.equal(result.hasNativeFolders, true);
  assert.equal(result.expoVersion, "~57.0.0");
});

test("detects React Native without Expo", async () => {
  const root = await temp();
  await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { "react-native": "0.87.0" } }));
  assert.equal((await detectProjectType(root)).type, "EXISTING_REACT_NATIVE_PROJECT");
});
