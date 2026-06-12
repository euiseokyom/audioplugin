/** Slugs for products that belong in the Limiter category. */
export const LIMITER_PRODUCT_SLUGS = new Set([
  "l1-ultramaximizer",
  "l2-ultramaximizer",
  "l3-multimaximizer",
  "l3-16-multimaximizer",
  "l4-ultramaximizer",
  "pro-l-2-limiter-plug-in",
  "elevate-mastering-bundle",
  "4040-retro",
  "ml4000",
  "ml8000",
  "oxford-limiter",
  "bx_limiter",
  "bx_limiter-true-peak",
  "ocelot-limiter",
]);

export function isLimiterProduct(name: string, slug: string): boolean {
  if (LIMITER_PRODUCT_SLUGS.has(slug)) return true;

  const haystack = `${name} ${slug}`.toLowerCase();
  return (
    /\bpro-l-?2\b/.test(haystack) ||
    /ultramaximizer|multimaximizer/.test(haystack) ||
    /\belevate\b/.test(haystack)
  );
}
