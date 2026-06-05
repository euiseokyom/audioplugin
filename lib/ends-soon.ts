/** Products featured in the Ends Soon section (seed + homepage). */
export const ENDS_SOON_SLUGS = new Set([
  "platinum",
  "bx_console-amek-9099",
  "soundtoys-5",
  "decapitator",
  "echoboy",
  "superplate",
  "radiator",
]);

/**
 * Returns a deal end date (within ~48 hours) if the slug is in ENDS_SOON_SLUGS.
 * Otherwise returns undefined.
 */
export function getEndsSoonDealEndDate(
  slug: string,
  from: Date = new Date(),
): Date | undefined {
  if (!ENDS_SOON_SLUGS.has(slug)) {
    return undefined;
  }

  const endDate = new Date(from);
  const hoursToAdd = Math.floor(Math.random() * 36) + 6;
  endDate.setHours(endDate.getHours() + hoursToAdd);
  endDate.setMinutes(59, 59, 999);

  return endDate;
}
