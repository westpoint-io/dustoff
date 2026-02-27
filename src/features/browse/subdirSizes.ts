import { opendir, stat } from 'node:fs/promises';
import { join } from 'node:path';

export interface SubdirSize {
  name: string;
  bytes: number;
}

/**
 * Disk usage for a single file, matching the scanner's approach:
 * blocks * 512 when available, falling back to size.
 */
async function diskUsage(fullPath: string): Promise<number> {
  try {
    const st = await stat(fullPath);
    if (st.blocks != null && st.blocks > 0) return st.blocks * 512;
    return st.size;
  } catch {
    return 0;
  }
}

/**
 * Get immediate subdirectory sizes for an artifact path (async).
 * Files at the root level are aggregated into a "(files)" entry.
 */
export async function getSubdirSizes(artifactPath: string, maxEntries: number = 4): Promise<SubdirSize[]> {
  let dir;
  try {
    dir = await opendir(artifactPath);
  } catch {
    return [];
  }

  let filesBytes = 0;
  const dirPromises: Array<{ name: string; promise: Promise<number> }> = [];

  try {
    for await (const entry of dir) {
      if (entry.isSymbolicLink()) continue;

      const fullPath = join(artifactPath, entry.name);

      if (entry.isDirectory()) {
        dirPromises.push({ name: entry.name, promise: walkSize(fullPath) });
      } else if (entry.isFile()) {
        filesBytes += await diskUsage(fullPath);
      }
    }
  } finally {
    try { await dir.close(); } catch { /* ignore */ }
  }

  // Resolve all subdir sizes in parallel
  const dirs: SubdirSize[] = await Promise.all(
    dirPromises.map(async ({ name, promise }) => ({ name, bytes: await promise })),
  );

  // Sort descending by bytes
  dirs.sort((a, b) => b.bytes - a.bytes);

  // Take top entries, aggregate rest into (other)
  const top = dirs.slice(0, maxEntries);
  const rest = dirs.slice(maxEntries);

  if (rest.length > 0) {
    const otherBytes = rest.reduce((sum, d) => sum + d.bytes, 0);
    top.push({ name: '(other dirs)', bytes: otherBytes });
  }

  if (filesBytes > 0) {
    top.push({ name: '(files)', bytes: filesBytes });
  }

  // Re-sort after adding aggregates
  top.sort((a, b) => b.bytes - a.bytes);

  return top;
}

async function walkSize(dirPath: string): Promise<number> {
  let total = 0;

  let dir;
  try {
    dir = await opendir(dirPath);
  } catch {
    return 0;
  }

  try {
    for await (const entry of dir) {
      if (entry.isSymbolicLink()) continue;

      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        total += await walkSize(fullPath);
      } else if (entry.isFile()) {
        total += await diskUsage(fullPath);
      }
    }
  } finally {
    try { await dir.close(); } catch { /* ignore */ }
  }

  return total;
}
