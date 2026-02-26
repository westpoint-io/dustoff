import { describe, it, expect } from 'bun:test';
import { formatBytes } from '../shared/formatters.js';
import { sizeColor, theme } from '../shared/theme.js';
import { reducer } from './reducer.js';
import type { AppState } from './reducer.js';

// ─── Pure function tests (no Ink render required) ───────────────────────────

describe('formatBytes', () => {
  it('returns "calculating..." for null', () => {
    expect(formatBytes(null)).toBe('calculating...');
  });

  it('formats bytes as human-readable', () => {
    const result = formatBytes(1073741824);
    expect(result).toContain('GB');
  });

  it('formats small bytes', () => {
    const result = formatBytes(1024);
    expect(result).toContain('kB');
  });
});

describe('sizeColor', () => {
  it('returns overlay0 color for null (calculating)', () => {
    expect(sizeColor(null)).toBe(theme.overlay0);
  });

  it('returns yellow for < 100MB', () => {
    expect(sizeColor(50 * 1024 * 1024)).toBe(theme.yellow);
  });

  it('returns peach for 100MB - 1GB range', () => {
    expect(sizeColor(500 * 1024 * 1024)).toBe(theme.peach);
  });

  it('returns red for >= 1GB', () => {
    expect(sizeColor(2 * 1024 * 1024 * 1024)).toBe(theme.red);
  });
});

// ─── Selection & delete reducer tests ────────────────────────────────────────

describe('reducer — selection', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', sizeBytes: 200, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: true,
    maxSizeBytes: 200,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
  };

  it('TOGGLE_SELECT adds a path', () => {
    const next = reducer(baseState, { type: 'TOGGLE_SELECT', path: '/a/node_modules' });
    expect(next.selectedPaths.has('/a/node_modules')).toBe(true);
    expect(next.selectedPaths.size).toBe(1);
  });

  it('TOGGLE_SELECT removes an already-selected path', () => {
    const withSelection = { ...baseState, selectedPaths: new Set(['/a/node_modules']) };
    const next = reducer(withSelection, { type: 'TOGGLE_SELECT', path: '/a/node_modules' });
    expect(next.selectedPaths.has('/a/node_modules')).toBe(false);
    expect(next.selectedPaths.size).toBe(0);
  });

  it('SELECT_ALL selects all artifacts', () => {
    const next = reducer(baseState, { type: 'SELECT_ALL' });
    expect(next.selectedPaths.size).toBe(2);
  });

  it('SELECT_ALL deselects when all are selected', () => {
    const allSelected = {
      ...baseState,
      selectedPaths: new Set(['/a/node_modules', '/b/dist']),
    };
    const next = reducer(allSelected, { type: 'SELECT_ALL' });
    expect(next.selectedPaths.size).toBe(0);
  });

  it('CLEAR_SELECTION empties selection', () => {
    const withSelection = {
      ...baseState,
      selectedPaths: new Set(['/a/node_modules', '/b/dist']),
    };
    const next = reducer(withSelection, { type: 'CLEAR_SELECTION' });
    expect(next.selectedPaths.size).toBe(0);
  });

  it('DELETE_COMPLETE removes deleted artifacts and clears selection', () => {
    const withSelection = {
      ...baseState,
      selectedPaths: new Set(['/a/node_modules']),
      viewMode: 'deleting' as const,
    };
    const next = reducer(withSelection, {
      type: 'DELETE_COMPLETE',
      deletedPaths: ['/a/node_modules'],
    });
    expect(next.artifacts).toHaveLength(1);
    expect(next.artifacts[0]!.path).toBe('/b/dist');
    expect(next.selectedPaths.size).toBe(0);
    expect(next.viewMode).toBe('browse');
  });
});
