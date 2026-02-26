import React, { useEffect, useMemo } from 'react';
import type { Dispatch } from 'react';
import { Box, Text } from 'ink';
import type { AppState, AppAction } from '../../app/reducer.js';
import { getSortedArtifacts } from '../../app/reducer.js';
import { ArtifactRow } from './ArtifactRow.js';
import { useWindow } from './useWindow.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { TYPE_W, SIZE_W, AGE_W } from '../../shared/themes.js';
import { findCommonDirPrefix } from '../../shared/pathUtils.js';

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
}

export function ArtifactTable({
  state,
  dispatch,
  rootPath,
  termHeight = 40,
  onVisibleCountChange,
}: ArtifactTableProps): React.ReactElement {
  const theme = useTheme();
  const sortedArtifacts = getSortedArtifacts(state);
  const reservedRows = termHeight >= 30 ? RESERVED_ROWS_FULL : RESERVED_ROWS_COMPACT;

  const { visibleItems, scrollOffset, visibleCount } = useWindow(
    sortedArtifacts,
    state.cursorIndex,
    reservedRows,
  );

  useEffect(() => {
    onVisibleCountChange?.(visibleCount);
  }, [visibleCount, onVisibleCountChange]);

  const showScrollbar = sortedArtifacts.length > visibleCount;
  const scrollbarChars = useMemo(
    () =>
      showScrollbar
        ? renderScrollbar(visibleCount, sortedArtifacts.length, scrollOffset)
        : [],
    [showScrollbar, visibleCount, sortedArtifacts.length, scrollOffset],
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
  const arrow = state.sortDir === 'desc' ? '↓' : '↑';
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
        <Text dimColor color={theme.overlay0}>{'[1] '}</Text>
        <Text color={theme.headerColor} bold>
          {sizeLabel.padStart(SIZE_W)}{' '}
        </Text>
        <Text dimColor color={theme.overlay0}>{'[3] '}</Text>
        <Text color={theme.headerColor} bold>
          {ageLabel}{'  '}
        </Text>
      </Box>

      {/* Rows — full-row cursor highlight */}
      {visibleItems.map((artifact, i) => {
        const absoluteIndex = scrollOffset + i;
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
      })}

      {/* Pad remaining space */}
      <Box flexGrow={1} />

      {/* Contextual tip in empty table space */}
      {sortedArtifacts.length > 0 && sortedArtifacts.length < visibleCount && (
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
