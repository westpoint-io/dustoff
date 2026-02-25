import React, { useMemo, useEffect } from 'react';
import type { Dispatch } from 'react';
import { Box, Text } from 'ink';
import type { AppState, AppAction } from '../app.js';
import { ArtifactRow } from './ArtifactRow.js';
import { useWindow } from '../hooks/useWindow.js';
import { theme } from '../theme.js';

const RESERVED_ROWS = 9;

interface ArtifactTableProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  onVisibleCountChange?: (count: number) => void;
}

export function ArtifactTable({
  state,
  dispatch,
  onVisibleCountChange,
}: ArtifactTableProps): React.ReactElement {
  const sortedArtifacts = useMemo(() => {
    const sorted = [...state.artifacts];
    sorted.sort((a, b) => {
      if (state.sortKey === 'size') {
        const aSize = a.sizeBytes ?? -1;
        const bSize = b.sizeBytes ?? -1;
        return state.sortDir === 'desc' ? bSize - aSize : aSize - bSize;
      }
      if (state.sortKey === 'path') {
        const cmp = a.path.localeCompare(b.path);
        return state.sortDir === 'asc' ? cmp : -cmp;
      }
      if (state.sortKey === 'age') {
        const aMtime = a.mtimeMs ?? 0;
        const bMtime = b.mtimeMs ?? 0;
        return state.sortDir === 'desc' ? aMtime - bMtime : bMtime - aMtime;
      }
      return 0;
    });
    return sorted;
  }, [state.artifacts, state.sortKey, state.sortDir]);

  const { visibleItems, scrollOffset, visibleCount } = useWindow(
    sortedArtifacts,
    state.cursorIndex,
    RESERVED_ROWS,
  );

  useEffect(() => {
    onVisibleCountChange?.(visibleCount);
  }, [visibleCount, onVisibleCountChange]);

  // Sort indicators
  const sizeArrow = state.sortKey === 'size' ? (state.sortDir === 'desc' ? ' ↓' : ' ↑') : '';
  const pathArrow = state.sortKey === 'path' ? (state.sortDir === 'asc' ? ' ↑' : ' ↓') : '';
  const ageArrow = state.sortKey === 'age' ? (state.sortDir === 'desc' ? ' ↓' : ' ↑') : '';

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Column header row */}
      <Box paddingX={1}>
        <Box width={4}><Text color={theme.blue} bold>{'#'}</Text></Box>
        <Box width={14}><Text color={theme.blue} bold>{'TYPE'}</Text></Box>
        <Box flexGrow={1}><Text color={theme.blue} bold>{'PATH'}</Text></Box>
        <Box width={10}><Text color={theme.blue} bold>{'SIZE'}</Text></Box>
        <Box width={12}><Text color={state.sortKey === 'size' ? theme.blue : theme.blue} bold>{`SIZE${sizeArrow}`}</Text></Box>
        <Box width={6}><Text color={theme.blue} bold>{`AGE${ageArrow}`}</Text></Box>
      </Box>
      {/* Blue underline */}
      <Box paddingX={1}>
        <Text color={theme.blue}>{'─'.repeat(process.stdout.columns ? process.stdout.columns - 2 : 78)}</Text>
      </Box>

      {/* Visible rows */}
      {visibleItems.map((artifact, i) => {
        const absoluteIndex = scrollOffset + i;
        return (
          <ArtifactRow
            key={artifact.path}
            artifact={artifact}
            index={absoluteIndex + 1}
            isCursor={absoluteIndex === state.cursorIndex}
            isEven={absoluteIndex % 2 === 0}
            maxSizeBytes={state.maxSizeBytes}
          />
        );
      })}

      {state.artifacts.length === 0 && (
        <Box paddingX={2}>
          <Text dimColor>{'No artifacts found in this directory.'}</Text>
        </Box>
      )}
    </Box>
  );
}
