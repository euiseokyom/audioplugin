export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCharCode(Number.parseInt(num, 10)),
    );
}

/** Strip scraped title suffixes and decode HTML entities for display/catalog. */
export function formatProductName(name: string): string {
  return decodeHtmlEntities(name)
    .replace(/\s*&#8211;\s*Relab Development ApS\s*$/i, "")
    .replace(/\s*[–—-]\s*Relab Development ApS\s*$/i, "")
    .replace(/\s+v\d+\s*$/i, "")
    .trim();
}
