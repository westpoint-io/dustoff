import { dirname, relative } from 'node:path';
import type { ScanResult } from '../scanning/types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ArtifactGroup {
  key: string;          // parent dir relative to rootPath (e.g. "frontend" or "infra/cdk.out")
  children: ScanResult[];
  totalSize: number;
  oldestMtimeMs: number | undefined;
}

export type FlatItem =
  | { kind: 'group-header'; group: ArtifactGroup }
  | { kind: 'artifact'; artifact: ScanResult; indented: boolean };

// ---------------------------------------------------------------------------
// groupArtifacts — groups sorted artifacts by parent directory, merging
// singleton groups that share a common ancestor
// ---------------------------------------------------------------------------

/**
 * Walk a relative path upward, yielding each ancestor.
 * e.g. "a/b/c/d" → ["a/b/c", "a/b", "a"]
 */
function ancestors(rel: string): string[] {
  const result: string[] = [];
  let cur = dirname(rel);
  while (cur !== '.' && cur !== '') {
    result.push(cur);
    cur = dirname(cur);
  }
  return result;
}

export function groupArtifacts(
  artifacts: ScanResult[],
  rootPath: string,
): ArtifactGroup[] {
  // Pass 1: group by immediate parent directory
  const groupMap = new Map<string, ScanResult[]>();
  const groupOrder: string[] = [];

  for (const artifact of artifacts) {
    const rel = relative(rootPath, artifact.path);
    const parentDir = dirname(rel);
    const key = parentDir === '.' ? '.' : parentDir;

    let children = groupMap.get(key);
    if (children === undefined) {
      children = [];
      groupMap.set(key, children);
      groupOrder.push(key);
    }
    children.push(artifact);
  }

  // Pass 2: merge singleton groups into nearby groups. For each singleton,
  // walk its ancestors upward. If an ancestor IS an existing group key, or
  // is a prefix of other group keys (singletons or not), merge under that
  // ancestor. This handles cases like:
  //   fynd-api/node_modules              → group "fynd-api" (multi-child)
  //   fynd-api/.worktrees/X/node_modules → singleton, ancestor "fynd-api"
  //     → merged into "fynd-api" group
  const allKeys = new Set(groupOrder);
  const merged = new Map<string, string>(); // original key → merge target

  for (const key of groupOrder) {
    if (merged.has(key)) continue;
    if (groupMap.get(key)!.length > 1) continue; // only merge singletons

    const keyAncestors = ancestors(key);
    for (const anc of keyAncestors) {
      // Check if this ancestor is an existing group key
      if (allKeys.has(anc)) {
        merged.set(key, anc);
        break;
      }
      // Check if this ancestor is a prefix of other keys (group siblings under it)
      let siblingCount = 0;
      for (const other of allKeys) {
        if (other !== key && !merged.has(other) && other.startsWith(anc + '/')) {
          siblingCount++;
        }
      }
      if (siblingCount > 0) {
        // Merge this key and all sibling keys under the ancestor
        merged.set(key, anc);
        for (const other of allKeys) {
          if (other !== key && !merged.has(other) && other.startsWith(anc + '/')) {
            merged.set(other, anc);
          }
        }
        break;
      }
    }
  }

  // Rebuild groups with merges applied
  const finalMap = new Map<string, ScanResult[]>();
  const finalOrder: string[] = [];

  for (const key of groupOrder) {
    const target = merged.get(key) ?? key;
    let children = finalMap.get(target);
    if (children === undefined) {
      children = [];
      finalMap.set(target, children);
      finalOrder.push(target);
    }
    children.push(...groupMap.get(key)!);
  }

  // Build final group objects
  const groups: ArtifactGroup[] = [];
  for (const key of finalOrder) {
    const children = finalMap.get(key)!;
    let totalSize = 0;
    let oldestMtimeMs: number | undefined;
    for (const child of children) {
      totalSize += child.sizeBytes ?? 0;
      if (child.mtimeMs !== undefined) {
        if (oldestMtimeMs === undefined || child.mtimeMs < oldestMtimeMs) {
          oldestMtimeMs = child.mtimeMs;
        }
      }
    }
    groups.push({ key, children, totalSize, oldestMtimeMs });
  }

  return groups;
}

// ---------------------------------------------------------------------------
// flattenGroups — produces a flat display list for rendering
// ---------------------------------------------------------------------------

export function flattenGroups(
  groups: ArtifactGroup[],
  collapsedGroups: ReadonlySet<string>,
): FlatItem[] {
  const items: FlatItem[] = [];

  for (const group of groups) {
    items.push({ kind: 'group-header', group });
    if (!collapsedGroups.has(group.key)) {
      for (const child of group.children) {
        items.push({ kind: 'artifact', artifact: child, indented: true });
      }
    }
  }

  return items;
}
