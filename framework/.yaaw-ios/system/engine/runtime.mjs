#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { verifyIntegrity } from "./integrity.mjs";
import { detectProjectType } from "./project-detect.mjs";
import { repositoryIdentity } from "./repository-identity.mjs";
import { loadKernel, validateHandoff } from "./contracts.mjs";

const writeJson = (path, value) => writeFile(path, JSON.stringify(value, null, 2) + "\n");

export async function orchestrate(root, skill) {
  const integrity = await verifyIntegrity(root);
  if (!integrity.healthy) throw new Error(`Framework integrity failure: ${integrity.issues.join("; ")}`);

  const kernel = await loadKernel(join(root, ".yaaw-ios", "system", "kernel.yaml"));
  const route = kernel.skills[skill];
  if (!route) throw new Error(`Unknown YAAW-iOS skill: ${skill}`);

  const runtimeRoot = join(root, ".yaaw-ios", "runtime");
  await mkdir(runtimeRoot, { recursive: true });
  const observed = {
    schema: "yaaw-ios-observed-state-v1",
    observed_at: new Date().toISOString(),
    project: await detectProjectType(root),
    repository: repositoryIdentity(root),
    integrity: { healthy: true, issues: [] }
  };
  const handoff = {
    schema: "yaaw-ios-handoff-v1",
    created_at: new Date().toISOString(),
    skill,
    role: route.role,
    operation: route.operation,
    root_authority: route.role === "orchestrator",
    requires_fresh_context: Boolean(kernel.roles[route.role]?.requiresFreshContext),
    modules: route.modules ?? [],
    reads: route.reads ?? [],
    writes: route.writes ?? [],
    repository_identity_required: Boolean(route.repositoryIdentityRequired)
  };
  if (route.role !== "orchestrator") validateHandoff(kernel, handoff);

  await writeJson(join(runtimeRoot, "intent.json"), { schema: "yaaw-ios-intent-v1", skill });
  await writeJson(join(runtimeRoot, "observed-state.json"), observed);
  await writeJson(join(runtimeRoot, "handoff.json"), handoff);
  return { observed, handoff };
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("runtime.mjs")) {
  const workspace = resolve(arg("--workspace") ?? ".");
  const skill = arg("--invoke-skill");
  if (!skill) {
    console.error("Missing --invoke-skill <skill-id>");
    process.exitCode = 2;
  } else {
    try {
      const result = await orchestrate(workspace, skill);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
