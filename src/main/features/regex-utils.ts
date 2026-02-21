/**
 * Parse pattern: if it looks like /pattern/flags, use as regex; otherwise use pattern as regex (so ^ .* etc. work).
 */
export function toRegExp(pattern: string): RegExp {
  const slashMatch = pattern.match(/^\/(.*)\/([gimsuy]*)$/);
  if (slashMatch) {
    return new RegExp(slashMatch[1], slashMatch[2] || "i");
  }
  return new RegExp(pattern, "i");
}

export function matchPattern(
  text: string | null | undefined,
  pattern: string,
): boolean {
  if (text == null || text === "") {
    return false;
  }
  const re = toRegExp(pattern);
  return re.test(text);
}
