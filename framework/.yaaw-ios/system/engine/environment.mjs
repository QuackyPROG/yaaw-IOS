import os from "node:os";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { lstat, readFile } from "node:fs/promises";
import { detectProjectType } from "./project-detect.mjs";

async function exists(path) { try { await lstat(path); return true; } catch { return false; } }

export async function runCommand(command, args = [], options = {}) {
  const timeoutMs = options.timeoutMs ?? 3000;
  return new Promise(resolve => {
    let stdout = "", stderr = "", settled = false, child;
    try {
      child = spawn(command, args, { cwd: options.cwd, shell: false, windowsHide: true, env: { ...process.env, ...(options.env ?? {}) } });
    } catch (error) {
      resolve({ ok: false, code: null, stdout, stderr: String(error), error: "spawn" }); return;
    }
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true; child.kill();
      resolve({ ok: false, code: null, stdout, stderr, error: "timeout" });
    }, timeoutMs);
    child.stdout?.on("data", x => stdout += x.toString());
    child.stderr?.on("data", x => stderr += x.toString());
    child.on("error", error => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      resolve({ ok: false, code: null, stdout, stderr: `${stderr}${error.message}`, error: "spawn" });
    });
    child.on("close", code => {
      if (settled) return;
      settled = true; clearTimeout(timer);
      resolve({ ok: code === 0, code, stdout: stdout.trim(), stderr: stderr.trim(), error: null });
    });
  });
}

const item = (id, status, summary, details = null) => ({ id, status, summary, ...(details ? { details } : {}) });
const firstLine = text => String(text ?? "").split(/\r?\n/).find(Boolean) ?? "";

async function versionCheck(run, id, command, args = ["--version"], optional = false) {
  const result = await run(command, args, { timeoutMs: 2500 });
  return result.ok ? item(id, "PASS", firstLine(result.stdout || result.stderr))
    : item(id, optional ? "OPTIONAL" : "ACTION_REQUIRED", `${command} not available`);
}

async function packageJson(root) {
  try { return JSON.parse(await readFile(join(root, "package.json"), "utf8")); } catch { return null; }
}

async function bundleIdentifier(root) {
  const appJson = join(root, "app.json");
  if (await exists(appJson)) {
    try { return JSON.parse(await readFile(appJson, "utf8"))?.expo?.ios?.bundleIdentifier ?? null; } catch {}
  }
  return (await packageJson(root))?.expo?.ios?.bundleIdentifier ?? null;
}

export async function inspectEnvironment(root, options = {}) {
  const run = options.runCommand ?? runCommand;
  const platform = options.platform ?? process.platform;
  const checks = [
    item("os", platform === "win32" ? "PASS" : "WARNING", `${os.type()} ${os.release()} (${platform})`,
      platform === "win32" ? "Primary supported host." : "v0.1 is optimized for Windows.")
  ];

  checks.push(await versionCheck(run, "git", "git"));
  checks.push(await versionCheck(run, "node", "node"));
  checks.push(await versionCheck(run, "npm", "npm"));
  checks.push(await versionCheck(run, "codex", "codex", ["--version"], true));
  checks.push(await versionCheck(run, "eas-cli", "eas", ["--version"]));

  const project = await detectProjectType(root);
  checks.push(item("project", project.type === "UNKNOWN" ? "WARNING" : "PASS", project.type, project.reasons?.join("; ")));

  const pkg = await packageJson(root);
  const deps = { ...(pkg?.dependencies ?? {}), ...(pkg?.devDependencies ?? {}) };
  if (deps.expo) checks.push(item("expo", "PASS", `project Expo dependency ${deps.expo}`));
  else if (project.type === "EMPTY_PROJECT") checks.push(item("expo", "ACTION_REQUIRED", "Expo not configured; bootstrap only after product/planning readiness"));
  else checks.push(item("expo", "WARNING", "Expo dependency not detected"));

  checks.push(item("eas-project-config", await exists(join(root, "eas.json")) ? "PASS" : "WARNING",
    await exists(join(root, "eas.json")) ? "eas.json present" : "eas.json not present"));

  const auth = await run("eas", ["whoami"], { timeoutMs: 4000 });
  checks.push(item("expo-auth", auth.ok ? "PASS" : "ACTION_REQUIRED",
    auth.ok ? `EAS authenticated as ${firstLine(auth.stdout)}` : "EAS authentication not confirmed"));

  const bid = await bundleIdentifier(root);
  checks.push(item("ios-bundle-id", bid ? "PASS" : "WARNING", bid ? `bundle identifier configured: ${bid}` : "iOS bundle identifier not detected"));

  if (platform === "win32") {
    checks.push(item("xcode", "UNAVAILABLE_ON_WINDOWS", "Xcode/iOS Simulator are not available locally on Windows",
      "Use EAS/macOS infrastructure for native iOS compilation and simulator testing."));
  } else checks.push(await versionCheck(run, "xcode", "xcodebuild", ["-version"], true));

  const pmd = await versionCheck(run, "pymobiledevice3", "pymobiledevice3", ["--version"], true);
  const goios = await versionCheck(run, "go-ios", "ios", ["--version"], true);
  checks.push(pmd, goios);

  let deviceDetected = false, method = null;
  if (pmd.status === "PASS") {
    const found = await run("pymobiledevice3", ["usbmux", "list"], { timeoutMs: 3500 });
    deviceDetected = found.ok && /\S/.test(found.stdout) && !/^\s*\[\s*\]\s*$/.test(found.stdout);
    if (deviceDetected) method = "pymobiledevice3";
  }
  if (!deviceDetected && goios.status === "PASS") {
    const found = await run("ios", ["list"], { timeoutMs: 3500 });
    deviceDetected = found.ok && /\S/.test(found.stdout) && !/no devices/i.test(found.stdout);
    if (deviceDetected) method = "go-ios";
  }
  checks.push(item("physical-iphone", deviceDetected ? "PASS" : "OPTIONAL",
    deviceDetected ? `iPhone/iOS device visibility detected via ${method}` : "No optional CLI device visibility detected",
    "Detection does not prove Developer Mode, signing, development-build installation, or UI automation readiness."));
  checks.push(item("apple-developer", "WARNING", "Apple Developer Program/signing eligibility is verified at build/credential time",
    "Do not store Apple credentials in YAAW-iOS artifacts."));

  const statuses = ["PASS", "WARNING", "ACTION_REQUIRED", "UNAVAILABLE_ON_WINDOWS", "OPTIONAL"];
  return {
    schema: "yaaw-ios-environment-observation-v1",
    observed_at: new Date().toISOString(),
    host: { platform, release: os.release(), arch: os.arch() },
    project,
    checks,
    summary: Object.fromEntries(statuses.map(status => [status, checks.filter(x => x.status === status).length]))
  };
}
