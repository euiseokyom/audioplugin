import type { IScraperLog } from "@/types";

export function runErrorCount(
  log: Pick<IScraperLog, "failedUrls" | "errorMessage">
): number {
  const failedUrlCount = log.failedUrls?.length ?? 0;
  const hasErrorMessage = Boolean(log.errorMessage);
  return failedUrlCount + (hasErrorMessage && failedUrlCount === 0 ? 1 : 0);
}

export function hasProductChangeStats(
  log: Pick<IScraperLog, "productsAdded" | "productsUpdated">
): boolean {
  return (log.productsAdded ?? 0) > 0 || (log.productsUpdated ?? 0) > 0;
}
