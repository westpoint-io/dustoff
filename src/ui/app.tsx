import React, { useEffect, useState, useCallback } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { rm } from 'node:fs/promises';
import type { ScanResult } from '../scanner/types.js';
import { useScan } from './hooks/useScan.js';
import { ArtifactTable } from './components/ArtifactTable.js';
import { Header } from './components/Header.js';
import { DetailPanel } from './components/DetailPanel.js';
import { ShortcutBar } from './components/ShortcutBar.js';
import { theme, accent, LOGO, logoColors } from './theme.js';
import { formatBytes } from './formatters.js';

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
  | { type: 'DELETE_COMPLETE'; deletedPaths: string[] };

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const SORT_CYCLE_ORDER: Array<'size' | 'path' | 'age'> = ['size', 'path', 'age'];

function naturalDir(key: 'size' | 'path' | 'age'): 'asc' | 'desc' {
  if (key === 'path') return 'asc';
  return 'desc';
}

const initialState: AppState = {
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

    default: {
      return state;
    }
  }
}

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

interface AppProps {
  rootPath?: string;
}

export default function App({ rootPath = process.cwd() }: AppProps): React.ReactElement {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [visibleCount, setVisibleCount] = useState(10);

  // Terminal size with resize listener
  const [termSize, setTermSize] = useState(() => ({
    width: stdout?.columns ?? 80,
    height: stdout?.rows ?? 24,
  }));

  useEffect(() => {
    if (!stdout) return;
    const handleResize = () => {
      setTermSize({
        width: stdout.columns ?? 80,
        height: stdout.rows ?? 24,
      });
    };
    stdout.on('resize', handleResize);
    return () => {
      stdout.removeListener('resize', handleResize);
    };
  }, [stdout]);

  useScan(rootPath, dispatch);

  // Delete handler
  const executeDelete = useCallback(async () => {
    const toDelete = state.artifacts.filter((a) => state.selectedPaths.has(a.path));
    if (toDelete.length === 0) return;

    dispatch({ type: 'SET_VIEW_MODE', mode: 'deleting' });

    let freedBytes = 0;
    const deletedPaths: string[] = [];

    for (let i = 0; i < toDelete.length; i++) {
      const artifact = toDelete[i]!;
      dispatch({
        type: 'DELETE_PROGRESS',
        done: i,
        total: toDelete.length,
        freedBytes,
      });

      try {
        await rm(artifact.path, { recursive: true, force: true });
        freedBytes += artifact.sizeBytes ?? 0;
        deletedPaths.push(artifact.path);
      } catch {
        // Skip failed deletions silently
      }
    }

    dispatch({
      type: 'DELETE_PROGRESS',
      done: toDelete.length,
      total: toDelete.length,
      freedBytes,
    });

    // Brief pause to show completion
    await new Promise((r) => setTimeout(r, 500));

    dispatch({ type: 'DELETE_COMPLETE', deletedPaths });
  }, [state.artifacts, state.selectedPaths]);

  useInput((input, key) => {
    // Confirm delete dialog
    if (state.viewMode === 'confirm-delete') {
      if (key.return) {
        executeDelete();
      } else if (key.escape || input === 'n') {
        dispatch({ type: 'SET_VIEW_MODE', mode: 'browse' });
      }
      return;
    }

    // Deleting in progress — no input
    if (state.viewMode === 'deleting') return;

    // Browse mode
    if (key.upArrow) {
      dispatch({ type: 'CURSOR_UP' });
    } else if (key.downArrow) {
      dispatch({ type: 'CURSOR_DOWN' });
    } else if (key.pageUp) {
      dispatch({ type: 'CURSOR_PAGE_UP', visibleCount });
    } else if (key.pageDown) {
      dispatch({ type: 'CURSOR_PAGE_DOWN', visibleCount });
    } else if (key.tab) {
      dispatch({ type: 'DETAIL_TOGGLE' });
    } else if (input === ' ') {
      const sorted = getSortedArtifacts(state);
      const artifact = sorted[state.cursorIndex];
      if (artifact) {
        dispatch({ type: 'TOGGLE_SELECT', path: artifact.path });
      }
    } else if (input === 'a') {
      dispatch({ type: 'SELECT_ALL' });
    } else if (input === 'd') {
      if (state.selectedPaths.size > 0) {
        dispatch({ type: 'SET_VIEW_MODE', mode: 'confirm-delete' });
      }
    } else if (key.escape) {
      dispatch({ type: 'CLEAR_SELECTION' });
    } else if (input === 's') {
      dispatch({ type: 'SORT_CYCLE' });
    } else if (input === '1') {
      dispatch({ type: 'SORT_TO', key: 'size', dir: 'desc' });
    } else if (input === '2') {
      dispatch({ type: 'SORT_TO', key: 'path', dir: 'asc' });
    } else if (input === '3') {
      dispatch({ type: 'SORT_TO', key: 'age', dir: 'desc' });
    } else if (input === 'q') {
      // Immediate exit — bypass Ink's graceful shutdown which stalls
      // while the scanner's async generator and size calculations drain.
      process.exit(0);
    }
  });

  // Compute derived values
  const totalBytes = state.artifacts.reduce(
    (sum, a) => sum + (a.sizeBytes ?? 0),
    0,
  );
  const sizedCount = state.artifacts.filter((a) => a.sizeBytes !== null).length;

  // Find oldest artifact
  let oldestMtimeMs: number | undefined;
  for (const a of state.artifacts) {
    if (a.mtimeMs !== undefined) {
      if (oldestMtimeMs === undefined || a.mtimeMs < oldestMtimeMs) {
        oldestMtimeMs = a.mtimeMs;
      }
    }
  }

  // Selection totals
  const selectedBytes = state.artifacts
    .filter((a) => state.selectedPaths.has(a.path))
    .reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);

  const detailWidth = state.detailVisible
    ? Math.max(28, Math.floor(termSize.width * 0.22))
    : 0;

  // Get cursor artifact from sorted list
  const sortedArtifacts = getSortedArtifacts(state);
  const cursorArtifact = sortedArtifacts[state.cursorIndex];

  // Animated progress bar position (indeterminate bounce)
  const [barTick, setBarTick] = useState(0);
  useEffect(() => {
    if (state.scanStatus !== 'scanning') return;
    const id = setInterval(() => setBarTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [state.scanStatus]);

  // Splash screen — shown during entire scan
  if (state.scanStatus === 'scanning') {
    const BAR_W = 40;
    const BLOCK_W = 8;
    // Bounce the filled block back and forth
    const cycle = (BAR_W - BLOCK_W) * 2;
    const pos = barTick % cycle;
    const offset = pos < BAR_W - BLOCK_W ? pos : cycle - pos;
    const bar = '░'.repeat(offset) + '█'.repeat(BLOCK_W) + '░'.repeat(BAR_W - BLOCK_W - offset);

    return (
      <Box flexDirection="column" height={termSize.height} paddingX={1} alignItems="center" justifyContent="center">
        <Box flexDirection="column" alignItems="center">
          {LOGO.map((line, i) => (
            <Text key={`logo-${i}`} color={logoColors[i]}>{line}</Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color={theme.yellow}>{bar}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column" alignItems="center">
          {state.artifacts.length === 0 ? (
            <Text color={theme.overlay0}>Scanning...</Text>
          ) : (
            <>
              <Text color={theme.text}>
                {`Found `}
                <Text color={theme.yellow} bold>{String(state.artifacts.length)}</Text>
                {` artifact${state.artifacts.length > 1 ? 's' : ''}`}
              </Text>
              <Text color={theme.overlay0}>
                {`Calculating sizes... ${sizedCount}/${state.artifacts.length} · `}
                <Text color={theme.yellow} bold>{formatBytes(totalBytes)}</Text>
              </Text>
            </>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height={termSize.height} paddingX={1}>
      {/* Header: context left, logo right — no bottom gap */}
      <Header
        rootPath={rootPath}
        totalBytes={totalBytes}
        artifactCount={state.artifacts.length}
        oldestMtimeMs={oldestMtimeMs}
        scanStatus={state.scanStatus}
      />

      {/* Table — always visible */}
      <Box flexGrow={1}>
        <ArtifactTable
          state={state}
          dispatch={dispatch}
          rootPath={rootPath}
          onVisibleCountChange={setVisibleCount}
        />

        {/* Detail panel */}
        {state.detailVisible && cursorArtifact !== undefined && (
          <DetailPanel artifact={cursorArtifact} width={detailWidth} />
        )}
      </Box>

      {/* Selection summary bar */}
      {state.selectedPaths.size > 0 && state.viewMode === 'browse' && (
        <Box justifyContent="space-between">
          <Box>
            <Text color={theme.blue} bold>{`${state.selectedPaths.size} selected`}</Text>
            <Text color={theme.blue}>{` — ${formatBytes(selectedBytes)} total`}</Text>
          </Box>
          <Box>
            <Text color={theme.overlay0}>
              <Text color={theme.blue} bold>{' d '}</Text>
              <Text color={theme.overlay0}>{' delete selected '}</Text>
              <Text color={theme.white} bold>{' Esc '}</Text>
              <Text color={theme.overlay0}>{' clear'}</Text>
            </Text>
          </Box>
        </Box>
      )}

      {/* Delete confirmation — prominent bar above status */}
      {state.viewMode === 'confirm-delete' && (
        <Box borderStyle="single" borderColor={theme.red} justifyContent="center" paddingX={2}>
          <Text color={theme.red} bold>
            {`  Delete ${state.selectedPaths.size} artifact${state.selectedPaths.size > 1 ? 's' : ''}?  `}
          </Text>
          <Text color={theme.yellow} bold>{`(${formatBytes(selectedBytes)} will be freed)  `}</Text>
          <Text backgroundColor="green" color="black">{' Yes '}</Text>
          <Text>{' '}</Text>
          <Text backgroundColor="gray" color="white">{' Cancel '}</Text>
        </Box>
      )}

      {/* Delete progress — prominent bar above status */}
      {state.viewMode === 'deleting' && state.deleteProgress && (
        <Box borderStyle="single" borderColor={theme.yellow} justifyContent="center" paddingX={2}>
          <Spinner type="dots" />
          <Text color={theme.red} bold>
            {`  Deleting... ${state.deleteProgress.done}/${state.deleteProgress.total}  `}
          </Text>
          <Text color={theme.overlay0}>
            {`${formatBytes(state.deleteProgress.freedBytes)} freed`}
          </Text>
        </Box>
      )}

      {/* Shortcut bar */}
      <ShortcutBar hasSelection={state.selectedPaths.size > 0} />
    </Box>
  );
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
  return sorted;
}
