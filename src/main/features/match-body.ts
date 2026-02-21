import { matchPattern } from "./regex-utils";
import type { MatcherConfig, PRContext } from "./types";

/**
 * Returns true if the matcher has no body rule or the PR body matches the pattern.
 */
export function matchBody(context: PRContext, matcher: MatcherConfig): boolean {
  if (matcher.body == null || matcher.body === "") {
    return true;
  }

  return matchPattern(context.body ?? "", matcher.body);
}
