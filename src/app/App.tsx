import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { useScan } from '../features/scanning/useScan.js';
import { ArtifactTable } from '../features/browse/ArtifactTable.js';
import { Header } from '../features/browse/Header.js';
import { DetailPanel } from '../features/browse/DetailPanel.js';
import { useDelete } from '../features/deletion/useDelete.js';
import { DeleteConfirm } from '../features/deletion/DeleteConfirm.js';
import { DeleteProgress } from '../features/deletion/DeleteProgress.js';
import { ShortcutBar } from './ShortcutBar.js';
import { StatusBar } from './StatusBar.js';
import { SearchBox } from '../features/browse/SearchBox.js';
import { LOGO, getThemeByName } from '../shared/themes.js';
import { ThemeProvider } from '../shared/ThemeContext.js';
import { formatBytes } from '../shared/formatters.js';
import { reducer, initialState, getSortedArtifacts } from './reducer.js';
import { loadThemeName, saveThemeName } from '../shared/config.js';

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

interface AppProps {
  rootPath?: string;
}

export default function App({ rootPath = process.cwd() }: AppProps): React.ReactElement {
  const [state, dispatch] = React.useReducer(reducer, {
    ...initialState,
    themeName: loadThemeName(),
  });
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [visibleCount, setVisibleCount] = useState(10);
  const [themeFlash, setThemeFlash] = useState<string | null>(null);

  // Resolve current theme palette from state
  const currentTheme = useMemo(
    () => getThemeByName(state.themeName),
    [state.themeName],
  );

  // Auto-dismiss delete toast after 3 seconds
  useEffect(() => {
    if (state.deleteToast === null) return;
    const id = setTimeout(() => dispatch({ type: 'DISMISS_TOAST' }), 3000);
    return () => clearTimeout(id);
  }, [state.deleteToast]);

  // Persist theme when it changes and show flash
  useEffect(() => {
    saveThemeName(state.themeName);
    setThemeFlash(state.themeName);
    const id = setTimeout(() => setThemeFlash(null), 1500);
    return () => clearTimeout(id);
  }, [state.themeName]);

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

  // Auto-show detail panel on wide terminals when scan completes
  const autoDetailFired = useRef(false);
  useEffect(() => {
    if (
      state.scanStatus === 'complete' &&
      termSize.width >= 120 &&
      !autoDetailFired.current
    ) {
      autoDetailFired.current = true;
      dispatch({ type: 'DETAIL_TOGGLE' });
    }
  }, [state.scanStatus, termSize.width]);

  // Delete handler
  const executeDelete = useDelete(state.artifacts, state.selectedPaths, dispatch);

  const sortedArtifacts = useMemo(
    () => getSortedArtifacts(state),
    [state.artifacts, state.sortKey, state.sortDir, state.searchQuery],
  );

  useInput((input, key) => {
    // Confirm delete dialog — navigate between Yes/Cancel
    if (state.viewMode === 'confirm-delete') {
      if (key.return) {
        // Execute based on focused button
        if (state.deleteConfirmFocus === 'yes') {
          executeDelete();
        } else {
          dispatch({ type: 'SET_VIEW_MODE', mode: 'browse' });
        }
      } else if (key.escape || input === 'n') {
        dispatch({ type: 'SET_VIEW_MODE', mode: 'browse' });
      } else if (key.leftArrow || key.rightArrow || key.tab) {
        // Toggle focus between Yes and Cancel
        const newFocus = state.deleteConfirmFocus === 'yes' ? 'cancel' : 'yes';
        dispatch({ type: 'DELETE_CONFIRM_FOCUS', focus: newFocus });
      }
      // Block all other input (navigation, selection, etc.)
      return;
    }

    // Deleting in progress — no input
    if (state.viewMode === 'deleting') return;

    // Search mode input
    if (state.isSearchMode) {
      const charCode = input?.charCodeAt(0) ?? -1;

      // Delete last character: Backspace, Ctrl+W (delete word)
      const isDeleteChar =
        key.backspace ||
        key.delete ||
        input === '\b' ||
        input === '\u0008' ||
        input === '\u007f' ||
        charCode === 8 ||
        charCode === 127 ||
        (key.ctrl && input === 'h') || // Ctrl+H (terminal sends for backspace)
        (key.ctrl && input === 'w'); // Ctrl+W (delete word, readline-style)

      if (isDeleteChar && state.searchQuery.length > 0) {
        dispatch({
          type: 'SET_SEARCH_QUERY',
          query: state.searchQuery.slice(0, -1),
        });
        return;
      }

      // Delete entire search query: Ctrl+U
      if (key.ctrl && input === 'u') {
        dispatch({
          type: 'SET_SEARCH_QUERY',
          query: '',
        });
        return;
      }

      if (key.return) {
        // Apply filter and exit search mode
        dispatch({ type: 'SET_SEARCH_MODE', enabled: false });
      } else if (key.escape) {
        // Clear search and exit search mode
        dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
        dispatch({ type: 'SET_SEARCH_MODE', enabled: false });
      } else if (input && input.length === 1 && charCode > 31 && !key.ctrl && !key.meta && !key.shift) {
        // Regular printable character (code > 31) — append to search
        dispatch({
          type: 'SET_SEARCH_QUERY',
          query: state.searchQuery + input,
        });
      }
      return; // Don't process other commands while searching
    }

    // Browse mode
    if (key.upArrow || input === 'k') {
      dispatch({ type: 'CURSOR_UP' });
    } else if (key.downArrow || input === 'j') {
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
      if (state.selectedPaths.size > 0) {
        dispatch({ type: 'CLEAR_SELECTION' });
      } else if (state.searchQuery.length > 0) {
        dispatch({ type: 'SET_SEARCH_QUERY', query: '' });
      }
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
    } else if (input === 't') {
      dispatch({ type: 'CYCLE_THEME' });
      // Flash will be set via the effect below
    } else if (input === 'g' && !key.shift) {
      dispatch({ type: 'CURSOR_HOME' });
    } else if (input === 'G') {
      dispatch({ type: 'CURSOR_END' });
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
    const BAR_W = 43; // Match LOGO width (43 chars)
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
            <Text key={`logo-${i}`} color={currentTheme.logoColors[i]}>{line}</Text>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text color={currentTheme.yellow}>{bar}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column" alignItems="center">
          {state.artifacts.length === 0 ? (
            <Text color={currentTheme.overlay0}>Scanning...</Text>
          ) : (
            <>
              <Text color={currentTheme.text}>
                {`Found `}
                <Text color={currentTheme.yellow} bold>{String(state.artifacts.length)}</Text>
                {` artifact${state.artifacts.length > 1 ? 's' : ''}`}
              </Text>
              <Text color={currentTheme.overlay0}>
                {`Calculating sizes... ${sizedCount}/${state.artifacts.length} · `}
                <Text color={currentTheme.yellow} bold>{formatBytes(totalBytes)}</Text>
              </Text>
            </>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <ThemeProvider value={currentTheme}>
      <Box flexDirection="column" height={termSize.height} paddingX={1} paddingBottom={1}>
        {/* Header: context left, logo right — no bottom gap */}
        <Header
          rootPath={rootPath}
          totalBytes={totalBytes}
          artifactCount={state.artifacts.length}
          oldestMtimeMs={oldestMtimeMs}
          scanStatus={state.scanStatus}
          sortKey={state.sortKey}
          sortDir={state.sortDir}
          selectedCount={state.selectedPaths.size}
          selectedBytes={selectedBytes}
          termHeight={termSize.height}
          searchQuery={state.searchQuery}
          isSearchMode={state.isSearchMode}
          filteredCount={sortedArtifacts.length}
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
            termHeight={termSize.height}
            onVisibleCountChange={setVisibleCount}
          />

          {/* Detail panel */}
          {state.detailVisible && cursorArtifact !== undefined && (
            <DetailPanel artifact={cursorArtifact} width={detailWidth} rootPath={rootPath} />
          )}
        </Box>

        {/* Delete confirmation — prominent bar above status */}
        {state.viewMode === 'confirm-delete' && (
          <DeleteConfirm selectedCount={state.selectedPaths.size} selectedBytes={selectedBytes} focus={state.deleteConfirmFocus} />
        )}

        {/* Delete progress — prominent bar above status */}
        {state.viewMode === 'deleting' && state.deleteProgress && (
          <DeleteProgress
            done={state.deleteProgress.done}
            total={state.deleteProgress.total}
            freedBytes={state.deleteProgress.freedBytes}
          />
        )}

        {/* Status bar */}
        <StatusBar
          scanStatus={state.scanStatus}
          scanDurationMs={state.scanDurationMs}
          directoriesScanned={state.directoriesScanned}
          cursorIndex={state.cursorIndex}
          totalArtifacts={sortedArtifacts.length}
        />

        {/* Theme flash indicator */}
        {themeFlash !== null && (
          <Box justifyContent="center">
            <Text color={currentTheme.accent} bold>{`Theme: ${themeFlash}`}</Text>
          </Box>
        )}

        {/* Post-delete toast */}
        {state.deleteToast !== null && (
          <Box justifyContent="center">
            <Text color={currentTheme.green} bold>{`Deleted ${state.deleteToast.count} artifact(s), freed ${formatBytes(state.deleteToast.freedBytes)}`}</Text>
          </Box>
        )}

        {/* Shortcut bar */}
        <ShortcutBar hasSelection={state.selectedPaths.size > 0} hasFilter={state.searchQuery.length > 0 && !state.isSearchMode} />
      </Box>
    </ThemeProvider>
  );
}
