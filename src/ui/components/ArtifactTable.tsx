import React, { useMemo, useEffect } from 'react';
import type { Dispatch } from 'react';
import { Box, Text } from 'ink';
import type { AppState, AppAction } from '../app.js';
import { ArtifactRow } from './ArtifactRow.js';
import { useWindow } from '../hooks/useWindow.js';
import { theme } from '../theme.js';

const RESERVED_ROWS = 9; // header border (3) + table column header (1) + status border (3) + shortcut bar (1) + padding (1)

interface ArtifactTableProps {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  onVisibleCountChange?: (count: number) => void;
}

/**
 * Windowed artifact table — only renders rows visible in the terminal viewport.
 *
 * Applies sorting via useMemo, then uses useWindow to slice to visible rows.
 * This is essential for 500+ item lists — rendering all rows causes severe flickering.
 */
export function ArtifactTable({
  state,
  dispatch,
  onVisibleCountChange,
}: ArtifactTableProps): React.ReactElement {
  // Sort artifacts by current sort key and direction
  const sortedArtifacts = useMemo(() => {
    const sorted = [...state.artifacts];

    sorted.sort((a, b) => {
      if (state.sortKey === 'size') {
        // Null sizes sort last (treat as -1 for descending)
        const aSize = a.sizeBytes ?? -1;
        const bSize = b.sizeBytes ?? -1;
        return state.sortDir === 'desc' ? bSize - aSize : aSize - bSize;
      }

      if (state.sortKey === 'path') {
        const cmp = a.path.localeCompare(b.path);
        return state.sortDir === 'asc' ? cmp : -cmp;
      }

      // Age sort: by mtimeMs — older = smaller number = larger age
      if (state.sortKey === 'age') {
        const aMtime = a.mtimeMs ?? 0;
        const bMtime = b.mtimeMs ?? 0;
        // desc = oldest first (smallest mtimeMs first)
        return state.sortDir === 'desc' ? aMtime - bMtime : bMtime - aMtime;
      }

      return 0;
    });

    return sorted;
  }, [state.artifacts, state.sortKey, state.sortDir]);

  // Compute visible window
  const { visibleItems, scrollOffset, visibleCount } = useWindow(
    sortedArtifacts,
    state.cursorIndex,
    RESERVED_ROWS,
  );

  // Notify parent of visible count for page navigation
  useEffect(() => {
    onVisibleCountChange?.(visibleCount);
  }, [visibleCount, onVisibleCountChange]);

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Table column header */}
      <Box paddingX={1}>
        <Text bold color={theme.blue}>{'#  TYPE          PATH                                      SIZE           AGE'}</Text>
      </Box>

      {/* Visible rows only */}
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

      {/* Empty state when no artifacts found */}
      {state.artifacts.length === 0 && (
        <Box paddingX={2}>
          <Text dimColor>{'No artifacts found in this directory.'}</Text>
        </Box>
      )}
    </Box>
  );
}
