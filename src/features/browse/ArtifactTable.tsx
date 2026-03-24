import React, { useEffect, useMemo } from 'react';
import type { Dispatch } from 'react';
import { Box, Text } from 'ink';
import type { AppState, AppAction, DisplayItem } from '../../app/reducer.js';
import { getSortedArtifacts } from '../../app/reducer.js';
import { ArtifactRow } from './ArtifactRow.js';
import { FileGroupRow } from './FileGroupRow.js';
import { GroupRow } from './GroupRow.js';
import { SectionSeparator } from './SectionSeparator.js';
import { useWindow } from './useWindow.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { TYPE_W, SIZE_W, AGE_W } from '../../shared/themes.js';
import { BAR_WIDTH } from './SizeBar.js';
import { findCommonDirPrefix } from '../../shared/pathUtils.js';
import { isSensitive } from '../../shared/sensitive.js';

// Fixed width for right-side columns — must match ArtifactRow's RIGHT_W
const RIGHT_W = 1 + BAR_WIDTH + 1 + SIZE_W + 1 + AGE_W + 1;
import { groupArtifacts, flattenGroups } from './grouping.js';
import type { FlatItem } from './grouping.js';

// Full header (5 logo lines + 1 marginTop) + border(2) + colHeader(1) + status(1) + shortcut(1) + paddingBottom(1) = 12
const RESERVED_ROWS_FULL = 12;
// Compact header (1 line) + border(2) + colHeader(1) + status(1) + shortcut(1) + selection(1) = 7
const RESERVED_ROWS_COMPACT = 7;

/**
 * Renders a scrollbar track as an array of single characters.
 * ▓ = thumb (visible portion), ░ = track (rest).
 */
export function renderScrollbar(
  visibleCount: number,
  totalItems: number,
  scrollOffset: number,
): string[] {
  const trackHeight = visibleCount;
  const thumbHeight = Math.max(1, Math.round((visibleCount / totalItems) * trackHeight));
  const maxOffset = Math.max(1, totalItems - visibleCount);
  const thumbPosition = Math.round((scrollOffset / maxOffset) * (trackHeight - thumbHeight));

  const chars: string[] = [];
  for (let i = 0; i < trackHeight; i++) {
    chars.push(i >= thumbPosition && i < thumbPosition + thumbHeight ? '▓' : '░');
  }
  return chars;
}

interface ArtifactTableProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  rootPath: string;
  termHeight?: number;
  termWidth?: number;
  detailWidth?: number;
  onVisibleCountChange?: (count: number) => void;
  flatItems?: FlatItem[];
  displayItems?: DisplayItem[];
  searchQuery?: string;
  isSearchMode?: boolean;
  searchResultCount?: number;
  extraReservedRows?: number;
}

// Left-side fixed columns: checkbox (5) + type (TYPE_W)
const LEFT_W = 5 + TYPE_W;

