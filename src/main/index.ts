import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";

import { match } from "ts-pattern";

import { evaluateLabel } from "./features/evaluate-label";
import { getPRContext } from "./features/get-pr-context";
import { hasUpgradeMajorPackages } from "./features/has-upgraded-major-packages";
import { loadConfig } from "./features/load-config";
import { writeLabels } from "./write-labels";

export async function main(): Promise<void> {
  if (context.eventName !== "pull_request") {
    core.info("This action only runs on pull_request events");
    return;
  }

  const token = core.getInput("github-token", { required: true });
  const configPath = core.getInput("config-path", { required: true });

  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issueNumber = context.issue.number;

  const octokit: ReturnType<typeof getOctokit> = getOctokit(token);

  const pr = await octokit.rest.pulls.get({ owner, repo, pull_number: issueNumber });

  const [labelerConfig, prContext] = await Promise.all([
    loadConfig({ octokit, owner, repo, ref: pr.data.head.sha, configPath }),
    getPRContext({ octokit, owner, repo, pullNumber: issueNumber }),
  ]);

  if (labelerConfig == null) {
    const message = `Config file not found or invalid: ${configPath} (ref: ${pr.data.head.sha})`;
    throw new Error(message);
  }

  core.info("Configuration detected");

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

  await match(labelerConfig.automaticFeatures)
    .with({ majorPackagesUpgradedTriggersMajorLabel: true }, async () => {
      if (await hasUpgradeMajorPackages({ octokit, owner, repo, pullNumber: issueNumber })) {
        core.info("Major packages upgraded in this pull request");
        labelsToAdd.push("major");
      } else {
        labelsToRemove.push("major");
      }
    })
    .otherwise(() => {});

  const currentLabels = await octokit.rest.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number: issueNumber,
  });

  const currentSet = new Set<string>(currentLabels.data.map((label: { name: string }) => label.name));

  await writeLabels(octokit, context, currentSet, labelsToAdd, labelsToRemove);
}

if (process.env.VITEST !== "true") {
  main().catch((err) => {
    core.setFailed(err instanceof Error ? err.message : String(err));
  });
}
