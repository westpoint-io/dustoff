import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import type { ScanResult } from '../scanner/types.js';
import { useScan } from './hooks/useScan.js';
import { ArtifactTable } from './components/ArtifactTable.js';
import { Header } from './components/Header.js';
import { StatusBar } from './components/StatusBar.js';
import { ShortcutBar } from './components/ShortcutBar.js';
import { DetailPanel } from './components/DetailPanel.js';
import { theme } from './theme.js';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

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
  | { type: 'DETAIL_TOGGLE' };

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
  detailVisible: true, // detail panel visible by default per mockup
  maxSizeBytes: 0,
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

    default: {
      return state;
    }
  }
}

// ---------------------------------------------------------------------------
// Launch splash screen
// ---------------------------------------------------------------------------

// Gradient ASCII art for launch screen
const LAUNCH_ASCII = [
  '██████╗ ██╗   ██╗███████╗████████╗ ██████╗ ███████╗███████╗',
  '██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██╔════╝',
  '██║  ██║██║   ██║███████╗   ██║   ██║   ██║█████╗  █████╗  ',
  '██║  ██║██║   ██║╚════██║   ██║   ██║   ██║██╔══╝  ██╔══╝  ',
  '██████╔╝╚██████╔╝███████║   ██║   ╚██████╔╝██║     ██║     ',
  '╚═════╝  ╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝     ',
];

const LAUNCH_COLORS = [theme.teal, theme.sky, theme.blue, theme.blue, theme.mauve, theme.mauve];

interface LaunchScreenProps {
  rootPath: string;
}

function LaunchScreen({ rootPath }: LaunchScreenProps): React.ReactElement {
  return (
    <Box
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flexGrow={1}
    >
      {/* Gradient ASCII art */}
      <Box flexDirection="column" alignItems="center">
        {LAUNCH_ASCII.map((line, i) => (
          <Text key={`launch-${i}`} color={LAUNCH_COLORS[i]} bold>{line}</Text>
        ))}
      </Box>

      <Box marginTop={1}>
        <Text color={theme.overlay0}>{'JS/TS artifact scanner & cleaner'}</Text>
      </Box>

      {/* Divider */}
      <Box marginTop={1}>
        <Text color={theme.surface0}>{'────────────────────────────'}</Text>
      </Box>

      {/* Scan path */}
      <Box marginTop={1}>
        <Text color={theme.overlay0}>{'scan  '}</Text>
        <Text color={theme.blue}>{rootPath}</Text>
      </Box>

      {/* Scanning indicator */}
      <Box marginTop={1}>
        <Spinner type="dots" />
        <Text color={theme.blue}>{' Scanning...'}</Text>
      </Box>

      <Box marginTop={1}>
        <Text color={theme.surface2}>{'Press '}</Text>
        <Text backgroundColor={theme.surface0} color={theme.subtext1}>{' q '}</Text>
        <Text color={theme.surface2}>{' to quit'}</Text>
      </Box>
    </Box>
  );
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
  const [visibleCount, setVisibleCount] = React.useState(10);

  useScan(rootPath, dispatch);

  useInput((input, key) => {
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
    } else if (input === 's') {
      dispatch({ type: 'SORT_CYCLE' });
    } else if (input === '1') {
      dispatch({ type: 'SORT_TO', key: 'size', dir: 'desc' });
    } else if (input === '2') {
      dispatch({ type: 'SORT_TO', key: 'path', dir: 'asc' });
    } else if (input === '3') {
      dispatch({ type: 'SORT_TO', key: 'age', dir: 'desc' });
    } else if (input === '4' || input === '5' || input === '6') {
      // No-op: future column placeholders
    } else if (input === '/') {
      // No-op: filter mode future feature
    } else if (input === 'q') {
      exit();
    }
  });

  // Launch state: no artifacts yet and still scanning
  if (state.artifacts.length === 0 && state.scanStatus === 'scanning') {
    return <LaunchScreen rootPath={rootPath} />;
  }

  // Compute derived values
  const totalBytes = state.artifacts.reduce(
    (sum, a) => sum + (a.sizeBytes ?? 0),
    0,
  );

  // Find oldest artifact info
  let oldestMtimeMs: number | undefined;
  let oldestPath: string | undefined;
  for (const a of state.artifacts) {
    if (a.mtimeMs !== undefined) {
      if (oldestMtimeMs === undefined || a.mtimeMs < oldestMtimeMs) {
        oldestMtimeMs = a.mtimeMs;
        oldestPath = a.path;
      }
    }
  }
  // Show relative path for oldest
  if (oldestPath) {
    const cwd = rootPath.endsWith('/') ? rootPath : rootPath + '/';
    if (oldestPath.startsWith(cwd)) {
      oldestPath = oldestPath.slice(cwd.length);
    }
  }

  // Count unique types
  const typeCount = new Set(state.artifacts.map(a => a.type)).size;

  const detailWidth = Math.max(30, Math.floor((process.stdout.columns || 80) * 0.3));
  const cursorArtifact = state.artifacts[state.cursorIndex];

  return (
    <Box flexDirection="column" height="100%">
      {/* Stats header with ASCII logo */}
      <Header
        totalBytes={totalBytes}
        artifactCount={state.artifacts.length}
        oldestMtimeMs={oldestMtimeMs}
        oldestPath={oldestPath}
        scanStatus={state.scanStatus}
        typeCount={typeCount}
      />

      {/* Main content: table + detail panel in split layout */}
      <Box flexGrow={1}>
        <Box flexGrow={1}>
          <ArtifactTable
            state={state}
            dispatch={dispatch}
            onVisibleCountChange={setVisibleCount}
          />
        </Box>
        {state.detailVisible && cursorArtifact !== undefined && (
          <DetailPanel artifact={cursorArtifact} width={detailWidth} />
        )}
      </Box>

      {/* Status bar */}
      <StatusBar
        scanStatus={state.scanStatus}
        scanDurationMs={state.scanDurationMs}
        directoriesScanned={state.directoriesScanned}
        cursorIndex={state.cursorIndex}
        totalArtifacts={state.artifacts.length}
      />

      {/* Shortcut bar */}
      <ShortcutBar />
    </Box>
  );
}
