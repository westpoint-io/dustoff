import { describe, it, expect } from 'bun:test';
import { formatBytes } from '../shared/formatters.js';
import { sizeColor, theme } from '../shared/theme.js';
import { reducer, getSortedArtifacts } from './reducer.js';
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
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
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

// ─── CURSOR_HOME / CURSOR_END reducer tests ─────────────────────────────────

describe('CURSOR_HOME action', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/c/.next', type: '.next', sizeBytes: 300, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 2,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 300,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('sets cursorIndex to 0', () => {
    const next = reducer(baseState, { type: 'CURSOR_HOME' });
    expect(next.cursorIndex).toBe(0);
  });

  it('stays at 0 when already at 0', () => {
    const state = { ...baseState, cursorIndex: 0 };
    const next = reducer(state, { type: 'CURSOR_HOME' });
    expect(next.cursorIndex).toBe(0);
  });
});

describe('CURSOR_END action', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/c/.next', type: '.next', sizeBytes: 300, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 300,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('sets cursorIndex to last artifact', () => {
    const next = reducer(baseState, { type: 'CURSOR_END' });
    expect(next.cursorIndex).toBe(2);
  });

  it('stays at last when already at end', () => {
    const state = { ...baseState, cursorIndex: 2 };
    const next = reducer(state, { type: 'CURSOR_END' });
    expect(next.cursorIndex).toBe(2);
  });

  it('returns 0 for empty artifacts', () => {
    const state = { ...baseState, artifacts: [] };
    const next = reducer(state, { type: 'CURSOR_END' });
    expect(next.cursorIndex).toBe(0);
  });
});

describe('SET_SEARCH_MODE action', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('enables search mode', () => {
    const action = { type: 'SET_SEARCH_MODE' as const, enabled: true };
    const nextState = reducer(baseState, action);
    expect(nextState.isSearchMode).toBe(true);
  });

  it('disables search mode', () => {
    const state = { ...baseState, isSearchMode: true };
    const action = { type: 'SET_SEARCH_MODE' as const, enabled: false };
    const nextState = reducer(state, action);
    expect(nextState.isSearchMode).toBe(false);
  });
});

describe('SET_SEARCH_QUERY action', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('updates search query', () => {
    const action = { type: 'SET_SEARCH_QUERY' as const, query: 'node' };
    const nextState = reducer(baseState, action);
    expect(nextState.searchQuery).toBe('node');
  });

  it('resets cursor to 0 when search query changes', () => {
    const state = { ...baseState, cursorIndex: 5 };
    const action = { type: 'SET_SEARCH_QUERY' as const, query: 'test' };
    const nextState = reducer(state, action);
    expect(nextState.cursorIndex).toBe(0);
    expect(nextState.searchQuery).toBe('test');
  });

  it('clears search with empty query', () => {
    const state = { ...baseState, searchQuery: 'node' };
    const action = { type: 'SET_SEARCH_QUERY' as const, query: '' };
    const nextState = reducer(state, action);
    expect(nextState.searchQuery).toBe('');
  });
});

// ─── Delete toast reducer tests ──────────────────────────────────────────────

describe('DELETE_COMPLETE sets toast', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 500, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', sizeBytes: 300, mtimeMs: Date.now() },
      { path: '/c/.next', type: '.next', sizeBytes: 200, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 500,
    selectedPaths: new Set(['/a/node_modules', '/b/dist']),
    viewMode: 'deleting',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('sets deleteToast with count and freed bytes', () => {
    const next = reducer(baseState, {
      type: 'DELETE_COMPLETE',
      deletedPaths: ['/a/node_modules', '/b/dist'],
    });
    expect(next.deleteToast).toEqual({ count: 2, freedBytes: 800 });
  });

  it('computes freed bytes only for deleted paths', () => {
    const next = reducer(baseState, {
      type: 'DELETE_COMPLETE',
      deletedPaths: ['/a/node_modules'],
    });
    expect(next.deleteToast).toEqual({ count: 1, freedBytes: 500 });
  });

  it('handles null sizeBytes when computing freed bytes', () => {
    const stateWithNull: AppState = {
      ...baseState,
      artifacts: [
        { path: '/a/node_modules', type: 'node_modules', sizeBytes: null, mtimeMs: Date.now() },
      ],
    };
    const next = reducer(stateWithNull, {
      type: 'DELETE_COMPLETE',
      deletedPaths: ['/a/node_modules'],
    });
    expect(next.deleteToast).toEqual({ count: 1, freedBytes: 0 });
  });
});

