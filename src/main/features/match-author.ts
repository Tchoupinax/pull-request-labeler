import type { MatcherConfig, PRContext } from "./types";

/**
 * Returns true if the matcher has no author rule or the PR author is in the list (case-insensitive).
 */
export function matchAuthor(
  context: PRContext,
  matcher: MatcherConfig,
): boolean {
  const authors = matcher.author;
  if (authors == null || authors.length === 0) {
    return true;
  }
  const login = context.author.toLowerCase();
  return authors.some(a => a.toLowerCase() === login);
}
