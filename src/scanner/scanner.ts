import { opendir } from 'node:fs/promises';
import { join } from 'node:path';
import { TARGET_DIRS, IGNORE_DIRS } from './constants.js';
import type { ScanResult, ScanOptions } from './types.js';

/**
 * Returns true if the error is a permission-denied error (EACCES or EPERM).
 */
function isPermissionError(err: unknown): boolean {
  return (
    err instanceof Error &&
    'code' in err &&
    (err.code === 'EACCES' || err.code === 'EPERM')
  );
}

/**
 * BFS directory scanner that yields artifact directories as they are found.
 *
 * Algorithm:
 * 1. Start a queue with [rootPath]
 * 2. Dequeue directory, open it, iterate entries
 * 3. Skip symlinks and non-directories
 * 4. Skip IGNORE_DIRS entries entirely
 * 5. If entry name is in TARGET_DIRS: yield it, do NOT recurse into it
 * 6. Otherwise: enqueue for further traversal
 *
 * Key properties:
 * - Skips children of matched directories (avoids redundant traversal)
 * - Never follows symlinks
 * - Handles permission errors gracefully (continues scanning)
 * - Supports AbortSignal cancellation
 * - Streams results as an AsyncGenerator
 */
export async function* scan(
  rootPath: string,
  options?: ScanOptions,
): AsyncGenerator<ScanResult> {
  const queue: string[] = [rootPath];

  while (queue.length > 0) {
    // Check for cancellation at the top of each iteration
    if (options?.signal?.aborted) {
      return;
    }

    const currentDir = queue.shift()!;

    let dir;
    try {
      dir = await opendir(currentDir);
    } catch (err) {
      if (isPermissionError(err)) {
        // Permission denied — skip this directory and continue
        continue;
      }
      // Re-throw unexpected errors (e.g., ENOENT after scan started)
      throw err;
    }

    try {
      for await (const entry of dir) {
        // CRITICAL: check isSymbolicLink() BEFORE isDirectory()
        // A symlink to a directory returns true for both — skip all symlinks
        if (entry.isSymbolicLink()) {
          continue;
        }

        if (!entry.isDirectory()) {
          continue;
        }

        const entryPath = join(currentDir, entry.name);

        if (IGNORE_DIRS.has(entry.name)) {
          // Skip system/SCM directories — don't recurse
          continue;
        }

        if (TARGET_DIRS.has(entry.name)) {
          // Found an artifact directory — yield it and do NOT recurse into it
          yield {
            path: entryPath,
            type: entry.name,
            sizeBytes: null,
          };
          continue;
        }

        // Regular directory — enqueue for traversal
        queue.push(entryPath);
      }
    } finally {
      // Ensure dir is closed even if an error occurs during iteration
      try {
        await dir.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
