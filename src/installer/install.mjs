import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, rm } from "node:fs/promises";
import { assertSafeDestination, resolveProjectRoot } from "./boundary.mjs";
import { extractManagedSection, renderManagedSection } from "./managed.mjs";
import { Transaction } from "./transaction.mjs";
import { exists, sha256Bytes, sha256File, walkFiles } from "../util/fs.mjs";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const PACKAGE_JSON = JSON.parse(await readFile(join(PACKAGE_ROOT, "package.json"), "utf8"));

const PROJECT_DEFAULTS = {
  ".yaaw-ios/project/product.md": `---\nschema: yaaw-ios-product-v1\nrevision: 0\nstatus: EMPTY\n---\n# Product\n\nNo accepted product definition yet.\n`,
  ".yaaw-ios/project/engineering.md": `---\nschema: yaaw-ios-engineering-v1\nrevision: 0\nstatus: DISCOVERY_REQUIRED\nscope_status: OPEN\n---\n# Engineering\n\nRepository investigation and architecture are not yet accepted.\n`,
  ".yaaw-ios/project/environment.json": JSON.stringify({ schema: "yaaw-ios-environment-v1", revision: 0, conclusions: [] }, null, 2) + "\n",
  ".yaaw-ios/project/device.json": JSON.stringify({ schema: "yaaw-ios-device-v1", revision: 0, state: "DEVICE_NOT_CONFIGURED", evidence: [] }, null, 2) + "\n",
  ".yaaw-ios/project/research/README.md": "# Research\n\nPersist only bounded, decision-relevant research with source dates.\n",
  ".yaaw-ios/project/specs/README.md": "# Specifications\n\nAccepted engineering implementation contracts live here.\n",
  ".yaaw-ios/project/tickets/README.md": "# Tickets\n\nTicket frontmatter owns lifecycle status.\n",
  ".yaaw-ios/project/evidence/README.md": "# Evidence\n\nImmutable verification records. Name the execution environment precisely.\n",
  ".yaaw-ios/project/reviews/README.md": "# Reviews\n\nImmutable independent review rounds.\n",
  ".yaaw-ios/project/rules/README.md": "# Project rules\n\nReusable accepted project-local invariants.\n"
};

const CODEX_ROLES = {
  environment: "Environment/device authority. Use only for a YAAW-iOS handoff whose role is ios-environment.",
  prd: "YAAW-iOS PRD authority. Own product meaning, not engineering architecture.",
  planner: "YAAW-iOS Planner authority. Inspect the repository before architecture.",
  implementer: "YAAW-iOS Implementer. Work one admitted ticket and never self-approve.",
  reviewer: "YAAW-iOS Reviewer. Independently inspect repository/evidence; return PASS, REPAIR, REPLAN, or BLOCKED."
};

