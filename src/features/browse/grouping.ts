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
// groupArtifacts — groups sorted artifacts by immediate parent directory
// ---------------------------------------------------------------------------

export function groupArtifacts(
  artifacts: ScanResult[],
  rootPath: string,
): ArtifactGroup[] {
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

  const groups: ArtifactGroup[] = [];
  for (const key of groupOrder) {
    const children = groupMap.get(key)!;
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
    // Single-child groups render flat (no header)
    if (group.children.length === 1) {
      items.push({ kind: 'artifact', artifact: group.children[0]!, indented: false });
      continue;
    }

    // Multi-child groups: header + children (unless collapsed)
    items.push({ kind: 'group-header', group });
    if (!collapsedGroups.has(group.key)) {
      for (const child of group.children) {
        items.push({ kind: 'artifact', artifact: child, indented: true });
      }
    }
  }

  return items;
}
