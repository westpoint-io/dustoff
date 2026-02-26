import prettyBytes from 'pretty-bytes';
import { differenceInDays, differenceInHours } from 'date-fns';

/**
 * Formats a byte count as a human-readable string.
 * Returns "calculating..." for null (size not yet resolved).
 */
export function formatBytes(bytes: number | null): string {
  if (bytes === null) return 'calculating...';
  return prettyBytes(bytes, { maximumFractionDigits: 1 });
}

/**
 * Compact age format matching mockup: "120d", "92d", "14d", "2h", "<1h"
 */
export function formatAge(mtimeMs: number | undefined): string {
  if (mtimeMs === undefined) return '—';
  const days = differenceInDays(Date.now(), new Date(mtimeMs));
  if (days >= 1) return `${days}d`;
  const hours = differenceInHours(Date.now(), new Date(mtimeMs));
  if (hours >= 1) return `${hours}h`;
  return '<1h';
}

/**
 * Returns the number of days since mtimeMs for age-tier coloring.
 */
export function ageDays(mtimeMs: number | undefined): number {
  if (mtimeMs === undefined) return 999;
  return differenceInDays(Date.now(), new Date(mtimeMs));
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
