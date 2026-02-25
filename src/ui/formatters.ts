import prettyBytes from 'pretty-bytes';
import { formatDistanceToNow } from 'date-fns';

/**
 * Formats a byte count as a human-readable string.
 * Returns "calculating..." for null (size not yet resolved).
 */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'calculating...';
  return prettyBytes(bytes, { maximumFractionDigits: 1 });
}

/**
 * Formats a last-modified timestamp as a relative age string.
 * Returns "unknown" for undefined mtimeMs.
 */
export function formatAge(mtimeMs: number | undefined): string {
  if (mtimeMs === undefined) return 'unknown';
  return formatDistanceToNow(new Date(mtimeMs), { addSuffix: true });
}

/**
 * Truncates a path to fit within maxWidth characters.
 * If path is longer, splits at midpoint with "..." ellipsis in the middle.
 */
export function truncatePath(fullPath: string, maxWidth: number): string {
  if (fullPath.length <= maxWidth) return fullPath;
  const half = Math.floor((maxWidth - 3) / 2);
  return fullPath.slice(0, half) + '...' + fullPath.slice(-half);
}
