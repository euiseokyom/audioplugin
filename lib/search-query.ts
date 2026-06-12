/** Build a MongoDB filter that matches all whitespace-separated query tokens. */
export function buildSearchFilter(q: string): Record<string, unknown> {
  const tokens = q
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return {};

  const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const tokenConditions = tokens.map((token) => ({
    $or: [
      { name: { $regex: escapeRegex(token), $options: "i" } },
      { manufacturer: { $regex: escapeRegex(token), $options: "i" } },
      { tags: { $regex: escapeRegex(token), $options: "i" } },
      { slug: { $regex: escapeRegex(token), $options: "i" } },
    ],
  }));

  return tokenConditions.length === 1
    ? tokenConditions[0]
    : { $and: tokenConditions };
}
