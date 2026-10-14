const MACOS_PATTERNS = [
  /^ios\//,
  /\.xcodeproj\//,
  /\.xcworkspace\//,
  /\.pbxproj$/,
  /\.swift$/,
  /\.m$/,
  /\.mm$/,
  /\.h$/
];

const NATIVE_CONFIG_PATTERNS = [
  /(^|\/)app\.json$/,
  /(^|\/)app\.config\.(js|ts|mjs|cjs)$/,
  /(^|\/)eas\.json$/,
  /(^|\/)plugins?\//,
  /(^|\/)entitlements(\.|\/)/i,
  /Info\.plist$/i
];

const JS_PATTERNS = [
  /\.(js|jsx|ts|tsx|css|json|md)$/,
  /(^|\/)app\//,
  /(^|\/)src\//
];

export function classifyNativeBoundary({ changedPaths = [], dependencyChanges = [], configPluginChanged = false } = {}) {
  const normalized = changedPaths.map(p => p.replaceAll("\\", "/"));

  if (normalized.some(path => MACOS_PATTERNS.some(rx => rx.test(path)))) {
    return result("MACOS_REQUIRED", true, "native iOS source/project changed");
  }
  if (dependencyChanges.some(dep => dep.kind === "custom-native-module")) {
    return result("CUSTOM_NATIVE_MODULE", true, "custom native module dependency changed");
  }
  if (configPluginChanged || dependencyChanges.some(dep => dep.kind === "config-plugin")) {
    return result("CONFIG_PLUGIN", true, "Expo config plugin changed");
  }
  if (dependencyChanges.some(dep => dep.native === true)) {
    return result("NATIVE_REBUILD_REQUIRED", true, "native dependency changed");
  }
  if (normalized.some(path => NATIVE_CONFIG_PATTERNS.some(rx => rx.test(path)))) {
    return result("NATIVE_REBUILD_REQUIRED", true, "native application configuration changed");
  }
  if (normalized.length > 0 && normalized.every(path => JS_PATTERNS.some(rx => rx.test(path)))) {
    return result("JS_ONLY", false, "JavaScript/TypeScript/content-only change");
  }
  if (normalized.length === 0 && dependencyChanges.length === 0) {
    return result("JS_ONLY", false, "no native-boundary signal");
  }
  return result("EXPO_MANAGED", false, "no definite native rebuild signal; planner should confirm unfamiliar files");
}

function result(classification, nativeRebuildRequired, reason) {
  return { classification, nativeRebuildRequired, reason };
}

export const NATIVE_BOUNDARY_VALUES = [
  "JS_ONLY",
  "EXPO_MANAGED",
  "CONFIG_PLUGIN",
  "NATIVE_REBUILD_REQUIRED",
  "CUSTOM_NATIVE_MODULE",
  "MACOS_REQUIRED",
  "UNSUPPORTED_ON_CURRENT_HOST"
];
