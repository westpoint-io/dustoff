import { describe, it, expect } from 'bun:test';
import { groupArtifacts, flattenGroups } from './grouping.js';
import type { ArtifactGroup } from './grouping.js';
import type { ScanResult } from '../scanning/types.js';

describe('groupArtifacts', () => {
  it('groups artifacts by parent directory', () => {
    const artifacts: ScanResult[] = [
      { path: '/root/frontend/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: 1000 },
      { path: '/root/frontend/dist', type: 'dist', sizeBytes: 200, mtimeMs: 2000 },
      { path: '/root/backend/node_modules', type: 'node_modules', sizeBytes: 300, mtimeMs: 3000 },
    ];
    const groups = groupArtifacts(artifacts, '/root');
    expect(groups).toHaveLength(2);
    expect(groups[0]!.key).toBe('frontend');
    expect(groups[0]!.children).toHaveLength(2);
    expect(groups[1]!.key).toBe('backend');
    expect(groups[1]!.children).toHaveLength(1);
  });

  it('computes totalSize correctly', () => {
    const artifacts: ScanResult[] = [
      { path: '/root/app/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: 1000 },
      { path: '/root/app/dist', type: 'dist', sizeBytes: 200, mtimeMs: 2000 },
    ];
    const groups = groupArtifacts(artifacts, '/root');
    expect(groups[0]!.totalSize).toBe(300);
  });

  it('computes oldestMtimeMs correctly', () => {
    const artifacts: ScanResult[] = [
      { path: '/root/app/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: 5000 },
      { path: '/root/app/dist', type: 'dist', sizeBytes: 200, mtimeMs: 1000 },
    ];
    const groups = groupArtifacts(artifacts, '/root');
    expect(groups[0]!.oldestMtimeMs).toBe(1000);
  });

  it('handles null sizeBytes', () => {
    const artifacts: ScanResult[] = [
      { path: '/root/app/node_modules', type: 'node_modules', sizeBytes: null, mtimeMs: 1000 },
      { path: '/root/app/dist', type: 'dist', sizeBytes: 200, mtimeMs: 2000 },
    ];
    const groups = groupArtifacts(artifacts, '/root');
    expect(groups[0]!.totalSize).toBe(200);
  });

  it('handles artifacts at root level', () => {
    const artifacts: ScanResult[] = [
      { path: '/root/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: 1000 },
    ];
    const groups = groupArtifacts(artifacts, '/root');
    expect(groups[0]!.key).toBe('.');
  });

  it('handles nested directories', () => {
    const artifacts: ScanResult[] = [
      { path: '/root/infra/cdk.out/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: 1000 },
      { path: '/root/infra/cdk.out/dist', type: 'dist', sizeBytes: 200, mtimeMs: 2000 },
    ];
    const groups = groupArtifacts(artifacts, '/root');
    expect(groups[0]!.key).toBe('infra/cdk.out');
    expect(groups[0]!.children).toHaveLength(2);
  });

  it('preserves insertion order of groups', () => {
    const artifacts: ScanResult[] = [
      { path: '/root/b/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: 1000 },
      { path: '/root/a/node_modules', type: 'node_modules', sizeBytes: 200, mtimeMs: 2000 },
    ];
    const groups = groupArtifacts(artifacts, '/root');
    expect(groups[0]!.key).toBe('b');
    expect(groups[1]!.key).toBe('a');
  });
});

describe('flattenGroups', () => {
  const makeGroup = (key: string, childPaths: string[]): ArtifactGroup => ({
    key,
    children: childPaths.map((p) => ({
      path: p,
      type: 'node_modules',
      sizeBytes: 100,
      mtimeMs: 1000,
    })),
    totalSize: childPaths.length * 100,
    oldestMtimeMs: 1000,
  });

  it('renders single-child groups with header', () => {
    const groups = [makeGroup('solo', ['/root/solo/node_modules'])];
    const items = flattenGroups(groups, new Set());
    expect(items).toHaveLength(2);
    expect(items[0]!.kind).toBe('group-header');
    expect(items[1]!.kind).toBe('artifact');
    if (items[1]!.kind === 'artifact') {
      expect(items[1]!.indented).toBe(true);
    }
  });

  it('renders multi-child groups with header + children', () => {
    const groups = [makeGroup('app', ['/root/app/node_modules', '/root/app/dist'])];
    const items = flattenGroups(groups, new Set());
    expect(items).toHaveLength(3);
    expect(items[0]!.kind).toBe('group-header');
    expect(items[1]!.kind).toBe('artifact');
    expect(items[2]!.kind).toBe('artifact');
    if (items[1]!.kind === 'artifact') {
      expect(items[1]!.indented).toBe(true);
    }
    if (items[2]!.kind === 'artifact') {
      expect(items[2]!.indented).toBe(true);
    }
  });

  it('hides children of collapsed groups', () => {
    const groups = [makeGroup('app', ['/root/app/node_modules', '/root/app/dist'])];
    const items = flattenGroups(groups, new Set(['app']));
    expect(items).toHaveLength(1);
    expect(items[0]!.kind).toBe('group-header');
  });

  it('handles mixed single and multi-child groups', () => {
    const groups = [
      makeGroup('solo', ['/root/solo/node_modules']),
      makeGroup('multi', ['/root/multi/node_modules', '/root/multi/dist']),
    ];
    const items = flattenGroups(groups, new Set());
    expect(items).toHaveLength(5);
    expect(items[0]!.kind).toBe('group-header'); // solo header
    expect(items[1]!.kind).toBe('artifact'); // solo child
    expect(items[2]!.kind).toBe('group-header'); // multi header
    expect(items[3]!.kind).toBe('artifact'); // multi child 1
    expect(items[4]!.kind).toBe('artifact'); // multi child 2
  });

  it('returns empty array for empty groups', () => {
    const items = flattenGroups([], new Set());
    expect(items).toHaveLength(0);
  });
});
