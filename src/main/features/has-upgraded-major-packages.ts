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

export type PackageUpgradeLevels = {
  major: boolean;
  minor: boolean;
  patch: boolean;
};

/**
 * Returns which upgrade levels (major, minor, patch) exist in the PR by comparing
 * package.json at base and head (only considers package.json).
 * Major bumps count toward `major` only when the package remains in `dependencies` on head
 * (devDependency-only upgrades do not trigger the automatic major label).
 */
export async function getPackageUpgradeLevels(port: Port): Promise<PackageUpgradeLevels> {
  const result: PackageUpgradeLevels = { major: false, minor: false, patch: false };
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
    return result;
  }

  const baseDeps = allDeps(basePkg);
  const headDeps = allDeps(headPkg);

  for (const [name, headVersion] of Object.entries(headDeps)) {
    const baseVersion = baseDeps[name];
    if (baseVersion === undefined) {
      continue;
    }

    const baseParts = parseSemver(baseVersion);
    const headParts = parseSemver(headVersion);
    if (baseParts == null || headParts == null) {
      continue;
    }

    const [bMaj, bMin, bPatch] = baseParts;
    const [hMaj, hMin, hPatch] = headParts;

    const isProdDependencyOnHead = headPkg.dependencies?.[name] !== undefined;

    if (hMaj > bMaj) {
      if (isProdDependencyOnHead) {
        result.major = true;
      }
    } else if (hMaj === bMaj && hMin > bMin) {
      result.minor = true;
    } else if (hMaj === bMaj && hMin === bMin && hPatch > bPatch) {
      result.patch = true;
    }
  }

  return result;
}

/**
 * Returns true if the PR introduces at least one production dependency whose major version
 * increased compared to the base ref (only considers package.json; devDependencies excluded).
 */
export async function hasUpgradeMajorPackages(port: Port): Promise<boolean> {
  const levels = await getPackageUpgradeLevels(port);
  return levels.major;
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
 * Parse version string into [major, minor, patch]; missing parts are 0 (e.g. "^2.1.0" -> [2,1,0], "1" -> [1,0,0]).
 */
function parseSemver(version: string): [number, number, number] | null {
  const stripped = version.replace(/^[\^~>=<]*/i, "").trim();
  const parts = stripped.split(".").map(s => parseInt(s, 10));
  if (parts.length < 1 || parts.some(n => Number.isNaN(n))) {
    return null;
  }
  return [parts[0], parts[1] ?? 0, parts[2] ?? 0];
}

function allDeps(pkg: PackageJson): Record<string, string> {
  return { ...pkg.dependencies, ...pkg.devDependencies };
}
