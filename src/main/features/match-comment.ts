import { matchPattern } from "./regex-utils";
import type { MatcherConfig, PRContext } from "./types";

/**
 * Returns true if the matcher has no comment rule or any PR comment matches the pattern.
 */
export function matchComment(
  context: PRContext,
  matcher: MatcherConfig,
): boolean {
  if (matcher.comment == null || matcher.comment === "") {
    return true;
  }
  return context.comments.some(body => matchPattern(body, matcher.comment!));
}
