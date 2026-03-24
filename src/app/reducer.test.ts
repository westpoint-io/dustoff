import { describe, it, test, expect } from 'bun:test';
import { formatBytes } from '../shared/formatters.js';
import { sizeColor, theme } from '../shared/theme.js';
import { reducer, getSortedArtifacts, getDisplayItems, initialState } from './reducer.js';
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
    expect(result).toContain('KB');
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
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/c/.next', type: '.next', kind: 'directory', sizeBytes: 300, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/c/.next', type: '.next', kind: 'directory', sizeBytes: 300, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 500, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 300, mtimeMs: Date.now() },
      { path: '/c/.next', type: '.next', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
        { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: null, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
  };

  it('returns all artifacts when searchQuery is empty', () => {
    const artifacts = [
      { path: '/a/node_modules', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 200, mtimeMs: 2 },
      { path: '/c/build', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 300, mtimeMs: 3 },
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
      { path: '/a/node_modules', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 200, mtimeMs: 2 },
      { path: '/c/NODE_MODULES', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 300, mtimeMs: 3 },
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
      { path: '/a/node_modules', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 200, mtimeMs: 2 },
    ];
    const state = { ...baseState, artifacts, searchQuery: 'nomatch' };
    const result = getSortedArtifacts(state);
    expect(result).toHaveLength(0);
  });

  it('preserves sort order when filtering', () => {
    const artifacts = [
      { path: '/a/node_modules', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 300, mtimeMs: 1 },
      { path: '/b/node_modules2', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 100, mtimeMs: 2 },
      { path: '/c/dist', type: 'dir' as const, kind: 'directory' as const, sizeBytes: 200, mtimeMs: 3 },
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
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/a/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/b/.next', type: '.next', kind: 'directory', sizeBytes: 300, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/c/.cache', type: '.cache', kind: 'directory', sizeBytes: 50, mtimeMs: Date.now() },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
  };

  it('resets typeFilter to null', () => {
    const next = reducer(baseState, { type: 'CLEAR_TYPE_FILTER' });
    expect(next.typeFilter).toBeNull();
  });
});

describe('getSortedArtifacts with type filter', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: 1 },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: 2 },
      { path: '/c/.cache', type: '.cache', kind: 'directory', sizeBytes: 300, mtimeMs: 3 },
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
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

// ─── Selection anchor & SET_CURSOR reducer tests ────────────────────────────

describe('SET_CURSOR action', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
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
    isTypeFilterMode: false,
    typeFilterCursor: 0,
    selectionAnchor: null,
    expandedFileTypes: new Set(),
  };

  it('sets cursorIndex to the given index', () => {
    const next = reducer(baseState, { type: 'SET_CURSOR', index: 1 });
    expect(next.cursorIndex).toBe(1);
  });

  it('does not clear selectionAnchor', () => {
    const state = { ...baseState, selectionAnchor: 0 };
    const next = reducer(state, { type: 'SET_CURSOR', index: 1 });
    expect(next.selectionAnchor).toBe(0);
  });
});

describe('SET_SELECTION_ANCHOR action', () => {
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
    selectionAnchor: null,
    expandedFileTypes: new Set(),
  };

  it('sets selectionAnchor', () => {
    const next = reducer(baseState, { type: 'SET_SELECTION_ANCHOR', anchor: 3 });
    expect(next.selectionAnchor).toBe(3);
  });
});

describe('cursor movement clears selectionAnchor', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', kind: 'directory', sizeBytes: 200, mtimeMs: Date.now() },
      { path: '/c/.next', type: '.next', kind: 'directory', sizeBytes: 300, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 1,
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
    selectionAnchor: 0,
    expandedFileTypes: new Set(),
  };

  it('CURSOR_UP clears selectionAnchor', () => {
    const next = reducer(baseState, { type: 'CURSOR_UP' });
    expect(next.selectionAnchor).toBeNull();
  });

  it('CURSOR_DOWN clears selectionAnchor', () => {
    const next = reducer(baseState, { type: 'CURSOR_DOWN' });
    expect(next.selectionAnchor).toBeNull();
  });

  it('CURSOR_HOME clears selectionAnchor', () => {
    const next = reducer(baseState, { type: 'CURSOR_HOME' });
    expect(next.selectionAnchor).toBeNull();
  });

  it('CURSOR_END clears selectionAnchor', () => {
    const next = reducer(baseState, { type: 'CURSOR_END' });
    expect(next.selectionAnchor).toBeNull();
  });

  it('CURSOR_PAGE_UP clears selectionAnchor', () => {
    const next = reducer(baseState, { type: 'CURSOR_PAGE_UP', visibleCount: 5 });
    expect(next.selectionAnchor).toBeNull();
  });

  it('CURSOR_PAGE_DOWN clears selectionAnchor', () => {
    const next = reducer(baseState, { type: 'CURSOR_PAGE_DOWN', visibleCount: 5 });
    expect(next.selectionAnchor).toBeNull();
  });
});

