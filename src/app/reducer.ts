import type { ScanResult } from '../features/scanning/types.js';
import { THEMES, DEFAULT_THEME_NAME } from '../shared/themes.js';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

export type ViewMode = 'browse' | 'confirm-delete' | 'deleting';

export interface AppState {
  artifacts: ScanResult[];
  scanStatus: 'scanning' | 'complete';
  scanDurationMs: number | null;
  directoriesScanned: number;
  cursorIndex: number;
  sortKey: 'size' | 'path' | 'age';
  sortDir: 'asc' | 'desc';
  detailVisible: boolean;
  maxSizeBytes: number;
  selectedPaths: Set<string>;
  viewMode: ViewMode;
  deleteProgress: { done: number; total: number; freedBytes: number } | null;
  isSearchMode: boolean;
  searchQuery: string;
  deleteConfirmFocus: 'yes' | 'cancel';
  themeName: string;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type AppAction =
  | { type: 'ARTIFACT_FOUND'; artifact: ScanResult }
  | { type: 'SIZE_RESOLVED'; path: string; sizeBytes: number }
  | { type: 'SCAN_COMPLETE'; durationMs: number }
  | { type: 'DIRS_SCANNED'; count: number }
  | { type: 'CURSOR_UP' }
  | { type: 'CURSOR_DOWN' }
  | { type: 'CURSOR_PAGE_UP'; visibleCount: number }
  | { type: 'CURSOR_PAGE_DOWN'; visibleCount: number }
  | { type: 'SORT_CYCLE' }
  | { type: 'SORT_TO'; key: 'size' | 'path' | 'age'; dir: 'asc' | 'desc' }
  | { type: 'DETAIL_TOGGLE' }
  | { type: 'TOGGLE_SELECT'; path: string }
  | { type: 'SELECT_ALL' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_VIEW_MODE'; mode: ViewMode }
  | { type: 'DELETE_PROGRESS'; done: number; total: number; freedBytes: number }
  | { type: 'DELETE_COMPLETE'; deletedPaths: string[] }
  | { type: 'SET_SEARCH_MODE'; enabled: boolean }
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'DELETE_CONFIRM_FOCUS'; focus: 'yes' | 'cancel' }
  | { type: 'CYCLE_THEME' }
  | { type: 'SET_THEME'; name: string };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const SORT_CYCLE_ORDER: Array<'size' | 'path' | 'age'> = ['size', 'path', 'age'];

function naturalDir(key: 'size' | 'path' | 'age'): 'asc' | 'desc' {
  if (key === 'path') return 'asc';
  return 'desc';
}

export const initialState: AppState = {
  artifacts: [],
  scanStatus: 'scanning',
  scanDurationMs: null,
  directoriesScanned: 0,
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
  themeName: DEFAULT_THEME_NAME,
};

export function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ARTIFACT_FOUND': {
      return {
        ...state,
        artifacts: [...state.artifacts, action.artifact],
      };
    }

    case 'SIZE_RESOLVED': {
      const artifacts = state.artifacts.map((a) =>
        a.path === action.path ? { ...a, sizeBytes: action.sizeBytes } : a,
      );
      const maxSizeBytes = artifacts.reduce(
        (max, a) => (a.sizeBytes !== null && a.sizeBytes > max ? a.sizeBytes : max),
        0,
      );
      return { ...state, artifacts, maxSizeBytes };
    }

    case 'SCAN_COMPLETE': {
      return {
        ...state,
        scanStatus: 'complete',
        scanDurationMs: action.durationMs,
      };
    }

    case 'DIRS_SCANNED': {
      return { ...state, directoriesScanned: action.count };
    }

    case 'CURSOR_UP': {
      return {
        ...state,
        cursorIndex: Math.max(0, state.cursorIndex - 1),
      };
    }

    case 'CURSOR_DOWN': {
      return {
        ...state,
        cursorIndex: Math.min(state.artifacts.length - 1, state.cursorIndex + 1),
      };
    }

    case 'CURSOR_PAGE_UP': {
      return {
        ...state,
        cursorIndex: Math.max(0, state.cursorIndex - action.visibleCount),
      };
    }

    case 'CURSOR_PAGE_DOWN': {
      return {
        ...state,
        cursorIndex: Math.min(
          state.artifacts.length - 1,
          state.cursorIndex + action.visibleCount,
        ),
      };
    }

    case 'SORT_CYCLE': {
      const currentIdx = SORT_CYCLE_ORDER.indexOf(state.sortKey);
      const nextKey = SORT_CYCLE_ORDER[(currentIdx + 1) % SORT_CYCLE_ORDER.length]!;
      return {
        ...state,
        sortKey: nextKey,
        sortDir: naturalDir(nextKey),
        cursorIndex: 0,
      };
    }

    case 'SORT_TO': {
      if (state.sortKey === action.key) {
        return {
          ...state,
          sortDir: state.sortDir === 'asc' ? 'desc' : 'asc',
          cursorIndex: 0,
        };
      }
      return {
        ...state,
        sortKey: action.key,
        sortDir: action.dir,
        cursorIndex: 0,
      };
    }

    case 'DETAIL_TOGGLE': {
      return { ...state, detailVisible: !state.detailVisible };
    }

    case 'TOGGLE_SELECT': {
      const next = new Set(state.selectedPaths);
      if (next.has(action.path)) {
        next.delete(action.path);
      } else {
        next.add(action.path);
      }
      return { ...state, selectedPaths: next };
    }

    case 'SELECT_ALL': {
      const allSelected = state.selectedPaths.size === state.artifacts.length;
      if (allSelected) {
        return { ...state, selectedPaths: new Set() };
      }
      return {
        ...state,
        selectedPaths: new Set(state.artifacts.map((a) => a.path)),
      };
    }

    case 'CLEAR_SELECTION': {
      return { ...state, selectedPaths: new Set() };
    }

    case 'SET_VIEW_MODE': {
      return { ...state, viewMode: action.mode };
    }

    case 'DELETE_PROGRESS': {
      return {
        ...state,
        deleteProgress: { done: action.done, total: action.total, freedBytes: action.freedBytes },
      };
    }

    case 'DELETE_COMPLETE': {
      const remaining = state.artifacts.filter((a) => !action.deletedPaths.includes(a.path));
      return {
        ...state,
        artifacts: remaining,
        selectedPaths: new Set(),
        viewMode: 'browse',
        deleteProgress: null,
        cursorIndex: Math.min(state.cursorIndex, Math.max(0, remaining.length - 1)),
      };
    }

    case 'SET_SEARCH_MODE': {
      return { ...state, isSearchMode: action.enabled };
    }

    case 'SET_SEARCH_QUERY': {
      return {
        ...state,
        searchQuery: action.query,
        cursorIndex: 0,
      };
    }

    case 'DELETE_CONFIRM_FOCUS': {
      return { ...state, deleteConfirmFocus: action.focus };
    }

    case 'CYCLE_THEME': {
      const currentIdx = THEMES.findIndex((t) => t.name === state.themeName);
      const nextIdx = (currentIdx + 1) % THEMES.length;
      return { ...state, themeName: THEMES[nextIdx]!.name };
    }

    case 'SET_THEME': {
      return { ...state, themeName: action.name };
    }

    default: {
      return state;
    }
  }
}

// Helper: sort artifacts (used by both ArtifactTable and App for cursor resolution)
export function getSortedArtifacts(state: AppState): ScanResult[] {
  const sorted = [...state.artifacts];
  sorted.sort((a, b) => {
    if (state.sortKey === 'size') {
      const aSize = a.sizeBytes ?? -1;
      const bSize = b.sizeBytes ?? -1;
      return state.sortDir === 'desc' ? bSize - aSize : aSize - bSize;
    }
    if (state.sortKey === 'path') {
      const cmp = a.path.localeCompare(b.path);
      return state.sortDir === 'asc' ? cmp : -cmp;
    }
    if (state.sortKey === 'age') {
      const aMtime = a.mtimeMs ?? 0;
      const bMtime = b.mtimeMs ?? 0;
      return state.sortDir === 'desc' ? aMtime - bMtime : bMtime - aMtime;
    }
    return 0;
  });

  // Apply search filter if query is non-empty
  if (state.searchQuery.length > 0) {
    const query = state.searchQuery.toLowerCase();
    return sorted.filter((artifact) =>
      artifact.path.toLowerCase().includes(query),
    );
  }

  return sorted;
}
