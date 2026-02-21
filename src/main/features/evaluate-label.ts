import { matchAuthor } from "./match-author";
import { matchBaseBranch } from "./match-base-branch";
import { matchBody } from "./match-body";
import { matchBranch } from "./match-branch";
import { matchComment } from "./match-comment";
import { matchCommits } from "./match-commits";
import { matchFiles } from "./match-files";
import { matchTitle } from "./match-title";
import type { LabelConfig, PRContext } from "./types";

/**
 * Returns true if the PR context matches all matcher rules for this label.
 */
export function evaluateLabel(
  context: PRContext,
  labelConfig: LabelConfig,
): boolean {
  const { matcher } = labelConfig;
  return (
    matchTitle(context, matcher) &&
    matchBody(context, matcher) &&
    matchComment(context, matcher) &&
    matchBranch(context, matcher) &&
    matchBaseBranch(context, matcher) &&
    matchCommits(context, matcher) &&
    matchAuthor(context, matcher) &&
    matchFiles(context, matcher.files)
  );
}
