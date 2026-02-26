import { opendir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

/**
 * Sentinel symbol used to distinguish a timeout result from a valid 0-byte result.
 */
const TIMEOUT_SENTINEL = Symbol('timeout');

/**
 * Internal recursive helper that sums the disk usage of a directory tree.
 *
 * - Uses stat.blocks * 512 for accurate disk usage (accounts for filesystem block allocation)
 * - Falls back to stat.size when stat.blocks is 0 or undefined (memfs, Windows)
 * - Deduplicates hardlinked inodes via seenInodes Set (scoped per calculateSize call)
 * - Skips symlinks — never follows them during size calculation
 * - Handles permission errors and missing files gracefully (returns 0 for inaccessible entries)
 */
async function sumDir(dirPath: string, seenInodes: Set<string>): Promise<number> {
  let dir;
  try {
    dir = await opendir(dirPath);
  } catch {
    // Permission denied, ENOENT, or other error — skip this directory
    return 0;
  }

  let total = 0;

  try {
    for await (const entry of dir) {
      // Skip symlinks — never follow during size calculation
      if (entry.isSymbolicLink()) {
        continue;
      }

      const entryPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        total += await sumDir(entryPath, seenInodes);
      } else if (entry.isFile()) {
        try {
          const s = await stat(entryPath);

          // Build inode key using device + inode number to uniquely identify a file
          const inodeKey = `${s.dev}:${s.ino}`;

          // Skip if this inode was already counted (hardlink dedup)
          if (seenInodes.has(inodeKey)) {
            continue;
          }
          seenInodes.add(inodeKey);

          // Use blocks * 512 for disk usage accuracy; fall back to size when blocks unavailable
          // stat.blocks is undefined on Windows and typically 0 in memfs
          if (s.blocks != null && s.blocks > 0) {
            total += s.blocks * 512;
          } else {
            total += s.size;
          }
        } catch {
          // File gone, permission denied — skip this entry
        }
      }
    }
  } finally {
    try {
      await dir.close();
    } catch {
      // Ignore close errors
    }
  }

  return total;
}

/**
 * Calculates the total disk usage of a directory tree in bytes.
 *
 * Key behaviors:
 * - Uses stat.blocks * 512 (actual disk blocks allocated), not stat.size (logical file size)
 * - Deduplicates hardlinked inodes: files sharing an inode are counted only once
 * - Inode dedup is scoped to this call — a fresh Set is created per invocation
 * - Never follows symlinks
 * - Handles permission errors gracefully (inaccessible directories contribute 0)
 * - Returns 0 for non-existent directories
 *
 * @param dirPath - Absolute path to the directory to measure
 * @returns Total disk usage in bytes
 */
export async function calculateSize(dirPath: string): Promise<number> {
  const seenInodes = new Set<string>();
  return sumDir(dirPath, seenInodes);
}

/**
 * Wraps calculateSize with a timeout for safety on very large or slow directories.
 *
 * Returns null if the calculation exceeds the timeout — callers should treat null
 * as "size unknown" rather than an error.
 *
 * @param dirPath - Absolute path to the directory to measure
 * @param timeoutMs - Maximum milliseconds to wait (default: 10,000)
 * @returns Total disk usage in bytes, or null if timed out
 */
export async function calculateSizeWithTimeout(
  dirPath: string,
  timeoutMs: number = 10_000,
): Promise<number | null> {
  const timeoutPromise = delay(timeoutMs, TIMEOUT_SENTINEL);
  const result = await Promise.race([calculateSize(dirPath), timeoutPromise]);

  if (result === TIMEOUT_SENTINEL) {
    return null;
  }

  return result as number;
}
