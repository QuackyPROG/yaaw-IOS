import test from "node:test";
import assert from "node:assert/strict";
import { classifyNativeBoundary } from "../framework/.yaaw-ios/system/engine/native-boundary.mjs";

test("TS screen change is JS_ONLY", () => {
  const x = classifyNativeBoundary({ changedPaths: ["src/screens/Settings.tsx"] });
  assert.equal(x.classification, "JS_ONLY");
  assert.equal(x.nativeRebuildRequired, false);
});

test("app config requires native rebuild", () => {
  const x = classifyNativeBoundary({ changedPaths: ["app.json"] });
  assert.equal(x.classification, "NATIVE_REBUILD_REQUIRED");
  assert.equal(x.nativeRebuildRequired, true);
});

test("ios native source is MACOS_REQUIRED", () => {
  assert.equal(classifyNativeBoundary({ changedPaths: ["ios/App/AppDelegate.swift"] }).classification, "MACOS_REQUIRED");
});

test("config plugin escalates explicitly", () => {
  assert.equal(classifyNativeBoundary({ configPluginChanged: true }).classification, "CONFIG_PLUGIN");
});
