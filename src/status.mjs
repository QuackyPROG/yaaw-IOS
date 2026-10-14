import { join } from "node:path";
import { exists } from "./util/fs.mjs";
import { verifyIntegrity } from "./system/integrity.mjs";
import { detectProjectType } from "./project/detect.mjs";

export async function getStatus(root) {
  const installed = await exists(join(root, ".yaaw-ios", "install", "manifest.json"));
  if (!installed) return { installed: false, healthy: false, issues: ["YAAW-iOS is not installed"] };
  const integrity = await verifyIntegrity(root);
  return {
    installed: true,
    healthy: integrity.healthy,
    version: integrity.manifest?.package_version ?? null,
    project_schema: integrity.manifest?.project_schema ?? null,
    project: await detectProjectType(root),
    issues: integrity.issues
  };
}
