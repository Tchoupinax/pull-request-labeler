import type { getOctokit } from "@actions/github";

import type { PRContext } from "./types";

type Port = {
  octokit: ReturnType<typeof getOctokit>;
  owner: string;
  repo: string;
  pullNumber: number;
};

/**
 * Fetch PR title, body, author, branches, changed files, comments, and commit messages.
 */
export async function getPRContext(port: Port): Promise<PRContext> {
  const { octokit, owner, repo, pullNumber } = port;

  const [{ data: pr }, files, comments, commits] = await Promise.all([
    octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber }),
    octokit.paginate(octokit.rest.pulls.listFiles, {
      owner,
      repo,
      pull_number: pullNumber,
    }),
    octokit.paginate(octokit.rest.issues.listComments, {
      owner,
      repo,
      issue_number: pullNumber,
    }),
    octokit.paginate(octokit.rest.pulls.listCommits, {
      owner,
      repo,
      pull_number: pullNumber,
    }),
  ]);

  const filePaths = files.map((f: { filename: string }) => f.filename);
  const commentBodies = comments.map((c: { body?: string | null }) => c.body ?? "");
  const commitMessages = commits.map(
    (c: { commit: { message: string } }) => c.commit.message,
  );

  return {
    title: pr.title ?? "",
    body: pr.body ?? null,
    author: pr.user?.login ?? "",
    headBranch: pr.head.ref,
    baseBranch: pr.base.ref,
    filePaths,
    comments: commentBodies,
    commitMessages,
  };
}
