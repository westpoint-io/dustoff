import React, { useEffect } from 'react';
import type { Dispatch } from 'react';
import { Box, Text } from 'ink';
import type { AppState, AppAction } from '../../app/reducer.js';
import { getSortedArtifacts } from '../../app/reducer.js';
import { ArtifactRow } from './ArtifactRow.js';
import { useWindow } from './useWindow.js';
import { accent, headerColor, TYPE_W, SIZE_W, AGE_W } from '../../shared/theme.js';

// Header(5 logo) + border(2) + colHeader(1) + status(1) + shortcut(1) + selection(1) = 11 overhead
const RESERVED_ROWS = 11;

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
  const sortedArtifacts = getSortedArtifacts(state);

  const { visibleItems, scrollOffset, visibleCount } = useWindow(
    sortedArtifacts,
    state.cursorIndex,
    RESERVED_ROWS,
  );

  useEffect(() => {
    onVisibleCountChange?.(visibleCount);
  }, [visibleCount, onVisibleCountChange]);

  // Sort indicator on active column
  const arrow = state.sortDir === 'desc' ? '↓' : '↑';
  const sizeLabel = state.sortKey === 'size' ? `SIZE ${arrow}` : 'SIZE';
  const ageLabel = state.sortKey === 'age' ? `AGE ${arrow}` : 'AGE';

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={accent}>
      {/* Column headers */}
      <Box>
        <Text color={headerColor} bold>
          {'     '}{('TYPE').padEnd(TYPE_W)}{'PATH'}
        </Text>
        <Box flexGrow={1} />
        <Text color={headerColor} bold>
          {sizeLabel.padStart(SIZE_W)}{ageLabel.padStart(AGE_W)}{' '}
        </Text>
      </Box>

      {/* Rows — full-row cursor highlight */}
      {visibleItems.map((artifact, i) => {
        const absoluteIndex = scrollOffset + i;
        return (
          <ArtifactRow
            key={artifact.path}
            artifact={artifact}
            isCursor={absoluteIndex === state.cursorIndex}
            isSelected={state.selectedPaths.has(artifact.path)}
            rootPath={rootPath}
          />
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
