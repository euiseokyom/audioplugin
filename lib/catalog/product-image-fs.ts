import path from "path";

/** Filesystem directory for a manufacturer's WebP tiles. Scripts only — do not import from app code. */
export function productWebpDir(root: string, manufacturerTag: string): string {
  return path.join(root, "public/images/products", manufacturerTag);
}

/** Filesystem directory for a manufacturer's original source PNGs. Scripts only. */
export function productOriginalDir(root: string, manufacturerTag: string): string {
  return path.join(root, "public/images/products/original", manufacturerTag);
}
