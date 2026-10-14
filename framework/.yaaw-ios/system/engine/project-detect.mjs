import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { lstat } from "node:fs/promises";
async function exists(path) { try { await lstat(path); return true; } catch { return false; } }

function dependencySet(pkg) {
  return new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {})
  ]);
}

export async function detectProjectType(root) {
  const packagePath = join(root, "package.json");
  const iosDir = join(root, "ios");
  const androidDir = join(root, "android");
  const appJson = join(root, "app.json");
  const appConfigJs = join(root, "app.config.js");
  const appConfigTs = join(root, "app.config.ts");

  if (!(await exists(packagePath))) {
    const entries = (await import("node:fs/promises")).readdir(root).catch(() => []);
    const list = await entries;
    const meaningful = list.filter(x => ![".git", ".gitignore", "README.md", "AGENTS.md", ".yaaw-ios", ".agents", ".codex"].includes(x));
    if (meaningful.length === 0) return { type: "EMPTY_PROJECT", reasons: ["no package.json and no application files"] };
    if (await exists(iosDir)) return { type: "EXISTING_NATIVE_IOS_PROJECT", reasons: ["ios/ exists without JavaScript package metadata"] };
    return { type: "UNKNOWN", reasons: ["non-empty repository without package.json"] };
  }

  let pkg;
  try { pkg = JSON.parse(await readFile(packagePath, "utf8")); }
  catch { return { type: "UNKNOWN", reasons: ["package.json is invalid JSON"] }; }

  const deps = dependencySet(pkg);
  const hasExpo = deps.has("expo");
  const hasReactNative = deps.has("react-native");
  const hasNativeFolders = (await exists(iosDir)) || (await exists(androidDir));
  const hasExpoConfig = (await exists(appJson)) || (await exists(appConfigJs)) || (await exists(appConfigTs));

  if (hasExpo) {
    return {
      type: "EXISTING_EXPO_PROJECT",
      reasons: ["expo dependency detected"],
      packageManager: await detectPackageManager(root),
      expoVersion: pkg.dependencies?.expo ?? pkg.devDependencies?.expo ?? null,
      reactNativeVersion: pkg.dependencies?.["react-native"] ?? pkg.devDependencies?.["react-native"] ?? null,
      hasNativeFolders,
      hasExpoConfig
    };
  }

  if (hasReactNative) {
    return {
      type: "EXISTING_REACT_NATIVE_PROJECT",
      reasons: ["react-native dependency detected"],
      packageManager: await detectPackageManager(root),
      reactNativeVersion: pkg.dependencies?.["react-native"] ?? pkg.devDependencies?.["react-native"] ?? null,
      hasNativeFolders
    };
  }

  if (await exists(iosDir)) return { type: "EXISTING_CROSS_PLATFORM_PROJECT", reasons: ["ios/ and package.json detected"] };
  return { type: "UNKNOWN", reasons: ["package.json present but Expo/React Native not detected"] };
}

export async function detectPackageManager(root) {
  if (await exists(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (await exists(join(root, "yarn.lock"))) return "yarn";
  if (await exists(join(root, "bun.lockb")) || await exists(join(root, "bun.lock"))) return "bun";
  if (await exists(join(root, "package-lock.json"))) return "npm";
  return null;
}