describe('DISMISS_TOAST action', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: { count: 2, freedBytes: 800 },
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('clears deleteToast', () => {
    const next = reducer(baseState, { type: 'DISMISS_TOAST' });
    expect(next.deleteToast).toBeNull();
  });

  it('is a no-op when toast is already null', () => {
    const state = { ...baseState, deleteToast: null };
    const next = reducer(state, { type: 'DISMISS_TOAST' });
    expect(next.deleteToast).toBeNull();
  });
});

describe('getSortedArtifacts with search filter', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('returns all artifacts when searchQuery is empty', () => {
    const artifacts = [
      { path: '/a/node_modules', type: 'dir' as const, sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dir' as const, sizeBytes: 200, mtimeMs: 2 },
      { path: '/c/build', type: 'dir' as const, sizeBytes: 300, mtimeMs: 3 },
    ];
    const state = { ...baseState, artifacts, searchQuery: '' };
    const result = getSortedArtifacts(state);
    // baseState has sortKey: 'size', sortDir: 'desc', so results are sorted by size descending
    expect(result).toHaveLength(3);
    expect(result[0]?.sizeBytes).toBe(300);
    expect(result[1]?.sizeBytes).toBe(200);
    expect(result[2]?.sizeBytes).toBe(100);
  });

  it('filters artifacts by path substring (case-insensitive)', () => {
    const artifacts = [
      { path: '/a/node_modules', type: 'dir' as const, sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dir' as const, sizeBytes: 200, mtimeMs: 2 },
      { path: '/c/NODE_MODULES', type: 'dir' as const, sizeBytes: 300, mtimeMs: 3 },
    ];
    const state = { ...baseState, artifacts, searchQuery: 'node' };
    const result = getSortedArtifacts(state);
    expect(result).toHaveLength(2);
    // Sorted by size descending (baseState), so /c/NODE_MODULES (300) comes first
    expect(result[0]?.path).toBe('/c/NODE_MODULES');
    expect(result[1]?.path).toBe('/a/node_modules');
  });

  it('returns empty array when no artifacts match filter', () => {
    const artifacts = [
      { path: '/a/node_modules', type: 'dir' as const, sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dir' as const, sizeBytes: 200, mtimeMs: 2 },
    ];
    const state = { ...baseState, artifacts, searchQuery: 'nomatch' };
    const result = getSortedArtifacts(state);
    expect(result).toHaveLength(0);
  });

  it('preserves sort order when filtering', () => {
    const artifacts = [
      { path: '/a/node_modules', type: 'dir' as const, sizeBytes: 300, mtimeMs: 1 },
      { path: '/b/node_modules2', type: 'dir' as const, sizeBytes: 100, mtimeMs: 2 },
      { path: '/c/dist', type: 'dir' as const, sizeBytes: 200, mtimeMs: 3 },
    ];
    const state = {
      ...baseState,
      artifacts,
      searchQuery: 'node',
      sortKey: 'size' as const,
      sortDir: 'asc' as const,
    };
    const result = getSortedArtifacts(state);
    // Should be sorted by size ascending: 100, then 300
    expect(result[0]?.sizeBytes).toBe(100);
    expect(result[1]?.sizeBytes).toBe(300);
  });
});

// ─── Grouping reducer tests ─────────────────────────────────────────────────

describe('TOGGLE_GROUPING action', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 5,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 100,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('enables grouping', () => {
    const next = reducer(baseState, { type: 'TOGGLE_GROUPING' });
    expect(next.groupingEnabled).toBe(true);
  });

  it('disables grouping', () => {
    const state = { ...baseState, groupingEnabled: true };
    const next = reducer(state, { type: 'TOGGLE_GROUPING' });
    expect(next.groupingEnabled).toBe(false);
  });

  it('resets cursor to 0', () => {
    const next = reducer(baseState, { type: 'TOGGLE_GROUPING' });
    expect(next.cursorIndex).toBe(0);
  });

  it('clears collapsed groups', () => {
    const state = { ...baseState, groupingEnabled: true, collapsedGroups: new Set(['a', 'b']) };
    const next = reducer(state, { type: 'TOGGLE_GROUPING' });
    expect(next.collapsedGroups.size).toBe(0);
  });
});

describe('TOGGLE_GROUP_COLLAPSE action', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: true,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('adds key to collapsed groups', () => {
    const next = reducer(baseState, { type: 'TOGGLE_GROUP_COLLAPSE', key: 'frontend' });
    expect(next.collapsedGroups.has('frontend')).toBe(true);
  });

  it('removes key from collapsed groups', () => {
    const state = { ...baseState, collapsedGroups: new Set(['frontend']) };
    const next = reducer(state, { type: 'TOGGLE_GROUP_COLLAPSE', key: 'frontend' });
    expect(next.collapsedGroups.has('frontend')).toBe(false);
  });
});

