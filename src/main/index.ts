import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { evaluateLabel } from "./features/evaluate-label";
import { getPRContext } from "./features/get-pr-context";
import { getPackageUpgradeLevels } from "./features/has-upgraded-major-packages";
import { loadConfig } from "./features/load-config";
import { writeLabels } from "./write-labels";

export async function main(): Promise<void> {
  if (context.eventName !== "pull_request") {
    core.info("This action only runs on pull_request events");
    return;
  }

  const token = core.getInput("github-token", { required: true });
  const configPath = core.getInput("config-path");
  const configRepoInput = core.getInput("config-repo").trim();

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issueNumber = context.issue.number;

  const octokit: ReturnType<typeof getOctokit> = getOctokit(token);

  const pr = await octokit.rest.pulls.get({ owner, repo, pull_number: issueNumber });

  const configSource = await (async (): Promise<{ owner: string; repo: string; ref: string }> => {
    if (configRepoInput === "") {
      return { owner, repo, ref: pr.data.head.sha };
    }
    const parts = configRepoInput.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      throw new Error(`config-repo must be "owner/repo", got: ${JSON.stringify(configRepoInput)}`);
    }
    const [configOwner, configRepo] = parts;
    const { data } = await octokit.rest.repos.get({ owner: configOwner, repo: configRepo });
    return { owner: configOwner, repo: configRepo, ref: data.default_branch };
  })();

  const [labelerConfig, prContext] = await Promise.all([
    loadConfig({
      octokit,
      owner: configSource.owner,
      repo: configSource.repo,
      ref: configSource.ref,
      configPath: configPath || undefined,
    }),
    getPRContext({ octokit, owner, repo, pullNumber: issueNumber }),
  ]);

  if (labelerConfig == null) {
    const message = `Config file not found or invalid: ${configPath || ".github/pull-request-labeler.yml"} in ${configSource.owner}/${configSource.repo} (ref: ${configSource.ref})`;
    throw new Error(message);
  }

  core.info("Configuration detected");

  const semverMajorLabel =
    labelerConfig.labelsNames?.semverMajor ?? "semver:major";
  const semverMinorLabel =
    labelerConfig.labelsNames?.semverMinor ?? "semver:minor";
  const semverPatchLabel =
    labelerConfig.labelsNames?.semverPatch ?? "semver:patch";

  const labelsToAdd: string[] = [];
  const labelsToRemove: string[] = [];

  if (labelerConfig.labels) {
    for (const labelConfig of labelerConfig.labels) {
      const matches = evaluateLabel(prContext, labelConfig);
      if (matches) {
        labelsToAdd.push(labelConfig.label);
      } else if (labelConfig.sync) {
        labelsToRemove.push(labelConfig.label);
      }
    }
  }

  const autoFeatures = labelerConfig.automaticFeatures;
  const needsUpgradeLevels =
    autoFeatures?.majorPackagesUpgradedTriggersMajorLabel === true ||
    autoFeatures?.minorPackagesUpgradedTriggersMinorLabel === true ||
    autoFeatures?.patchPackagesUpgradedTriggersPatchLabel === true;

  if (needsUpgradeLevels) {
    const levels = await getPackageUpgradeLevels({
      octokit,
      owner,
      repo,
      pullNumber: issueNumber,
    });

    if (autoFeatures?.majorPackagesUpgradedTriggersMajorLabel === true) {
      if (levels.major) {
        core.info("Major packages upgraded in this pull request");
        labelsToAdd.push(semverMajorLabel);
      } else {
        labelsToRemove.push(semverMajorLabel);
      }
    }
    if (autoFeatures?.minorPackagesUpgradedTriggersMinorLabel === true) {
      // Do not add minor label from automatic feature; only remove when not applicable.
      if (!(levels.minor && !levels.major)) {
        labelsToRemove.push(semverMinorLabel);
      }
    }
    if (autoFeatures?.patchPackagesUpgradedTriggersPatchLabel === true) {
      // Do not add patch label from automatic feature; only remove when not applicable.
      if (!(levels.patch && !levels.minor && !levels.major)) {
        labelsToRemove.push(semverPatchLabel);
      }
    }
  }

  const currentLabels = await octokit.rest.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number: issueNumber,
  });

  const currentSet = new Set<string>(currentLabels.data.map((label: { name: string }) => label.name));

  await writeLabels(octokit, context, currentSet, labelsToAdd, labelsToRemove);
}

if (process.env.VITEST !== "true") {
  main().catch(err => {
    core.setFailed(err instanceof Error ? err.message : String(err));
  });
}