export async function install(projectPath, options = {}) {
  const root = await resolveProjectRoot(projectPath);
  if (!(await exists(root))) throw new Error(`Project root must already exist: ${root}`);

  const failAfter = options.failAfter ?? (process.env.YAAW_IOS_TEST_FAIL_AFTER ? Number(process.env.YAAW_IOS_TEST_FAIL_AFTER) : null);
  const tx = new Transaction(root, failAfter);
  const changed = [];
  const managedWholePaths = [];

  try {
    const systemSource = join(PACKAGE_ROOT, "framework", ".yaaw-ios", "system");
    for (const source of await walkFiles(systemSource)) {
      const rel = relative(systemSource, source).replaceAll("\\", "/");
      const destination = join(root, ".yaaw-ios", "system", rel);
      managedWholePaths.push(destination);
      if (await tx.write(destination, await readFile(source))) changed.push(relative(root, destination).replaceAll("\\", "/"));
    }

    const skillsSource = join(PACKAGE_ROOT, "skills");
    for (const source of await walkFiles(skillsSource)) {
      const rel = relative(skillsSource, source).replaceAll("\\", "/");
      const destination = join(root, ".agents", "skills", rel);
      managedWholePaths.push(destination);
      if (await tx.write(destination, await readFile(source))) changed.push(relative(root, destination).replaceAll("\\", "/"));
    }

    for (const [rel, content] of Object.entries(PROJECT_DEFAULTS)) {
      const destination = join(root, rel);
      await assertSafeDestination(root, destination);
      if (!(await exists(destination))) {
        if (await tx.write(destination, content)) changed.push(rel);
      }
    }

    const agentsPath = join(root, "AGENTS.md");
    const currentAgents = await readOptional(agentsPath);
    const agentsBlock = [
      "# YAAW-iOS",
      "",
      "This project has YAAW-iOS installed.",
      "",
      "- Root Codex session is the Orchestrator. Do not spawn a child Orchestrator.",
      "- Run `node .yaaw-ios/system/engine/runtime.mjs --workspace . --invoke-skill <skill>` before semantic YAAW-iOS work.",
      "- Canonical semantic logic lives in `.yaaw-ios/system/`; provider files and skills are adapters only.",
      "- Durable accepted truth lives in `.yaaw-ios/project/`; `.yaaw-ios/runtime/` is replaceable.",
      "- Never modify `.yaaw-ios/system/**` from application work. Use `yaaw-ios repair` for framework integrity failures.",
      "- Windows does not provide Xcode. Classify macOS-native operations honestly."
    ].join("\n");
    const nextAgents = renderManagedSection(currentAgents, "bootstrap", agentsBlock);
    if (await tx.write(agentsPath, nextAgents)) changed.push("AGENTS.md");

    const runtimePath = join(root, ".codex", "yaaw-ios-runtime.md");
    managedWholePaths.push(runtimePath);
    const runtimeContent = `# YAAW-iOS Codex runtime\n\nThe root session is Orchestrator. Read the generated handoff in .yaaw-ios/runtime/handoff.json, then dispatch only the named authority in a fresh worker context when required. Canonical role semantics live under .yaaw-ios/system/roles/. Reviewer handoffs require semantic independence from Implementer.\n`;
    if (await tx.write(runtimePath, runtimeContent)) changed.push(".codex/yaaw-ios-runtime.md");

    for (const role of Object.keys(CODEX_ROLES)) {
      const rolePath = join(root, ".codex", "agents", `yaaw-ios-${role}.toml`);
      managedWholePaths.push(rolePath);
      const roleContent = `# YAAW-iOS ${role} authority worker.\n# Inherit user/project model and reasoning settings. Canonical semantics live in .yaaw-ios/system/roles/.\n`;
      if (await tx.write(rolePath, roleContent)) changed.push(relative(root, rolePath).replaceAll("\\", "/"));
    }

    const codexConfigPath = join(root, ".codex", "config.toml");
    const currentConfig = await readOptional(codexConfigPath);
    const configLines = [];
    for (const [role, description] of Object.entries(CODEX_ROLES)) {
      const key = role === "environment" ? "environment" : role;
      configLines.push(
        `[agents.yaaw_ios_${key.replaceAll("-", "_")}]`,
        `description = ${JSON.stringify(description)}`,
        `config_file = ${JSON.stringify(`agents/yaaw-ios-${role}.toml`)}`,
        ""
      );
    }
    const nextConfig = renderManagedSection(currentConfig, "codex-agents", configLines.join("\n"));
    if (await tx.write(codexConfigPath, nextConfig)) changed.push(".codex/config.toml");

    const runtimeRoot = join(root, ".yaaw-ios", "runtime");
    if (await exists(runtimeRoot)) {
      // Runtime is derived. Invalidate after framework install/update.
      await rm(runtimeRoot, { recursive: true, force: true });
    }

    const managedFiles = [];
    for (const path of [...new Set(managedWholePaths)]) {
      managedFiles.push({
        path: relative(root, path).replaceAll("\\", "/"),
        sha256: await sha256File(path)
      });
    }
    for (const [path, sectionId] of [[agentsPath, "bootstrap"], [codexConfigPath, "codex-agents"]]) {
      const section = extractManagedSection(await readFile(path, "utf8"), sectionId);
      managedFiles.push({
        path: relative(root, path).replaceAll("\\", "/"),
        kind: "managed-section",
        section_id: sectionId,
        sha256: sha256Bytes(Buffer.from(section))
      });
    }
    managedFiles.sort((a, b) => a.path.localeCompare(b.path));

    const manifestPath = join(root, ".yaaw-ios", "install", "manifest.json");
    let previousManifest = null;
    try { previousManifest = JSON.parse(await readFile(manifestPath, "utf8")); } catch {}
    const manifest = {
      schema: "yaaw-ios-install-manifest-v1",
      package_version: PACKAGE_JSON.version,
      project_schema: 1,
      installed_at: previousManifest?.installed_at ?? new Date().toISOString(),
      framework_root: ".yaaw-ios",
      managed_files: managedFiles,
      protected_roots: [".yaaw-ios/project"],
      runtime_roots: [".yaaw-ios/runtime"]
    };
    if (await tx.write(manifestPath, JSON.stringify(manifest, null, 2) + "\n")) changed.push(".yaaw-ios/install/manifest.json");

    return { root, changed, manifest };
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

async function readOptional(path) {
  try { return await readFile(path, "utf8"); } catch { return ""; }
}

export async function repair(projectPath, options = {}) {
  return install(projectPath, options);
}

export { PACKAGE_ROOT };
