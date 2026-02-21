import * as core from "@actions/core";
import { getOctokit } from "@actions/github";
import { Context } from "@actions/github/lib/context";

export async function writeLabels(
  octokit: ReturnType<typeof getOctokit>,
  context: Context,
  currentSet: Set<string>,
  labelsToAdd: Array<string>,
  labelsToRemove: Array<string>,
) {
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const issueNumber = context.issue.number;

  core.info(`Labels to remove [${labelsToRemove.join(",")}]`);
  for (const label of labelsToRemove) {
    if (currentSet.has(label)) {
      await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      });
      core.info(`Removed label (sync): ${label}`);
    }
  }

  core.info(`Labels to add [${labelsToAdd.join(",")}]`);
  for (const label of labelsToAdd) {
    if (!currentSet.has(label)) {
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels: [label],
      });
      core.info(`Added label: ${label}`);
    }
  }
}
