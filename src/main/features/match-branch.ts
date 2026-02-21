import { matchPattern } from "./regex-utils";
import type { MatcherConfig, PRContext } from "./types";

/**
 * Returns true if the matcher has no branch rule or the PR head branch matches the pattern.
 */
export function matchBranch(
  context: PRContext,
  matcher: MatcherConfig,
): boolean {
  if (matcher.branch == null || matcher.branch === "") {
    return true;
  }
  return matchPattern(context.headBranch, matcher.branch);
}
