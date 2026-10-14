import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { inspectEnvironment } from "../framework/.yaaw-ios/system/engine/environment.mjs";

test("Windows doctor reports Xcode unavailable rather than pretending", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaaw-ios-doctor-"));
  await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { expo: "~57.0.0", "react-native": "0.86.0" } }));
  const runCommand = async (cmd, args) => {
    if (cmd === "eas" && args?.[0] === "whoami") return { ok: false, stdout: "", stderr: "" };
    if (["git","node","npm","eas"].includes(cmd)) return { ok: true, stdout: `${cmd} 1.0`, stderr: "" };
    return { ok: false, stdout: "", stderr: "" };
  };
  const result = await inspectEnvironment(root, { platform: "win32", runCommand });
  const xcode = result.checks.find(x => x.id === "xcode");
  assert.equal(xcode.status, "UNAVAILABLE_ON_WINDOWS");
  assert.equal(result.checks.find(x => x.id === "expo").status, "PASS");
});