// ─── File type expand & group select reducer tests ──────────────────────────

describe('TOGGLE_FILE_TYPE_EXPAND action', () => {
  it('toggles file type in expandedFileTypes', () => {
    const state = { ...initialState };
    const next = reducer(state, { type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: '.tsbuildinfo' });
    expect(next.expandedFileTypes.has('.tsbuildinfo')).toBe(true);

    const next2 = reducer(next, { type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: '.tsbuildinfo' });
    expect(next2.expandedFileTypes.has('.tsbuildinfo')).toBe(false);
  });
});

describe('TOGGLE_FILE_GROUP_SELECT action', () => {
  it('selects all files when none selected', () => {
    const state: AppState = {
      ...initialState,
      artifacts: [
        { path: '/a/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 100, mtimeMs: 1000 },
        { path: '/b/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 200, mtimeMs: 2000 },
      ],
    };
    const next = reducer(state, {
      type: 'TOGGLE_FILE_GROUP_SELECT',
      paths: ['/a/.tsbuildinfo', '/b/.tsbuildinfo'],
    });
    expect(next.selectedPaths.has('/a/.tsbuildinfo')).toBe(true);
    expect(next.selectedPaths.has('/b/.tsbuildinfo')).toBe(true);
  });

  it('deselects all files when all selected', () => {
    const state: AppState = {
      ...initialState,
      selectedPaths: new Set(['/a/.tsbuildinfo', '/b/.tsbuildinfo']),
      artifacts: [
        { path: '/a/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 100, mtimeMs: 1000 },
        { path: '/b/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 200, mtimeMs: 2000 },
      ],
    };
    const next = reducer(state, {
      type: 'TOGGLE_FILE_GROUP_SELECT',
      paths: ['/a/.tsbuildinfo', '/b/.tsbuildinfo'],
    });
    expect(next.selectedPaths.size).toBe(0);
  });
});

// ─── getDisplayItems tests ──────────────────────────────────────────────────

describe('getDisplayItems()', () => {
  test('groups file artifacts by type', () => {
    const state: AppState = {
      ...initialState,
      artifacts: [
        { path: '/project/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 500, mtimeMs: 1000 },
        { path: '/a/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 100, mtimeMs: 2000 },
        { path: '/b/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 200, mtimeMs: 3000 },
      ],
    };
    const items = getDisplayItems(state);

    const dirItems = items.filter((i) => i.kind === 'directory');
    const groupItems = items.filter((i) => i.kind === 'file-group');
    expect(dirItems).toHaveLength(1);
    expect(groupItems).toHaveLength(1);
    if (groupItems[0]!.kind === 'file-group') {
      expect(groupItems[0]!.group.files).toHaveLength(2);
      expect(groupItems[0]!.group.totalSize).toBe(300);
    }
  });

  test('expands file group when type is in expandedFileTypes', () => {
    const state: AppState = {
      ...initialState,
      expandedFileTypes: new Set(['.tsbuildinfo']),
      artifacts: [
        { path: '/a/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 100, mtimeMs: 1000 },
        { path: '/b/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 200, mtimeMs: 2000 },
      ],
    };
    const items = getDisplayItems(state);

    expect(items).toHaveLength(4); // 1 separator + 1 group header + 2 files
    expect(items[0]!.kind).toBe('section-separator');
    expect(items[1]!.kind).toBe('file-group');
    expect(items[2]!.kind).toBe('file');
    expect(items[3]!.kind).toBe('file');
  });

  test('collapsed file group shows only header', () => {
    const state: AppState = {
      ...initialState,
      artifacts: [
        { path: '/a/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 100, mtimeMs: 1000 },
        { path: '/b/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 200, mtimeMs: 2000 },
      ],
    };
    const items = getDisplayItems(state);

    expect(items).toHaveLength(2); // 1 separator + the group header
    expect(items[0]!.kind).toBe('section-separator');
    expect(items[1]!.kind).toBe('file-group');
  });

  test('adds section separators for both directories and files', () => {
    const state: AppState = {
      ...initialState,
      artifacts: [
        { path: '/project/node_modules', type: 'node_modules', kind: 'directory', sizeBytes: 500, mtimeMs: 1000 },
        { path: '/a/.tsbuildinfo', type: '.tsbuildinfo', kind: 'file', sizeBytes: 100, mtimeMs: 2000 },
      ],
    };
    const items = getDisplayItems(state);
    const separators = items.filter((i) => i.kind === 'section-separator');
    expect(separators).toHaveLength(2);
    if (separators[0]!.kind === 'section-separator') {
      expect(separators[0]!.label).toBe('Directories');
    }
    if (separators[1]!.kind === 'section-separator') {
      expect(separators[1]!.label).toBe('Files');
    }
  });
});
