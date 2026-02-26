import React, { useEffect, useState, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { useScan } from '../features/scanning/useScan.js';
import { ArtifactTable } from '../features/browse/ArtifactTable.js';
import { Header } from '../features/browse/Header.js';
import { DetailPanel } from '../features/browse/DetailPanel.js';
import { useDelete } from '../features/deletion/useDelete.js';
import { DeleteConfirm } from '../features/deletion/DeleteConfirm.js';
import { DeleteProgress } from '../features/deletion/DeleteProgress.js';
import { ShortcutBar } from './ShortcutBar.js';
import { SearchBox } from '../features/browse/SearchBox.js';
import { theme, LOGO, logoColors } from '../shared/theme.js';
import { formatBytes } from '../shared/formatters.js';
import { reducer, initialState, getSortedArtifacts } from './reducer.js';

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
  const executeDelete = useDelete(state.artifacts, state.selectedPaths, dispatch);

  const sortedArtifacts = useMemo(
    () => getSortedArtifacts(state),
    [state.artifacts, state.sortKey, state.sortDir, state.searchQuery],
  );

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

    // Search mode input
    if (state.isSearchMode) {
      if (key.return) {
        // Apply filter and exit search mode
        dispatch({ type: 'SET_SEARCH_MODE', enabled: false });
      } else if (key.escape) {
        // Clear search and exit search mode
        dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
        dispatch({ type: 'SET_SEARCH_MODE', enabled: false });
      } else if (key.backspace) {
        // Backspace — remove last character
        dispatch({
          type: 'SET_SEARCH_QUERY',
          query: state.searchQuery.slice(0, -1),
        });
      } else if (input && input.length === 1 && !key.ctrl && !key.meta && !key.shift) {
        // Regular character — append to search
        dispatch({
          type: 'SET_SEARCH_QUERY',
          query: state.searchQuery + input,
        });
      }
      return; // Don't process other commands while searching
    }

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
      const artifact = sortedArtifacts[state.cursorIndex];
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
    } else if (input === '/') {
      dispatch({ type: 'SET_SEARCH_MODE', enabled: true });
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
        sortKey={state.sortKey}
        sortDir={state.sortDir}
      />

      {/* Search box — shows when searching or has active filter */}
      <SearchBox
        query={state.searchQuery}
        isActive={state.isSearchMode}
        totalResults={sortedArtifacts.length}
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
        <DeleteConfirm selectedCount={state.selectedPaths.size} selectedBytes={selectedBytes} />
      )}

      {/* Delete progress — prominent bar above status */}
      {state.viewMode === 'deleting' && state.deleteProgress && (
        <DeleteProgress
          done={state.deleteProgress.done}
          total={state.deleteProgress.total}
          freedBytes={state.deleteProgress.freedBytes}
        />
      )}

      {/* Shortcut bar */}
      <ShortcutBar hasSelection={state.selectedPaths.size > 0} />
    </Box>
  );
}
