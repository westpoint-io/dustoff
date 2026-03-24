import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
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
import { TypeFilter } from '../features/browse/TypeFilter.js';
import { LOGO, getThemeByName } from '../shared/themes.js';
import { ThemeProvider } from '../shared/ThemeContext.js';
import { formatBytes, truncatePath } from '../shared/formatters.js';
import { reducer, initialState, getSortedArtifacts, getDisplayItems } from './reducer.js';
import type { DisplayItem } from './reducer.js';
import { loadThemeName, saveThemeName } from '../shared/config.js';
import { groupArtifacts, flattenGroups } from '../features/browse/grouping.js';
import type { FlatItem } from '../features/browse/grouping.js';

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

interface AppProps {
  rootPath?: string;
  exclude?: ReadonlySet<string>;
  targets?: ReadonlySet<string>;
  verbose?: boolean;
}

export default function App({ rootPath = process.cwd(), exclude, targets, verbose }: AppProps): React.ReactElement {
  const [state, dispatch] = React.useReducer(reducer, {
    ...initialState,
    themeName: loadThemeName(),
  });
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [visibleCount, setVisibleCount] = useState(10);
  const [themeFlash, setThemeFlash] = useState<string | null>(null);
  const [detailTotalLines, setDetailTotalLines] = useState(0);
  const handleDetailTotalLines = useCallback((n: number) => setDetailTotalLines(n), []);

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

  // Persist theme when it changes and show flash (skip initial mount)
  const initialThemeRef = useRef(true);
  useEffect(() => {
    if (initialThemeRef.current) {
      initialThemeRef.current = false;
      return;
    }
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

  useScan(rootPath, dispatch, termSize.width, exclude, targets, verbose);

  // Delete handler
  const executeDelete = useDelete(state.artifacts, state.selectedPaths, dispatch);

  const sortedArtifacts = useMemo(
    () => getSortedArtifacts(state),
    [state.artifacts, state.sortKey, state.sortDir, state.searchQuery, state.typeFilter],
  );

  const displayItems = useMemo(
    () => getDisplayItems(state),
    [state.artifacts, state.sortKey, state.sortDir, state.searchQuery, state.typeFilter, state.expandedFileTypes],
  );

  // Compute flat items for grouping mode
  const flatItems: FlatItem[] = useMemo(() => {
    if (!state.groupingEnabled) return [];
    const groups = groupArtifacts(sortedArtifacts, rootPath);
    return flattenGroups(groups, state.collapsedGroups, state.expandedFileTypes);
  }, [state.groupingEnabled, sortedArtifacts, rootPath, state.collapsedGroups, state.expandedFileTypes]);

  // Compute available types for type filter
  const availableTypes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of state.artifacts) {
      counts.set(a.type, (counts.get(a.type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({
        type,
        count,
        selected: state.typeFilter === null || state.typeFilter.has(type),
      }));
  }, [state.artifacts, state.typeFilter]);

  // Helper to get current flat item at cursor
  const getCursorFlatItem = (): FlatItem | undefined => {
    if (!state.groupingEnabled || flatItems.length === 0) return undefined;
    return flatItems[state.cursorIndex];
  };

  const getCursorDisplayItem = (): DisplayItem | undefined => {
    if (state.groupingEnabled) return undefined;
    return displayItems[state.cursorIndex];
  };

  // Skip cursor past section separators
  useEffect(() => {
    if (state.groupingEnabled) return;
    const item = displayItems[state.cursorIndex];
    if (item?.kind === 'section-separator') {
      // Try moving down first, then up
      if (state.cursorIndex + 1 < displayItems.length) {
        dispatch({ type: 'SET_CURSOR', index: state.cursorIndex + 1 });
      } else if (state.cursorIndex > 0) {
        dispatch({ type: 'SET_CURSOR', index: state.cursorIndex - 1 });
      }
    }
  }, [state.cursorIndex, state.groupingEnabled, displayItems]);

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
      } else if (input && input.length === 1 && charCode > 31 && !key.ctrl && !key.meta) {
        // Regular printable character (code > 31) — append to search (allow shift for uppercase)
        dispatch({
          type: 'SET_SEARCH_QUERY',
          query: state.searchQuery + input,
        });
      }
      return; // Don't process other commands while searching
    }

    // Type filter mode
    if (state.isTypeFilterMode) {
      if (key.upArrow || input === 'k') {
        dispatch({ type: 'TYPE_FILTER_CURSOR_UP' });
      } else if (key.downArrow || input === 'j') {
        dispatch({ type: 'TYPE_FILTER_CURSOR_DOWN', typeCount: availableTypes.length });
      } else if (input === ' ') {
        const typeInfo = availableTypes[state.typeFilterCursor];
        if (typeInfo) {
          dispatch({ type: 'TOGGLE_TYPE_FILTER', artifactType: typeInfo.type });
        }
      } else if (key.return) {
        dispatch({ type: 'SET_TYPE_FILTER_MODE', enabled: false });
      } else if (input === 'a') {
        // Toggle all: if all selected, deselect all; otherwise select all
        const allSelected = availableTypes.every((t) => t.selected);
        for (const t of availableTypes) {
          if (allSelected && t.selected) {
            dispatch({ type: 'TOGGLE_TYPE_FILTER', artifactType: t.type });
          } else if (!allSelected && !t.selected) {
            dispatch({ type: 'TOGGLE_TYPE_FILTER', artifactType: t.type });
          }
        }
      } else if (key.escape) {
        dispatch({ type: 'SET_TYPE_FILTER_MODE', enabled: false });
      }
      return;
    }

    // Browse mode

    // Range select — must be checked before regular cursor movement
    const rangeUp = state.viewMode === 'browse' && !state.isSearchMode && !state.isTypeFilterMode
      && ((key.shift && key.upArrow) || input === 'K');
    const rangeDown = state.viewMode === 'browse' && !state.isSearchMode && !state.isTypeFilterMode
      && ((key.shift && key.downArrow) || input === 'J');

    if (rangeUp || rangeDown) {
      const anchor = state.selectionAnchor ?? state.cursorIndex;
      const maxIndex = state.groupingEnabled && flatItems.length > 0
        ? flatItems.length - 1
        : displayItems.length - 1;
      const newCursor = rangeUp
        ? Math.max(0, state.cursorIndex - 1)
        : Math.min(maxIndex, state.cursorIndex + 1);
      const start = Math.min(anchor, newCursor);
      const end = Math.max(anchor, newCursor);

      let paths: string[];
      if (state.groupingEnabled && flatItems.length > 0) {
        paths = flatItems.slice(start, end + 1)
          .filter((item): item is Extract<typeof item, { kind: 'artifact' }> | Extract<typeof item, { kind: 'file-nested' }> =>
            item.kind === 'artifact' || item.kind === 'file-nested')
          .map((item) => item.artifact.path);
      } else {
        paths = displayItems.slice(start, end + 1)
          .filter((item): item is Extract<DisplayItem, { kind: 'directory' | 'file' }> =>
            item.kind === 'directory' || item.kind === 'file')
          .map((item) => item.artifact.path);
      }

      dispatch({ type: 'SET_RANGE_SELECTION', paths });
      dispatch({ type: 'SET_SELECTION_ANCHOR', anchor });
      dispatch({ type: 'SET_CURSOR', index: newCursor });
      return;
    }

    const effectiveItemCount = state.groupingEnabled && flatItems.length > 0
      ? flatItems.length
      : displayItems.length;
    if (key.upArrow || input === 'k') {
      dispatch({ type: 'CURSOR_UP' });
    } else if (key.downArrow || input === 'j') {
      dispatch({ type: 'CURSOR_DOWN', itemCount: effectiveItemCount });
    } else if (key.pageUp) {
      dispatch({ type: 'CURSOR_PAGE_UP', visibleCount, itemCount: effectiveItemCount });
    } else if (key.pageDown) {
      dispatch({ type: 'CURSOR_PAGE_DOWN', visibleCount, itemCount: effectiveItemCount });
    } else if (key.tab) {
      dispatch({ type: 'DETAIL_TOGGLE' });
    } else if (key.return) {
      if (state.groupingEnabled) {
        const item = getCursorFlatItem();
        if (item?.kind === 'group-header') {
          dispatch({ type: 'TOGGLE_GROUP_COLLAPSE', key: item.group.key });
        } else if (item?.kind === 'file-group-nested') {
          dispatch({ type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: item.type });
        }
      } else {
        const item = getCursorDisplayItem();
        if (item?.kind === 'file-group') {
          dispatch({ type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: item.group.type });
        }
      }
    } else if (key.rightArrow && state.groupingEnabled) {
      const item = getCursorFlatItem();
      if (item?.kind === 'group-header' && state.collapsedGroups.has(item.group.key)) {
        dispatch({ type: 'TOGGLE_GROUP_COLLAPSE', key: item.group.key });
      } else if (item?.kind === 'file-group-nested' && !state.expandedFileTypes.has(item.type)) {
        dispatch({ type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: item.type });
      }
    } else if (key.leftArrow && state.groupingEnabled) {
      const item = getCursorFlatItem();
      if (item?.kind === 'group-header' && !state.collapsedGroups.has(item.group.key)) {
        dispatch({ type: 'TOGGLE_GROUP_COLLAPSE', key: item.group.key });
      } else if (item?.kind === 'file-group-nested' && state.expandedFileTypes.has(item.type)) {
        dispatch({ type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: item.type });
      }
    } else if (key.rightArrow && !state.groupingEnabled) {
      const item = getCursorDisplayItem();
      if (item?.kind === 'file-group' && !state.expandedFileTypes.has(item.group.type)) {
        dispatch({ type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: item.group.type });
      }
    } else if (key.leftArrow && !state.groupingEnabled) {
      const item = getCursorDisplayItem();
      if (item?.kind === 'file-group' && state.expandedFileTypes.has(item.group.type)) {
        dispatch({ type: 'TOGGLE_FILE_TYPE_EXPAND', fileType: item.group.type });
      }
    } else if (input === ' ' && key.shift && state.selectionAnchor !== null) {
      const start = Math.min(state.selectionAnchor, state.cursorIndex);
      const end = Math.max(state.selectionAnchor, state.cursorIndex);
      let paths: string[];
      if (state.groupingEnabled && flatItems.length > 0) {
        paths = flatItems.slice(start, end + 1)
          .filter((item): item is Extract<typeof item, { kind: 'artifact' }> | Extract<typeof item, { kind: 'file-nested' }> =>
            item.kind === 'artifact' || item.kind === 'file-nested')
          .map((item) => item.artifact.path);
      } else {
        paths = displayItems.slice(start, end + 1)
          .filter((item): item is Extract<DisplayItem, { kind: 'directory' | 'file' }> =>
            item.kind === 'directory' || item.kind === 'file')
          .map((item) => item.artifact.path);
      }
      dispatch({ type: 'SELECT_PATHS', paths });
      return;
    } else if (input === ' ') {
      if (state.groupingEnabled) {
        const item = getCursorFlatItem();
        if (item?.kind === 'group-header') {
          const paths = item.group.children.map((c) => c.path);
          const allSelected = paths.every((p) => state.selectedPaths.has(p));
          if (allSelected) {
            dispatch({ type: 'DESELECT_PATHS', paths });
          } else {
            dispatch({ type: 'SELECT_PATHS', paths });
          }
        } else if (item?.kind === 'artifact') {
          dispatch({ type: 'TOGGLE_SELECT', path: item.artifact.path });
        } else if (item?.kind === 'file-group-nested') {
          dispatch({
            type: 'TOGGLE_FILE_GROUP_SELECT',
            paths: item.files.map((f) => f.path),
          });
        } else if (item?.kind === 'file-nested') {
          dispatch({ type: 'TOGGLE_SELECT', path: item.artifact.path });
        }
      } else {
        const item = getCursorDisplayItem();
        if (item?.kind === 'file-group') {
          dispatch({
            type: 'TOGGLE_FILE_GROUP_SELECT',
            paths: item.group.files.map((f) => f.path),
          });
        } else if (item?.kind === 'directory' || item?.kind === 'file') {
          dispatch({ type: 'TOGGLE_SELECT', path: item.artifact.path });
        }
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
    } else if (input === 'f') {
      dispatch({ type: 'SET_TYPE_FILTER_MODE', enabled: true });
    } else if (input === '/') {
      dispatch({ type: 'SET_SEARCH_MODE', enabled: true });
    } else if (input === 't') {
      dispatch({ type: 'CYCLE_THEME' });
      // Flash will be set via the effect below
    } else if (input === 'g' && !key.shift) {
      dispatch({ type: 'CURSOR_HOME' });
    } else if (input === 'G') {
      dispatch({ type: 'CURSOR_END', itemCount: effectiveItemCount });
    } else if (input === 'x') {
      dispatch({ type: 'TOGGLE_GROUPING' });
    } else if (input === '-' && state.detailVisible) {
      dispatch({ type: 'DETAIL_SCROLL_UP' });
    } else if ((input === '+' || input === '=') && state.detailVisible) {
      dispatch({ type: 'DETAIL_SCROLL_DOWN', totalLines: detailTotalLines, maxHeight: detailMaxHeight - 2 });
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

  const detailFullScreen = termSize.width < 130 && state.detailVisible;

  const detailWidth = state.detailVisible && !detailFullScreen
    ? Math.max(45, Math.floor(termSize.width * 0.22))
    : 0;

  // Detail panel max height: total height minus header, status bar, shortcut bar, padding
  const headerHeight = termSize.height < 30 ? 1 : LOGO.length;
  const overlayHeight = state.viewMode === 'confirm-delete' || state.viewMode === 'deleting' ? 2 : 0; // 3 rows - 1 marginTop overlap
  const detailMaxHeight = Math.max(5, termSize.height - headerHeight - 4 - overlayHeight); // status(1) + shortcuts(1) + paddingBottom(1) + headerMarginTop(1)

  // Get cursor artifact from sorted list (or from flat items if grouping)
  const cursorArtifact = useMemo(() => {
    if (state.groupingEnabled && flatItems.length > 0) {
      const item = flatItems[state.cursorIndex];
      if (item?.kind === 'artifact' || item?.kind === 'file-nested') return item.artifact;
      return undefined;
    }
    const dItem = displayItems[state.cursorIndex];
    if (dItem?.kind === 'directory' || dItem?.kind === 'file') return dItem.artifact;
    return undefined;
  }, [state.groupingEnabled, flatItems, displayItems, state.cursorIndex]);

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
    const artifactCount = state.artifacts.length;
    const elapsedSec = Math.floor(barTick * 80 / 1000);
    const isDeterminate = artifactCount > 0;

    let bar: React.ReactNode;
    if (isDeterminate) {
      // Determinate progress bar: filled portion based on sizedCount / artifactCount
      const pct = artifactCount > 0 ? sizedCount / artifactCount : 0;
      const filled = Math.round(pct * BAR_W);
      const empty = BAR_W - filled;
      const pctLabel = `${Math.round(pct * 100)}%`;
      bar = (
        <Box>
          <Text>
            <Text color={currentTheme.accent}>{'█'.repeat(filled)}</Text>
            <Text color={currentTheme.overlay0}>{'░'.repeat(empty)}</Text>
          </Text>
          <Text color={currentTheme.text}>{` ${pctLabel}`}</Text>
        </Box>
      );
    } else {
      // Indeterminate bouncing block
      const BLOCK_W = 8;
      const cycle = (BAR_W - BLOCK_W) * 2;
      const pos = barTick % cycle;
      const offset = pos < BAR_W - BLOCK_W ? pos : cycle - pos;
      const bounceBar = '░'.repeat(offset) + '█'.repeat(BLOCK_W) + '░'.repeat(BAR_W - BLOCK_W - offset);
      bar = <Text color={currentTheme.yellow}>{bounceBar}</Text>;
    }

    return (
      <Box flexDirection="column" height={termSize.height} paddingX={1} alignItems="center" justifyContent="center">
        <Box flexDirection="column" alignItems="center">
          {LOGO.map((line, i) => (
            <Text key={`logo-${i}`} color={currentTheme.logoColors[i]}>{line}</Text>
          ))}
        </Box>
        <Box marginTop={1}>
          {bar}
        </Box>
        <Box marginTop={1} flexDirection="column" alignItems="center">
          <Text color={currentTheme.overlay0}>{truncatePath(rootPath.replace(process.env.HOME || '', '~'), BAR_W)}</Text>
          {artifactCount === 0 ? (
            <Text color={currentTheme.overlay0}>Scanning...</Text>
          ) : (
            <>
              <Text color={currentTheme.text}>
                {`Found `}
                <Text color={currentTheme.yellow} bold>{String(artifactCount)}</Text>
                {` artifact${artifactCount > 1 ? 's' : ''} · Sizing ${sizedCount}/${artifactCount}`}
              </Text>
              <Text color={currentTheme.accent} bold>{formatBytes(totalBytes)}</Text>
            </>
          )}
          <Text color={currentTheme.overlay0}>{`${elapsedSec}s`}</Text>
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
          typeFilter={state.typeFilter}
          detailWidth={detailWidth}
        />

        {/* Table — always visible */}
        <Box flexGrow={1}>
          {/* Type filter picker replaces table when active */}
          {state.isTypeFilterMode ? (
            <Box flexGrow={1} justifyContent="center" alignItems="center">
              <TypeFilter types={availableTypes} cursorIndex={state.typeFilterCursor} width={Math.floor(termSize.width * 0.6)} />
            </Box>
          ) : detailFullScreen && cursorArtifact !== undefined ? (
            <DetailPanel
              artifact={cursorArtifact}
              width={termSize.width - 2}
              rootPath={rootPath}
              maxHeight={detailMaxHeight}
              scrollOffset={state.detailScrollOffset}
              onTotalLinesChange={handleDetailTotalLines}
            />
          ) : (
            <>
              <ArtifactTable
                state={state}
                dispatch={dispatch}
                rootPath={rootPath}
                termHeight={termSize.height}
                termWidth={termSize.width}
                detailWidth={detailWidth}
                onVisibleCountChange={setVisibleCount}
                flatItems={state.groupingEnabled ? flatItems : undefined}
                displayItems={state.groupingEnabled ? undefined : displayItems}
                searchQuery={state.searchQuery}
                isSearchMode={state.isSearchMode}
                searchResultCount={sortedArtifacts.length}
                extraReservedRows={overlayHeight}
              />

              {/* Detail panel */}
              {state.detailVisible && cursorArtifact !== undefined && (
                <DetailPanel
                  artifact={cursorArtifact}
                  width={detailWidth}
                  rootPath={rootPath}
                  maxHeight={detailMaxHeight}
                  scrollOffset={state.detailScrollOffset}
                  onTotalLinesChange={handleDetailTotalLines}
                />
              )}
            </>
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
          totalArtifacts={state.groupingEnabled && flatItems.length > 0 ? flatItems.length : displayItems.length}
        />

        {/* Shortcut bar — replaced by flash/toast when active */}
        {themeFlash !== null ? (
          <Box justifyContent="center">
            <Text color={currentTheme.accent} bold>{`Theme: ${themeFlash}`}</Text>
          </Box>
        ) : state.deleteToast !== null ? (
          <Box justifyContent="center">
            <Text color={currentTheme.green} bold>{`Deleted ${state.deleteToast.count} artifact(s), freed ${formatBytes(state.deleteToast.freedBytes)}`}</Text>
          </Box>
        ) : (
          <ShortcutBar hasSelection={state.selectedPaths.size > 0} hasFilter={state.searchQuery.length > 0 && !state.isSearchMode} detailScrollable={state.detailVisible && detailTotalLines > detailMaxHeight - 2} />
        )}
      </Box>
    </ThemeProvider>
  );
}
