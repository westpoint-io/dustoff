import React, { useMemo, useEffect } from 'react';
import type { Dispatch } from 'react';
import { Box, Text, useStdout } from 'ink';
import type { AppState, AppAction } from '../app.js';
import { ArtifactRow } from './ArtifactRow.js';
import { useWindow } from '../hooks/useWindow.js';
import { theme } from '../theme.js';

const RESERVED_ROWS = 12; // header(6+1sep) + table header(1) + blue line(1) + status(1) + shortcut(1) + buffer(1)

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
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;

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

  // Sort arrow on active column
  const sizeLabel = state.sortKey === 'size' ? `SIZE ${state.sortDir === 'desc' ? '↓' : '↑'}` : 'SIZE';
  const ageLabel = state.sortKey === 'age' ? `AGE ${state.sortDir === 'desc' ? '↓' : '↑'}` : 'AGE';

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Column header */}
      <Box>
        <Text color={theme.blue} bold>
          {' # '}
        </Text>
        <Box width={14}><Text color={theme.blue} bold>{'TYPE'}</Text></Box>
        <Box flexGrow={1}><Text color={theme.blue} bold>{'PATH'}</Text></Box>
        <Box width={10}><Text color={theme.blue} bold>{'SIZE'}</Text></Box>
        <Box width={10} justifyContent="flex-end"><Text color={theme.blue} bold>{sizeLabel}</Text></Box>
        <Box width={6} justifyContent="flex-end"><Text color={theme.blue} bold>{ageLabel}</Text></Box>
      </Box>
      {/* Blue underline */}
      <Text color={theme.blue}>{'━'.repeat(cols)}</Text>

      {/* Rows */}
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
        <Box paddingX={2} marginTop={1}>
          <Text dimColor>{'No artifacts found.'}</Text>
        </Box>
      )}
    </Box>
  );
}
