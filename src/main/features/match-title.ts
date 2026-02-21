import { matchPattern } from "./regex-utils";
import type { MatcherConfig, PRContext } from "./types";

/**
 * Returns true if the matcher has no title rule or the PR title matches the pattern.
 */
export function matchTitle(
  context: PRContext,
  matcher: MatcherConfig,
): boolean {
  if (matcher.title == null || matcher.title === "") {
    return true;
  }

  return matchPattern(context.title, matcher.title);
}
