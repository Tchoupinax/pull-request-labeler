import type { getOctokit } from "@actions/github";

type PackageJson = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type Port = {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repo: string;
  pullNumber: number;
};

/**
 * Returns true if the PR introduces at least one dependency whose major version increased
 * compared to the base ref (only considers package.json).
 */
export async function hasUpgradeMajorPackages(port: Port): Promise<boolean> {
  const { octokit, owner, repo, pullNumber } = port;

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const baseRef = pr.base.sha;
  const headRef = pr.head.sha;

  const [basePkg, headPkg] = await Promise.all([
    getPackageJsonAtRef(octokit, owner, repo, baseRef),
    getPackageJsonAtRef(octokit, owner, repo, headRef),
  ]);

  if (!basePkg || !headPkg) {
    return false;
  }

  const baseDeps = allDeps(basePkg);
  const headDeps = allDeps(headPkg);

  for (const [name, headVersion] of Object.entries(headDeps)) {
    const baseVersion = baseDeps[name];
    if (baseVersion === undefined) {
      continue;
    }

    const baseMajor = getMajorVersion(baseVersion);
    const headMajor = getMajorVersion(headVersion);

    if (baseMajor !== null && headMajor !== null && headMajor > baseMajor) {
      return true;
    }
  }

  return false;
}

async function getPackageJsonAtRef(
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repo: string,
  ref: string,
): Promise<PackageJson | null> {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: "package.json",
      ref,
    });
    if (Array.isArray(data) || !("content" in data)) {
      return null;
    }
    const content = data.content;
    if (typeof content !== "string") {
      return null;
    }
    const decoded = Buffer.from(content, "base64").toString("utf-8");
    return JSON.parse(decoded) as PackageJson;
  } catch {
    return null;
  }
}

/**
 * Extract the major version number from a version string or range (e.g. "^2.1.0" -> 2, "1.0.0" -> 1).
 */
function getMajorVersion(version: string): number | null {
  const match = version.replace(/^[\^~>=<]*/i, "").match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function allDeps(pkg: PackageJson): Record<string, string> {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}
