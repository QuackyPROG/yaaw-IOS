import { lstat, realpath, stat } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { exists } from "../util/fs.mjs";

async function closestExisting(path) {
  let current = path;
  while (!(await exists(current))) {
    const parent = dirname(current);
    if (parent === current) throw new Error(`No existing parent for ${path}`);
    current = parent;
  }
  return current;
}

export function isWithin(root, target) {
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

export async function resolveProjectRoot(requested) {
  const absolute = resolve(requested);
  if (await exists(absolute)) {
    const info = await stat(absolute);
    if (!info.isDirectory()) throw new Error(`Project path is not a directory: ${absolute}`);
    return realpath(absolute);
  }
  const parent = await closestExisting(dirname(absolute));
  const parentReal = await realpath(parent);
  return resolve(parentReal, relative(parent, absolute));
}

export async function assertSafeDestination(projectRoot, destination) {
  const root = resolve(projectRoot);
  const target = resolve(destination);
  if (!isWithin(root, target)) throw new Error(`Refusing write outside project root: ${target}`);

  if (!(await exists(root))) return;
  const rootReal = await realpath(root);
  if (target === root || target === rootReal) return;

  const existingParent = await closestExisting(dirname(target));
  const parentReal = await realpath(existingParent);
  if (!isWithin(rootReal, parentReal)) {
    throw new Error(`Symlink/path escape outside project root: ${target}`);
  }

  if (await exists(target)) {
    const info = await lstat(target);
    if (info.isSymbolicLink()) {
      const targetReal = await realpath(target);
      if (!isWithin(rootReal, targetReal)) throw new Error(`Existing target resolves outside project root: ${target}`);
    }
  }
}

export async function assertRelativeManagedPath(projectRoot, relPath) {
  if (!relPath || isAbsolute(relPath) || relPath.split(/[\\/]+/).includes("..")) {
    throw new Error(`Unsafe managed path: ${relPath}`);
  }
  const target = resolve(projectRoot, relPath);
  await assertSafeDestination(projectRoot, target);
  return target;
}
