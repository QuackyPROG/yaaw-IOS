import { createHash } from "node:crypto";
import { lstat, readFile } from "node:fs/promises";
import { join } from "node:path";

async function exists(path) { try { await lstat(path); return true; } catch { return false; } }
const sha = bytes => createHash("sha256").update(bytes).digest("hex");

function extractManagedSection(original, id) {
  const start = `# >>> YAAW-IOS MANAGED:${id} >>>`;
  const end = `# <<< YAAW-IOS MANAGED:${id} <<<`;
  const esc = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return original.match(new RegExp(`${esc(start)}[\\s\\S]*?${esc(end)}`, "m"))?.[0] ?? null;
}

export async function verifyIntegrity(root) {
  const manifestPath = join(root, ".yaaw-ios", "install", "manifest.json");
  if (!(await exists(manifestPath))) return { healthy: false, issues: ["missing installation manifest"], manifest: null };
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); }
  catch (error) { return { healthy: false, issues: [`invalid installation manifest: ${error.message}`], manifest: null }; }

  const issues = [];
  for (const item of manifest.managed_files ?? []) {
    const path = join(root, item.path);
    if (!(await exists(path))) { issues.push(`MISSING ${item.path}`); continue; }
    if (item.kind === "managed-section") {
      const section = extractManagedSection(await readFile(path, "utf8"), item.section_id);
      if (!section) { issues.push(`MISSING_SECTION ${item.path}#${item.section_id}`); continue; }
      if (sha(Buffer.from(section)) !== item.sha256) issues.push(`MODIFIED_SECTION ${item.path}#${item.section_id}`);
    } else if (sha(await readFile(path)) !== item.sha256) {
      issues.push(`MODIFIED ${item.path}`);
    }
  }
  return { healthy: issues.length === 0, issues, manifest };
}
