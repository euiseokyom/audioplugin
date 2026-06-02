/** Products featured in the Ends Soon section (seed + homepage). */
export const ENDS_SOON_HOURS = [6, 12, 18, 24, 36, 42] as const;

export const ENDS_SOON_SLUGS = [
  "serum-xfer-records",
  "ozone-11-advanced-izotope",
  "valhalla-room-valhalla",
  "ssl-g-master-buss-compressor-waves",
  "soundtoys-5-bundle",
  "pro-l-2-fabfilter",
] as const;

export function getEndsSoonDealEndDate(
  slug: string,
  from: Date = new Date(),
): Date | undefined {
  const idx = ENDS_SOON_SLUGS.indexOf(slug as (typeof ENDS_SOON_SLUGS)[number]);
  if (idx === -1) return undefined;
  const date = new Date(from);
  date.setHours(date.getHours() + ENDS_SOON_HOURS[idx]);
  return date;
}
