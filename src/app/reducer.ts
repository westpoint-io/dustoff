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
  deleteToast: { count: number; freedBytes: number } | null;
  groupingEnabled: boolean;
  collapsedGroups: Set<string>;
  typeFilter: Set<string> | null;
  isTypeFilterMode: boolean;
  typeFilterCursor: number;
  selectionAnchor: number | null;
  detailScrollOffset: number;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export type AppAction =
  | { type: 'ARTIFACT_FOUND'; artifact: ScanResult }
  | { type: 'SIZE_RESOLVED'; path: string; sizeBytes: number }
  | { type: 'SCAN_COMPLETE'; durationMs: number; termWidth?: number }
  | { type: 'DIRS_SCANNED'; count: number }
  | { type: 'CURSOR_UP' }
  | { type: 'CURSOR_DOWN'; itemCount?: number }
  | { type: 'CURSOR_PAGE_UP'; visibleCount: number; itemCount?: number }
  | { type: 'CURSOR_PAGE_DOWN'; visibleCount: number; itemCount?: number }
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
  | { type: 'CURSOR_HOME' }
  | { type: 'CURSOR_END'; itemCount?: number }
  | { type: 'CYCLE_THEME' }
  | { type: 'SET_THEME'; name: string }
  | { type: 'DISMISS_TOAST' }
  | { type: 'TOGGLE_GROUPING' }
  | { type: 'TOGGLE_GROUP_COLLAPSE'; key: string }
  | { type: 'SELECT_PATHS'; paths: string[] }
  | { type: 'DESELECT_PATHS'; paths: string[] }
  | { type: 'SET_RANGE_SELECTION'; paths: string[] }
  | { type: 'SET_TYPE_FILTER_MODE'; enabled: boolean }
  | { type: 'TOGGLE_TYPE_FILTER'; artifactType: string }
  | { type: 'TYPE_FILTER_CURSOR_UP' }
  | { type: 'TYPE_FILTER_CURSOR_DOWN'; typeCount: number }
  | { type: 'CLEAR_TYPE_FILTER' }
  | { type: 'SET_CURSOR'; index: number }
  | { type: 'SET_SELECTION_ANCHOR'; anchor: number }
  | { type: 'DETAIL_SCROLL_UP' }
  | { type: 'DETAIL_SCROLL_DOWN'; totalLines: number; maxHeight: number };

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
  deleteToast: null,
  groupingEnabled: false,
  collapsedGroups: new Set(),
  typeFilter: null,
  isTypeFilterMode: false,
  typeFilterCursor: 0,
  selectionAnchor: null,
  detailScrollOffset: 0,
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
      const autoDetail = action.termWidth !== undefined && action.termWidth >= 130;
      return {
        ...state,
        scanStatus: 'complete',
        scanDurationMs: action.durationMs,
        detailVisible: autoDetail ? true : state.detailVisible,
      };
    }

    case 'DIRS_SCANNED': {
      return { ...state, directoriesScanned: action.count };
    }

    case 'CURSOR_UP': {
      return {
        ...state,
        cursorIndex: Math.max(0, state.cursorIndex - 1),
        selectionAnchor: null,
        detailScrollOffset: 0,
      };
    }

    case 'CURSOR_DOWN': {
      const max = (action.itemCount ?? state.artifacts.length) - 1;
      return {
        ...state,
        cursorIndex: Math.min(max, state.cursorIndex + 1),
        selectionAnchor: null,
        detailScrollOffset: 0,
      };
    }

    case 'CURSOR_HOME': {
      return { ...state, cursorIndex: 0, selectionAnchor: null, detailScrollOffset: 0 };
    }

    case 'CURSOR_END': {
      const max = (action.itemCount ?? state.artifacts.length) - 1;
      return {
        ...state,
        cursorIndex: Math.max(0, max),
        selectionAnchor: null,
        detailScrollOffset: 0,
      };
    }

    case 'CURSOR_PAGE_UP': {
      return {
        ...state,
        cursorIndex: Math.max(0, state.cursorIndex - action.visibleCount),
        selectionAnchor: null,
        detailScrollOffset: 0,
      };
    }

    case 'CURSOR_PAGE_DOWN': {
      const max = (action.itemCount ?? state.artifacts.length) - 1;
      return {
        ...state,
        cursorIndex: Math.min(max, state.cursorIndex + action.visibleCount),
        selectionAnchor: null,
        detailScrollOffset: 0,
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
      return { ...state, detailVisible: !state.detailVisible, detailScrollOffset: 0 };
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
      const deletedSet = new Set(action.deletedPaths);
      const freedBytes = state.artifacts
        .filter((a) => deletedSet.has(a.path))
        .reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);
      const remaining = state.artifacts.filter((a) => !deletedSet.has(a.path));
      return {
        ...state,
        artifacts: remaining,
        selectedPaths: new Set(),
        viewMode: 'browse',
        deleteProgress: null,
        cursorIndex: Math.min(state.cursorIndex, Math.max(0, remaining.length - 1)),
        deleteToast: { count: action.deletedPaths.length, freedBytes },
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

    case 'DISMISS_TOAST': {
      return { ...state, deleteToast: null };
    }

    case 'TOGGLE_GROUPING': {
      return {
        ...state,
        groupingEnabled: !state.groupingEnabled,
        collapsedGroups: new Set(),
        cursorIndex: 0,
      };
    }

    case 'TOGGLE_GROUP_COLLAPSE': {
      const next = new Set(state.collapsedGroups);
      if (next.has(action.key)) {
        next.delete(action.key);
      } else {
        next.add(action.key);
      }
      return { ...state, collapsedGroups: next };
    }

    case 'SELECT_PATHS': {
      const next = new Set(state.selectedPaths);
      for (const p of action.paths) {
        next.add(p);
      }
      return { ...state, selectedPaths: next };
    }

    case 'DESELECT_PATHS': {
      const next = new Set(state.selectedPaths);
      for (const p of action.paths) {
        next.delete(p);
      }
      return { ...state, selectedPaths: next };
    }

    case 'SET_RANGE_SELECTION': {
      return { ...state, selectedPaths: new Set(action.paths) };
    }

    case 'SET_TYPE_FILTER_MODE': {
      return {
        ...state,
        isTypeFilterMode: action.enabled,
        typeFilterCursor: action.enabled ? 0 : state.typeFilterCursor,
      };
    }

    case 'TOGGLE_TYPE_FILTER': {
      if (state.typeFilter === null) {
        // Starting from "show all" — create set with all types EXCEPT the toggled one
        const allTypes = new Set(state.artifacts.map((a) => a.type));
        allTypes.delete(action.artifactType);
        // If removing one type still leaves all others, return the set
        return { ...state, typeFilter: allTypes, cursorIndex: 0 };
      }
      const next = new Set(state.typeFilter);
      if (next.has(action.artifactType)) {
        next.delete(action.artifactType);
      } else {
        next.add(action.artifactType);
      }
      // If the set now includes all artifact types, reset to null
      const allTypes = new Set(state.artifacts.map((a) => a.type));
      if (allTypes.size === next.size && [...allTypes].every((t) => next.has(t))) {
        return { ...state, typeFilter: null, cursorIndex: 0 };
      }
      return { ...state, typeFilter: next, cursorIndex: 0 };
    }

    case 'TYPE_FILTER_CURSOR_UP': {
      return {
        ...state,
        typeFilterCursor: Math.max(0, state.typeFilterCursor - 1),
      };
    }

    case 'TYPE_FILTER_CURSOR_DOWN': {
      return {
        ...state,
        typeFilterCursor: Math.min(action.typeCount - 1, state.typeFilterCursor + 1),
      };
    }

    case 'CLEAR_TYPE_FILTER': {
      return { ...state, typeFilter: null, cursorIndex: 0 };
    }

    case 'SET_CURSOR': {
      return { ...state, cursorIndex: action.index };
    }

    case 'SET_SELECTION_ANCHOR': {
      return { ...state, selectionAnchor: action.anchor };
    }

    case 'DETAIL_SCROLL_UP': {
      return {
        ...state,
        detailScrollOffset: Math.max(0, state.detailScrollOffset - 1),
      };
    }

    case 'DETAIL_SCROLL_DOWN': {
      const maxOffset = Math.max(0, action.totalLines - action.maxHeight);
      return {
        ...state,
        detailScrollOffset: Math.min(maxOffset, state.detailScrollOffset + 1),
      };
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

  // Apply type filter
  let result = sorted;
  if (state.typeFilter !== null && state.typeFilter.size > 0) {
    result = result.filter((a) => state.typeFilter!.has(a.type));
  }

  // Apply search filter if query is non-empty
  if (state.searchQuery.length > 0) {
    const query = state.searchQuery.toLowerCase();
    return result.filter((artifact) =>
      artifact.path.toLowerCase().includes(query),
    );
  }

  return result;
}