describe('SELECT_PATHS action', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/a/dist', type: 'dist', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/b/.next', type: '.next', sizeBytes: 300, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 300,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: true,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('adds multiple paths to selection', () => {
    const next = reducer(baseState, {
      type: 'SELECT_PATHS',
      paths: ['/a/node_modules', '/a/dist'],
    });
    expect(next.selectedPaths.size).toBe(2);
    expect(next.selectedPaths.has('/a/node_modules')).toBe(true);
    expect(next.selectedPaths.has('/a/dist')).toBe(true);
  });

  it('preserves existing selections', () => {
    const state = { ...baseState, selectedPaths: new Set(['/b/.next']) };
    const next = reducer(state, { type: 'SELECT_PATHS', paths: ['/a/node_modules'] });
    expect(next.selectedPaths.size).toBe(2);
    expect(next.selectedPaths.has('/b/.next')).toBe(true);
    expect(next.selectedPaths.has('/a/node_modules')).toBe(true);
  });
});

describe('DESELECT_PATHS action', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(['/a/node_modules', '/a/dist', '/b/.next']),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: true,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('removes multiple paths from selection', () => {
    const next = reducer(baseState, {
      type: 'DESELECT_PATHS',
      paths: ['/a/node_modules', '/a/dist'],
    });
    expect(next.selectedPaths.size).toBe(1);
    expect(next.selectedPaths.has('/b/.next')).toBe(true);
  });

  it('handles deselecting paths not in selection gracefully', () => {
    const next = reducer(baseState, {
      type: 'DESELECT_PATHS',
      paths: ['/nonexistent'],
    });
    expect(next.selectedPaths.size).toBe(3);
  });
});

// ─── Type filter reducer tests ──────────────────────────────────────────────

describe('SET_TYPE_FILTER_MODE action', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('enables type filter mode', () => {
    const next = reducer(baseState, { type: 'SET_TYPE_FILTER_MODE', enabled: true });
    expect(next.isTypeFilterMode).toBe(true);
  });

  it('disables type filter mode', () => {
    const state = { ...baseState, isTypeFilterMode: true };
    const next = reducer(state, { type: 'SET_TYPE_FILTER_MODE', enabled: false });
    expect(next.isTypeFilterMode).toBe(false);
  });

  it('resets typeFilterCursor to 0 when enabling', () => {
    const state = { ...baseState, typeFilterCursor: 3 };
    const next = reducer(state, { type: 'SET_TYPE_FILTER_MODE', enabled: true });
    expect(next.typeFilterCursor).toBe(0);
  });
});

