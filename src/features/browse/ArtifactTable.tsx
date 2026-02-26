import React, { useEffect, useMemo } from 'react';
import type { Dispatch } from 'react';
import { Box, Text } from 'ink';
import type { AppState, AppAction } from '../../app/reducer.js';
import { getSortedArtifacts } from '../../app/reducer.js';
import { ArtifactRow } from './ArtifactRow.js';
import { useWindow } from './useWindow.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { TYPE_W, SIZE_W, AGE_W } from '../../shared/themes.js';

// Header(5 logo) + border(2) + colHeader(1) + status(1) + shortcut(1) + selection(1) = 11 overhead
const RESERVED_ROWS = 11;

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
  onVisibleCountChange?: (count: number) => void;
}

export function ArtifactTable({
  state,
  dispatch,
  rootPath,
  onVisibleCountChange,
}: ArtifactTableProps): React.ReactElement {
  const theme = useTheme();
  const sortedArtifacts = getSortedArtifacts(state);

  const { visibleItems, scrollOffset, visibleCount } = useWindow(
    sortedArtifacts,
    state.cursorIndex,
    RESERVED_ROWS,
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

  // Sort indicator on active column
  const arrow = state.sortDir === 'desc' ? '↓' : '↑';
  const sizeLabel = state.sortKey === 'size' ? `SIZE ${arrow}` : 'SIZE';
  const ageLabel = state.sortKey === 'age' ? `AGE ${arrow}` : 'AGE';

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={theme.accent}>
      {/* Column headers */}
      <Box>
        <Text color={theme.headerColor} bold>
          {'     '}{('TYPE').padEnd(TYPE_W)}{'PATH'}
        </Text>
        <Box flexGrow={1} />
        <Text color={theme.headerColor} bold>
          {sizeLabel.padStart(SIZE_W)}{ageLabel.padStart(AGE_W)}{' '}
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

      {state.artifacts.length === 0 && (
        <Text dimColor>{'  No artifacts found.'}</Text>
      )}

      {state.artifacts.length > 0 && sortedArtifacts.length === 0 && state.searchQuery.length > 0 && (
        <Text dimColor>{`  No matches for "${state.searchQuery}"`}</Text>
      )}
    </Box>
  );
}
