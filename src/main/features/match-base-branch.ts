import { matchPattern } from "./regex-utils";
import type { MatcherConfig, PRContext } from "./types";

/**
 * Returns true if the matcher has no baseBranch rule or the PR base branch matches the pattern.
 */
export function matchBaseBranch(
  context: PRContext,
  matcher: MatcherConfig,
): boolean {
  if (matcher.baseBranch == null || matcher.baseBranch === "") {
    return true;
  }
  return matchPattern(context.baseBranch, matcher.baseBranch);
}
