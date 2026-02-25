import React from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import type { ScanResult } from '../scanner/types.js';
import { useScan } from './hooks/useScan.js';
import { ArtifactTable } from './components/ArtifactTable.js';
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
  maxSizeBytes: number; // track largest size for proportional bars
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

// Natural sort direction for each key
function naturalDir(key: 'size' | 'path' | 'age'): 'asc' | 'desc' {
  if (key === 'path') return 'asc';
  return 'desc'; // size and age default to descending
}

const initialState: AppState = {
  artifacts: [],
  scanStatus: 'scanning',
  scanDurationMs: null,
  directoriesScanned: 0,
  cursorIndex: 0,
  sortKey: 'size',
  sortDir: 'desc', // default: size descending
  detailVisible: false,
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
        // Already on this key — toggle direction
        return {
          ...state,
          sortDir: state.sortDir === 'asc' ? 'desc' : 'asc',
          cursorIndex: 0,
        };
      }
      // Switching to a new key — use provided direction (natural for this key)
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
      <Text bold color={theme.peach}>
        {'DUSTOFF'}
      </Text>
      <Text dimColor>
        {'JS/TS artifact scanner & cleaner'}
      </Text>
      <Box marginTop={1}>
        <Spinner type="dots" />
        <Text color={theme.blue}>{' Initializing scanner...'}</Text>
      </Box>
      <Box marginTop={1}>
        <Text color={theme.subtext0} dimColor>
          {rootPath}
        </Text>
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

  // Track visibleCount for page navigation — will be set by ArtifactTable
  const [visibleCount, setVisibleCount] = React.useState(10);

  // Start streaming scan
  useScan(rootPath, dispatch);

  // Keyboard input handler
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
      // No-op: future column placeholders — swallow to avoid terminal bleed
    } else if (input === '/') {
      // No-op: filter mode is a future feature — swallow
    } else if (input === 'q') {
      exit();
    }
  });

  // Launch state: no artifacts yet and still scanning
  if (state.artifacts.length === 0 && state.scanStatus === 'scanning') {
    return <LaunchScreen rootPath={rootPath} />;
  }

  // Calculate total reclaimable size
  const totalReclaimable = state.artifacts.reduce(
    (sum, a) => sum + (a.sizeBytes ?? 0),
    0,
  );

  // Build status line
  const statusText =
    state.scanStatus === 'complete'
      ? `Scan complete in ${state.scanDurationMs}ms`
      : `Scanning... ${state.directoriesScanned} directories visited`;

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box borderStyle="single" borderColor={theme.surface1} paddingX={1}>
        <Text bold color={theme.peach}>{'DUSTOFF'}</Text>
        <Text>{' · '}</Text>
        <Text color={theme.yellow}>{`${state.artifacts.length} artifacts`}</Text>
        {totalReclaimable > 0 && (
          <>
            <Text>{' · '}</Text>
            <Text color={theme.red}>{`${totalReclaimable.toLocaleString()} bytes reclaimable`}</Text>
          </>
        )}
      </Box>

      {/* Table */}
      <ArtifactTable
        state={state}
        dispatch={dispatch}
        onVisibleCountChange={setVisibleCount}
      />

      {/* Status bar */}
      <Box borderStyle="single" borderColor={theme.surface1} paddingX={1}>
        <Text color={state.scanStatus === 'complete' ? theme.green : theme.blue}>
          {statusText}
        </Text>
        <Text>{' · '}</Text>
        <Text color={theme.subtext0}>
          {`Row ${state.cursorIndex + 1} of ${state.artifacts.length}`}
        </Text>
      </Box>

      {/* Shortcut bar */}
      <Box paddingX={1}>
        <Text dimColor>
          {'↑↓ navigate · s/1-3 sort · Tab detail · q quit'}
        </Text>
      </Box>
    </Box>
  );
}
