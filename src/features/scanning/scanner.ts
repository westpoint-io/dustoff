import { opendir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { TARGET_DIRS, IGNORE_DIRS, TARGET_FILE_SUFFIXES } from './constants.js';
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
 * BFS directory scanner that yields artifact directories and files as they are found.
 *
 * Algorithm:
 * 1. Start a queue with [rootPath]
 * 2. Dequeue directory, open it, iterate entries
 * 3. Skip symlinks
 * 4. For file entries: yield if name ends with a TARGET_FILE_SUFFIXES suffix
 * 5. Skip non-directories (after file check)
 * 6. Skip IGNORE_DIRS entries entirely
 * 7. If entry name is in TARGET_DIRS: yield it, do NOT recurse into it
 * 8. Otherwise: enqueue for further traversal
 *
 * Key properties:
 * - Skips children of matched directories (avoids redundant traversal)
 * - Never follows symlinks
 * - Handles permission errors gracefully (continues scanning)
 * - Supports AbortSignal cancellation
 * - Streams results as an AsyncGenerator
 * - Calls onProgress with directoriesVisited count on each directory dequeued
 * - Populates mtimeMs on each yielded ScanResult via stat()
 */
export async function* scan(
  rootPath: string,
  options?: ScanOptions,
): AsyncGenerator<ScanResult> {
  const targets = options?.targets ?? TARGET_DIRS;
  const exclude = options?.exclude;
  const debug = options?.onDebug;
  const queue: string[] = [rootPath];
  let directoriesVisited = 0;

  while (queue.length > 0) {
    // Check for cancellation at the top of each iteration
    if (options?.signal?.aborted) {
      return;
    }

    const currentDir = queue.shift()!;

    // Increment directory counter and notify caller
    directoriesVisited++;
    options?.onProgress?.({ directoriesVisited });
    let dir;
    try {
      dir = await opendir(currentDir);
    } catch (err) {
      if (isPermissionError(err)) {
        // Permission denied — skip this directory and continue
        debug?.(`scan: permission denied, skipping ${currentDir}`);
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

        // Check file entries against TARGET_FILE_SUFFIXES before skipping non-directories
        if (entry.isFile()) {
          for (const suffix of TARGET_FILE_SUFFIXES) {
            if (entry.name.endsWith(suffix)) {
              if (exclude?.has(suffix)) break;
              const filePath = join(currentDir, entry.name);
              let mtimeMs: number | undefined;
              try {
                const s = await stat(filePath);
                mtimeMs = s.mtimeMs;
              } catch {
                // stat failed — leave mtimeMs undefined
              }
              debug?.(`scan: artifact file found ${filePath} (${suffix})`);
              yield { path: filePath, type: suffix, sizeBytes: null, mtimeMs };
              break;
            }
          }
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

        if (targets.has(entry.name)) {
          if (exclude?.has(entry.name)) {
            continue;
          }
          // Found an artifact directory — get mtimeMs and yield it; do NOT recurse
          let mtimeMs: number | undefined;
          try {
            const s = await stat(entryPath);
            mtimeMs = s.mtimeMs;
          } catch {
            // stat failed — leave mtimeMs undefined
          }

          debug?.(`scan: artifact found ${entryPath} (${entry.name})`);
          yield {
            path: entryPath,
            type: entry.name,
            sizeBytes: null,
            mtimeMs,
          };
          continue;
        }

        // Regular directory — enqueue for traversal
        queue.push(entryPath);
      }
    } catch (err) {
      // Permission errors can also occur during iteration (e.g. Bun's scandir)
      if (isPermissionError(err)) {
        debug?.(`scan: permission denied reading entries, skipping ${currentDir}`);
        continue;
      }
      throw err;
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
