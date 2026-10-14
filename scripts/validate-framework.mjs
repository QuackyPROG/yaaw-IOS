import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { validateKernel } from "../framework/.yaaw-ios/system/engine/contracts.mjs";

const root = new URL("..", import.meta.url);
const kernelPath = new URL("../framework/.yaaw-ios/system/kernel.yaml", import.meta.url);
const kernel = JSON.parse(await readFile(kernelPath, "utf8"));
validateKernel(kernel);

for (const role of Object.keys(kernel.roles)) {
  const file = role === "ios-environment" ? "ios-environment.md" : role === "ios-planner" ? "ios-planner.md" : `${role}.md`;
  await access(new URL(`../framework/.yaaw-ios/system/roles/${file}`, import.meta.url), constants.R_OK);
}
for (const route of Object.values(kernel.skills)) {
  for (const module of route.modules ?? []) {
    await access(new URL(`../framework/.yaaw-ios/system/modules/${module}.md`, import.meta.url), constants.R_OK);
  }
}
for (const skill of Object.keys(kernel.skills)) {
  await access(new URL(`../skills/${skill}/SKILL.md`, import.meta.url), constants.R_OK);
}
console.log(`framework valid: ${Object.keys(kernel.roles).length} roles, ${Object.keys(kernel.skills).length} skills`);
