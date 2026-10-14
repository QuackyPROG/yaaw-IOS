import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

function git(root, args) {
  const run = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (run.status !== 0) return null;
  return run.stdout.trim();
}

export function repositoryIdentity(root) {
  const top = git(root, ["rev-parse", "--show-toplevel"]);
  if (!top) return { versioned: false, exact: false, reason: "not a git repository" };
  const head = git(root, ["rev-parse", "HEAD"]);
  if (!head) return { versioned: true, exact: false, reason: "repository has no commit yet" };

  const porcelain = git(root, ["status", "--porcelain=v1", "--untracked-files=all"]) ?? "";
  const filtered = porcelain
    .split(/\r?\n/)
    .filter(Boolean)
    .filter(line => {
      const path = line.slice(3).replaceAll("\\", "/");
      return !path.startsWith(".yaaw-ios/runtime/")
        && !path.startsWith(".yaaw-ios/project/evidence/")
        && !path.startsWith(".yaaw-ios/project/reviews/");
    })
    .join("\n");
  const digest = createHash("sha256").update(`${head}\n${filtered}\n`).digest("hex");
  return {
    versioned: true,
    exact: true,
    head,
    dirty: Boolean(filtered),
    worktreeDigest: digest
  };
}
