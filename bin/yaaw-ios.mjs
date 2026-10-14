#!/usr/bin/env node
import { resolve } from "node:path";
import { install, repair } from "../src/installer/install.mjs";
import { getStatus } from "../src/status.mjs";
import { inspectEnvironment } from "../src/doctor/environment.mjs";
import { readFile } from "node:fs/promises";

const args = process.argv.slice(2);
const command = args[0] ?? "help";
const target = resolve(args.find((arg, i) => i > 0 && !arg.startsWith("-")) ?? ".");
const json = args.includes("--json");

try {
  if (command === "install" || command === "repair") {
    const result = command === "install" ? await install(target) : await repair(target);
    print({ command, root: result.root, version: result.manifest.package_version, changed: result.changed }, json);
  } else if (command === "status") {
    const result = await getStatus(target);
    print(result, json);
    if (!result.healthy) process.exitCode = 1;
  } else if (command === "doctor") {
    const result = await inspectEnvironment(target);
    if (json) console.log(JSON.stringify(result, null, 2));
    else printDoctor(result);
    if (result.summary.ACTION_REQUIRED > 0) process.exitCode = 2;
  } else if (command === "config") {
    const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
    print({
      package: pkg.name,
      version: pkg.version,
      framework_root: ".yaaw-ios",
      root_session: "orchestrator",
      default_app_strategy: "Expo + React Native + TypeScript + Expo Router + development build + EAS",
      current_research_baseline: "2026-10-15 / Expo SDK 57 stable",
      note: "Project/user Codex model settings are inherited; YAAW-iOS does not replace them."
    }, json);
  } else {
    console.log(`YAAW-iOS

Usage:
  yaaw-ios install [project]
  yaaw-ios repair [project]
  yaaw-ios status [project] [--json]
  yaaw-ios doctor [project] [--json]
  yaaw-ios config [project] [--json]

Install/repair modify only the selected project boundary. Durable .yaaw-ios/project memory is initialization-only.`);
  }
} catch (error) {
  console.error(`yaaw-ios: ${error.message}`);
  process.exitCode = 1;
}

function print(value, asJson) {
  if (asJson) { console.log(JSON.stringify(value, null, 2)); return; }
  if (value.changed) {
    console.log(`${value.command}: ${value.root}`);
    console.log(`version: ${value.version}`);
    console.log(value.changed.length ? `changed:\n${value.changed.map(x => `  - ${x}`).join("\n")}` : "changed: none");
    return;
  }
  for (const [key, val] of Object.entries(value)) {
    if (typeof val === "object") console.log(`${key}: ${JSON.stringify(val)}`);
    else console.log(`${key}: ${val}`);
  }
}

function printDoctor(result) {
  console.log(`YAAW-iOS doctor — ${result.host.platform}/${result.host.arch}`);
  for (const item of result.checks) {
    const marker = { PASS: "✓", WARNING: "!", ACTION_REQUIRED: "!", UNAVAILABLE_ON_WINDOWS: "×", OPTIONAL: "○" }[item.status] ?? "-";
    console.log(`${marker} [${item.status}] ${item.id}: ${item.summary}`);
    if (item.details) console.log(`    ${item.details}`);
  }
}