export function ArtifactTable({
  state,
  dispatch,
  rootPath,
  termHeight = 40,
  termWidth = 80,
  detailWidth = 0,
  onVisibleCountChange,
  flatItems,
  displayItems,
  searchQuery = '',
  isSearchMode = false,
  searchResultCount = 0,
  extraReservedRows = 0,
}: ArtifactTableProps): React.ReactElement {
  const theme = useTheme();
  const sortedArtifacts = getSortedArtifacts(state);
  const reservedRows = (termHeight >= 30 ? RESERVED_ROWS_FULL : RESERVED_ROWS_COMPACT) + extraReservedRows;

  // In grouping mode, use flat items; with display items, use those; else sorted artifacts
  const totalItemCount = state.groupingEnabled && flatItems
    ? flatItems.length
    : displayItems
    ? displayItems.length
    : sortedArtifacts.length;

  const { visibleItems: visibleFlatItems, scrollOffset, visibleCount } = useWindow<FlatItem>(
    state.groupingEnabled && flatItems ? flatItems : sortedArtifacts.map((a) => ({ kind: 'artifact' as const, artifact: a, indented: false })),
    state.cursorIndex,
    reservedRows,
  );

  const { visibleItems: visibleArtifacts, scrollOffset: artScrollOffset, visibleCount: artVisibleCount } = useWindow(
    sortedArtifacts,
    state.cursorIndex,
    reservedRows,
  );

  const { visibleItems: visibleDisplayItems, scrollOffset: displayScrollOffset, visibleCount: displayVisibleCount } = useWindow<DisplayItem>(
    displayItems ?? [],
    state.cursorIndex,
    reservedRows,
  );

  // Use the right values depending on mode
  const effectiveVisibleCount = state.groupingEnabled && flatItems
    ? visibleCount
    : displayItems
    ? displayVisibleCount
    : artVisibleCount;
  const effectiveScrollOffset = state.groupingEnabled && flatItems
    ? scrollOffset
    : displayItems
    ? displayScrollOffset
    : artScrollOffset;

  useEffect(() => {
    onVisibleCountChange?.(effectiveVisibleCount);
  }, [effectiveVisibleCount, onVisibleCountChange]);

  const showScrollbar = totalItemCount > effectiveVisibleCount;

  // Compute max path width: total width minus fixed columns, border, padding, detail panel, scrollbar
  // paddingX(2) + border(2) + LEFT_W + RIGHT_W + scrollbar(0|1) + detailWidth
  const scrollbarW = showScrollbar ? 1 : 0;
  const pathWidth = Math.max(20, termWidth - 2 - 2 - LEFT_W - RIGHT_W - scrollbarW - detailWidth);

  const scrollbarChars = useMemo(
    () =>
      showScrollbar
        ? renderScrollbar(effectiveVisibleCount, totalItemCount, effectiveScrollOffset)
        : [],
    [showScrollbar, effectiveVisibleCount, totalItemCount, effectiveScrollOffset],
  );

  // Compute display paths and common prefix for dim-prefix rendering
  const commonPrefix = useMemo(() => {
    const prefix = rootPath.endsWith('/') ? rootPath : rootPath + '/';
    const displayPaths = sortedArtifacts.map((a) =>
      a.path.startsWith(prefix) ? a.path.slice(prefix.length) : a.path,
    );
    return findCommonDirPrefix(displayPaths);
  }, [sortedArtifacts, rootPath]);

  // Compute set of sensitive artifact paths
  const sensitiveSet = useMemo(() => {
    const set = new Set<string>();
    for (const a of sortedArtifacts) {
      if (isSensitive(a.path).sensitive) set.add(a.path);
    }
    return set;
  }, [sortedArtifacts]);

  // Column header labels — no arrows, just plain text
  const sizeLabel = 'SIZE'.padStart(SIZE_W);
  const ageLabel = 'AGE'.padStart(AGE_W);

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={theme.accent}>
      {/* Search bar — inside table border */}
      {(isSearchMode || searchQuery.length > 0) && (
        <Box paddingX={1}>
          <Text color={theme.accent} bold>{'/ '}</Text>
          <Text bold>{searchQuery || '_'}</Text>
          {searchQuery.length > 0 && (
            <Text color={theme.overlay0}>{` (${searchResultCount} results)`}</Text>
          )}
        </Box>
      )}
      {/* Column headers */}
      <Box>
        <Text color={theme.headerColor} bold>
          {'     '}{('TYPE').padEnd(TYPE_W)}{'PATH'}
        </Text>
        <Box flexGrow={1} />
        <Text color={theme.headerColor} bold>
          {sizeLabel}{' '}{ageLabel}{' '}
        </Text>
        {showScrollbar && <Text>{' '}</Text>}
      </Box>

      {/* Rows — full-row cursor highlight */}
      {state.groupingEnabled && flatItems ? (
        // Grouped mode: render flat items
        visibleFlatItems.map((item, i) => {
          const absoluteIndex = effectiveScrollOffset + i;
          const key = item.kind === 'group-header'
            ? `group-${item.group.key}`
            : item.kind === 'file-group-nested'
            ? `fgn-${item.type}-${i}`
            : item.kind === 'file-nested'
            ? `fn-${item.artifact.path}`
            : `art-${item.artifact.path}`;

          return (
            <Box key={key}>
              <Box flexGrow={1}>
                {item.kind === 'group-header' ? (
                  <GroupRow
                    group={item.group}
                    isCollapsed={state.collapsedGroups.has(item.group.key)}
                    isCursor={absoluteIndex === state.cursorIndex}
                    allSelected={item.group.children.every((c) => state.selectedPaths.has(c.path))}
                    someSelected={item.group.children.some((c) => state.selectedPaths.has(c.path))}
                  />
                ) : item.kind === 'file-group-nested' ? (
                  <Box flexGrow={1}>
                    <Text>{'  '}</Text>
                    <FileGroupRow
                      group={{ type: item.type, files: item.files, totalSize: item.totalSize, oldestMtimeMs: undefined }}
                      isExpanded={state.expandedFileTypes.has(item.type)}
                      isCursor={absoluteIndex === state.cursorIndex}
                      allSelected={item.files.every((f) => state.selectedPaths.has(f.path))}
                      someSelected={item.files.some((f) => state.selectedPaths.has(f.path))}
                    />
                  </Box>
                ) : item.kind === 'file-nested' ? (
                  <Box flexGrow={1}>
                    <Text>{'    '}</Text>
                    <ArtifactRow
                      artifact={item.artifact}
                      isCursor={absoluteIndex === state.cursorIndex}
                      isSelected={state.selectedPaths.has(item.artifact.path)}
                      rootPath={rootPath}
                      maxSizeBytes={state.maxSizeBytes}
                      commonPrefix={commonPrefix}
                      themeName={state.themeName}
                      pathWidth={pathWidth - 4}
                      isSensitive={sensitiveSet.has(item.artifact.path)}
                    />
                  </Box>
                ) : (
                  <Box flexGrow={1}>
                    {item.indented && <Text>{'  '}</Text>}
                    <ArtifactRow
                      artifact={item.artifact}
                      isCursor={absoluteIndex === state.cursorIndex}
                      isSelected={state.selectedPaths.has(item.artifact.path)}
                      rootPath={rootPath}
                      maxSizeBytes={state.maxSizeBytes}
                      commonPrefix={commonPrefix}
                      themeName={state.themeName}
                      pathWidth={pathWidth - (item.indented ? 2 : 0)}
                      isSensitive={sensitiveSet.has(item.artifact.path)}
                    />
                  </Box>
                )}
              </Box>
              {showScrollbar && (
                <Text color={theme.overlay0}>{scrollbarChars[i]}</Text>
              )}
            </Box>
          );
        })
      ) : displayItems ? (
        // Display items mode: render file groups + directories
        visibleDisplayItems.map((item, i) => {
          const absoluteIndex = displayScrollOffset + i;
          const key = item.kind === 'section-separator'
            ? `sep-${item.label}`
            : item.kind === 'file-group'
            ? `fgroup-${item.group.type}`
            : item.kind === 'file'
            ? `file-${item.artifact.path}`
            : `dir-${item.artifact.path}`;

          return (
            <Box key={key}>
              <Box flexGrow={1}>
                {item.kind === 'section-separator' ? (
                  <SectionSeparator label={item.label} width={termWidth - 4 - detailWidth - scrollbarW} />
                ) : item.kind === 'file-group' ? (
                  <FileGroupRow
                    group={item.group}
                    isExpanded={state.expandedFileTypes.has(item.group.type)}
                    isCursor={absoluteIndex === state.cursorIndex}
                    allSelected={item.group.files.every((f) => state.selectedPaths.has(f.path))}
                    someSelected={item.group.files.some((f) => state.selectedPaths.has(f.path))}
                  />
                ) : (
                  <Box flexGrow={1}>
                    {item.kind === 'file' && item.indented && <Text>{'  '}</Text>}
                    <ArtifactRow
                      artifact={item.artifact}
                      isCursor={absoluteIndex === state.cursorIndex}
                      isSelected={state.selectedPaths.has(item.artifact.path)}
                      rootPath={rootPath}
                      maxSizeBytes={state.maxSizeBytes}
                      commonPrefix={commonPrefix}
                      themeName={state.themeName}
                      pathWidth={pathWidth - (item.kind === 'file' && item.indented ? 2 : 0)}
                      isSensitive={sensitiveSet.has(item.artifact.path)}
                    />
                  </Box>
                )}
              </Box>
              {showScrollbar && (
                <Text color={theme.overlay0}>{scrollbarChars[i]}</Text>
              )}
            </Box>
          );
        })
      ) : (
        // Fallback: render artifact rows directly
        visibleArtifacts.map((artifact, i) => {
          const absoluteIndex = artScrollOffset + i;
          return (
            <Box key={artifact.path}>
              <Box flexGrow={1}>
                <ArtifactRow
                  artifact={artifact}
                  isCursor={absoluteIndex === state.cursorIndex}
                  isSelected={state.selectedPaths.has(artifact.path)}
                  rootPath={rootPath}
                  maxSizeBytes={state.maxSizeBytes}
                  commonPrefix={commonPrefix}
                  themeName={state.themeName}
                  pathWidth={pathWidth}
                  isSensitive={sensitiveSet.has(artifact.path)}
                />
              </Box>
              {showScrollbar && (
                <Text color={theme.overlay0}>{scrollbarChars[i]}</Text>
              )}
            </Box>
          );
        })
      )}

      {/* Pad remaining space */}
      <Box flexGrow={1} />


      {state.artifacts.length === 0 && (
        <Text dimColor>{'  No artifacts found.'}</Text>
      )}

      {state.artifacts.length > 0 && sortedArtifacts.length === 0 && state.searchQuery.length > 0 && (
        <Text dimColor>{`  No matches for "${state.searchQuery}"`}</Text>
      )}
    </Box>
  );
}