describe('TOGGLE_TYPE_FILTER action', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/c/.cache', type: '.cache', sizeBytes: 50, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 200,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: true,
    typeFilterCursor: 0,
  };

  it('creates set excluding toggled type from null', () => {
    const next = reducer(baseState, { type: 'TOGGLE_TYPE_FILTER', artifactType: 'dist' });
    expect(next.typeFilter).not.toBeNull();
    expect(next.typeFilter!.has('node_modules')).toBe(true);
    expect(next.typeFilter!.has('.cache')).toBe(true);
    expect(next.typeFilter!.has('dist')).toBe(false);
  });

  it('toggles type in existing set — removes it', () => {
    const state = { ...baseState, typeFilter: new Set(['node_modules', '.cache']) };
    const next = reducer(state, { type: 'TOGGLE_TYPE_FILTER', artifactType: '.cache' });
    expect(next.typeFilter!.has('.cache')).toBe(false);
    expect(next.typeFilter!.has('node_modules')).toBe(true);
  });

  it('toggles type in existing set — adds it back', () => {
    const state = { ...baseState, typeFilter: new Set(['node_modules']) };
    const next = reducer(state, { type: 'TOGGLE_TYPE_FILTER', artifactType: '.cache' });
    expect(next.typeFilter!.has('.cache')).toBe(true);
    expect(next.typeFilter!.has('node_modules')).toBe(true);
  });

  it('resets to null when all types are re-selected', () => {
    const state = { ...baseState, typeFilter: new Set(['node_modules', '.cache']) };
    const next = reducer(state, { type: 'TOGGLE_TYPE_FILTER', artifactType: 'dist' });
    expect(next.typeFilter).toBeNull();
  });
});

describe('TYPE_FILTER_CURSOR_UP/DOWN actions', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: true,
    typeFilterCursor: 1,
  };

  it('moves cursor up', () => {
    const next = reducer(baseState, { type: 'TYPE_FILTER_CURSOR_UP' });
    expect(next.typeFilterCursor).toBe(0);
  });

  it('clamps cursor up at 0', () => {
    const state = { ...baseState, typeFilterCursor: 0 };
    const next = reducer(state, { type: 'TYPE_FILTER_CURSOR_UP' });
    expect(next.typeFilterCursor).toBe(0);
  });

  it('moves cursor down', () => {
    const next = reducer(baseState, { type: 'TYPE_FILTER_CURSOR_DOWN', typeCount: 5 });
    expect(next.typeFilterCursor).toBe(2);
  });

  it('clamps cursor down at typeCount - 1', () => {
    const state = { ...baseState, typeFilterCursor: 4 };
    const next = reducer(state, { type: 'TYPE_FILTER_CURSOR_DOWN', typeCount: 5 });
    expect(next.typeFilterCursor).toBe(4);
  });
});

describe('CLEAR_TYPE_FILTER action', () => {
  const baseState: AppState = {
    artifacts: [],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 0,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: new Set(['node_modules']),
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('resets typeFilter to null', () => {
    const next = reducer(baseState, { type: 'CLEAR_TYPE_FILTER' });
    expect(next.typeFilter).toBeNull();
  });
});

describe('getSortedArtifacts with type filter', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dist', sizeBytes: 200, mtimeMs: 2 },
      { path: '/c/.cache', type: '.cache', sizeBytes: 300, mtimeMs: 3 },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: false,
    maxSizeBytes: 300,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
    isSearchMode: false,
    searchQuery: '',
    deleteConfirmFocus: 'yes',
    themeName: 'Catppuccin Mocha',
    deleteToast: null,
    groupingEnabled: false,
    collapsedGroups: new Set(),
    typeFilter: null,
    isTypeFilterMode: false,
    typeFilterCursor: 0,
  };

  it('returns all artifacts when typeFilter is null', () => {
    const result = getSortedArtifacts(baseState);
    expect(result).toHaveLength(3);
  });

  it('filters artifacts by type when typeFilter is set', () => {
    const state = { ...baseState, typeFilter: new Set(['node_modules', '.cache']) };
    const result = getSortedArtifacts(state);
    expect(result).toHaveLength(2);
    expect(result.some((a) => a.type === 'dist')).toBe(false);
  });

  it('applies type filter before search filter', () => {
    const state = {
      ...baseState,
      typeFilter: new Set(['node_modules', 'dist']),
      searchQuery: 'node',
    };
    const result = getSortedArtifacts(state);
    expect(result).toHaveLength(1);
    expect(result[0]!.type).toBe('node_modules');
  });

  it('returns empty when typeFilter excludes all types', () => {
    const state = { ...baseState, typeFilter: new Set(['nonexistent']) };
    const result = getSortedArtifacts(state);
    expect(result).toHaveLength(0);
  });
});
