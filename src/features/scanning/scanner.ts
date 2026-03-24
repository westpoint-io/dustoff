import { opendir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { TARGET_DIRS, IGNORE_DIRS, TARGET_FILES, TARGET_FILE_PREFIXES, TARGET_FILE_SUFFIXES } from './constants.js';
import type { ScanResult, ScanOptions } from './types.js';

/**
 * Returns true if the filename matches any target file pattern.
 * Checks exact match, prefix match (rotated logs), and suffix match (profiling artifacts).
 */
function isTargetFile(name: string): boolean {
  if (TARGET_FILES.has(name)) return true;
  for (const prefix of TARGET_FILE_PREFIXES) {
    if (name.startsWith(prefix)) return true;
  }
  for (const suffix of TARGET_FILE_SUFFIXES) {
    if (name.endsWith(suffix)) return true;
  }
  return false;
}

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
 * BFS scanner that yields artifact directories and files as they are found.
 *
 * Algorithm:
 * 1. Start a queue with [rootPath]
 * 2. Dequeue directory, open it, iterate entries
 * 3. Skip symlinks
 * 4. For files: yield if matching TARGET_FILES / prefixes / suffixes
 * 5. For directories: skip IGNORE_DIRS, yield TARGET_DIRS, otherwise enqueue
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

        if (!entry.isDirectory()) {
          // Check if this is a target file
          if (entry.isFile() && isTargetFile(entry.name)) {
            const filePath = join(currentDir, entry.name);
            if (exclude?.has(entry.name)) {
              continue;
            }
            let mtimeMs: number | undefined;
            try {
              const s = await stat(filePath);
              mtimeMs = s.mtimeMs;
            } catch {
              // stat failed — leave mtimeMs undefined
            }
            debug?.(`scan: file artifact found ${filePath} (${entry.name})`);
            yield {
              path: filePath,
              type: entry.name,
              kind: 'file',
              sizeBytes: null,
              mtimeMs,
            };
          }
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
            kind: 'directory',
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
