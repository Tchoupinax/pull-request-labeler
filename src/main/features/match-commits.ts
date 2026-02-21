import { matchPattern } from "./regex-utils";
import type { MatcherConfig, PRContext } from "./types";

/**
 * Returns true if the matcher has no commits rule or any commit message matches the pattern.
 */
export function matchCommits(
  context: PRContext,
  matcher: MatcherConfig,
): boolean {
  if (matcher.commits == null || matcher.commits === "") {
    return true;
  }
  return context.commitMessages.some(msg =>
    matchPattern(msg, matcher.commits!),
  );
}
