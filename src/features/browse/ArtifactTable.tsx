import React, { useEffect, useMemo } from 'react';
import type { Dispatch } from 'react';
import { Box, Text } from 'ink';
import type { AppState, AppAction } from '../../app/reducer.js';
import { getSortedArtifacts } from '../../app/reducer.js';
import { ArtifactRow } from './ArtifactRow.js';
import { GroupRow } from './GroupRow.js';
import { useWindow } from './useWindow.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { TYPE_W, SIZE_W, AGE_W } from '../../shared/themes.js';
import { BAR_WIDTH } from './SizeBar.js';
import { findCommonDirPrefix } from '../../shared/pathUtils.js';

// Fixed width for right-side columns — must match ArtifactRow's RIGHT_W
const RIGHT_W = 1 + BAR_WIDTH + 1 + SIZE_W + 1 + AGE_W + 1;
import { groupArtifacts, flattenGroups } from './grouping.js';
import type { FlatItem } from './grouping.js';

// Full header (5 logo lines) + border(2) + colHeader(1) + status(1) + shortcut(1) + selection(1) = 11
const RESERVED_ROWS_FULL = 11;
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
  onVisibleCountChange?: (count: number) => void;
  flatItems?: FlatItem[];
}

export function ArtifactTable({
  state,
  dispatch,
  rootPath,
  termHeight = 40,
  onVisibleCountChange,
  flatItems,
}: ArtifactTableProps): React.ReactElement {
  const theme = useTheme();
  const sortedArtifacts = getSortedArtifacts(state);
  const reservedRows = termHeight >= 30 ? RESERVED_ROWS_FULL : RESERVED_ROWS_COMPACT;

  // In grouping mode, use flat items; otherwise use sorted artifacts
  const totalItemCount = state.groupingEnabled && flatItems
    ? flatItems.length
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

  // Use the right values depending on mode
  const effectiveVisibleCount = state.groupingEnabled && flatItems ? visibleCount : artVisibleCount;
  const effectiveScrollOffset = state.groupingEnabled && flatItems ? scrollOffset : artScrollOffset;

  useEffect(() => {
    onVisibleCountChange?.(effectiveVisibleCount);
  }, [effectiveVisibleCount, onVisibleCountChange]);

  const showScrollbar = totalItemCount > effectiveVisibleCount;
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

  // Sort indicator on active column
  const arrow = state.sortDir === 'desc' ? '\u2193' : '\u2191';
  const sizeLabel = state.sortKey === 'size' ? `SIZE ${arrow}` : 'SIZE';
  const ageLabel = state.sortKey === 'age' ? `AGE ${arrow}` : 'AGE';

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={theme.accent}>
      {/* Column headers */}
      <Box>
        <Text color={theme.headerColor} bold>
          {'     '}{('TYPE').padEnd(TYPE_W)}{'PATH '}
        </Text>
        <Text dimColor color={theme.overlay0}>{'[2]'}</Text>
        <Box flexGrow={1} />
        <Box width={RIGHT_W} flexShrink={0}>
          <Box flexGrow={1} />
          <Text dimColor color={theme.overlay0}>{'[1]'}</Text>
          <Text color={theme.headerColor} bold>
            {sizeLabel.padStart(SIZE_W)}{' '}
          </Text>
          <Text dimColor color={theme.overlay0}>{'[3]'}</Text>
          <Text color={theme.headerColor} bold>
            {ageLabel}
          </Text>
          <Text>{' '}</Text>
        </Box>
      </Box>

      {/* Rows — full-row cursor highlight */}
      {state.groupingEnabled && flatItems ? (
        // Grouped mode: render flat items
        visibleFlatItems.map((item, i) => {
          const absoluteIndex = effectiveScrollOffset + i;
          const key = item.kind === 'group-header'
            ? `group-${item.group.key}`
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
                ) : (
                  <Box>
                    {item.indented && <Text>{'  '}</Text>}
                    <ArtifactRow
                      artifact={item.artifact}
                      isCursor={absoluteIndex === state.cursorIndex}
                      isSelected={state.selectedPaths.has(item.artifact.path)}
                      rootPath={rootPath}
                      maxSizeBytes={state.maxSizeBytes}
                      commonPrefix={commonPrefix}
                      themeName={state.themeName}
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
        // Normal mode: render artifact rows
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

      {/* Contextual tip in empty table space */}
      {sortedArtifacts.length > 0 && sortedArtifacts.length < effectiveVisibleCount && (
        <Box justifyContent="center">
          <Text dimColor>
            {state.selectedPaths.size > 0
              ? 'Tip: Press d to delete selected, Esc to clear selection'
              : 'Tip: Press Space to select, / to search, Tab for details'}
          </Text>
        </Box>
      )}

      {state.artifacts.length === 0 && (
        <Text dimColor>{'  No artifacts found.'}</Text>
      )}

      {state.artifacts.length > 0 && sortedArtifacts.length === 0 && state.searchQuery.length > 0 && (
        <Text dimColor>{`  No matches for "${state.searchQuery}"`}</Text>
      )}
    </Box>
  );
}
