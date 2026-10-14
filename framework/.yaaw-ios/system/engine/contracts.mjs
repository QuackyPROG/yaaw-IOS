import { readFile } from "node:fs/promises";

export async function loadKernel(path) {
  const text = await readFile(path, "utf8");
  const kernel = JSON.parse(text);
  validateKernel(kernel);
  return kernel;
}

export function validateKernel(kernel) {
  if (kernel.schema !== "yaaw-ios-kernel-v1") throw new Error("Unsupported kernel schema");
  if (!kernel.roles?.orchestrator) throw new Error("Kernel missing orchestrator");
  if (kernel.roles.orchestrator.spawnable !== false) throw new Error("Orchestrator must not be spawnable");
  if (!kernel.roles.reviewer?.requiresFreshContext) throw new Error("Reviewer must require fresh context");
  for (const [skill, route] of Object.entries(kernel.skills ?? {})) {
    if (!kernel.roles[route.role]) throw new Error(`Skill ${skill} routes to unknown role ${route.role}`);
    if (!route.operation) throw new Error(`Skill ${skill} is missing operation`);
  }
  return true;
}

export function validateHandoff(kernel, handoff) {
  const role = kernel.roles[handoff.role];
  if (!role) throw new Error(`Unknown handoff role: ${handoff.role}`);
  if (handoff.role === "orchestrator") throw new Error("Orchestrator cannot be a child handoff target");
  if (!handoff.operation) throw new Error("Handoff missing operation");
  if (role.requiresFreshContext && handoff.requires_fresh_context !== true) {
    throw new Error(`Role ${handoff.role} requires a fresh context`);
  }
  return true;
}
