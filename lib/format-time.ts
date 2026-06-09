/** Human-readable relative time, e.g. "5 minutes ago". */
export function formatTimeAgo(date: Date | string): string {
  const then = new Date(date).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

/** Duration between two dates, or "—" if end is missing. */
export function formatDuration(start: Date | string, end?: Date | string | null): string {
  if (!end) return "—";
  const seconds = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
