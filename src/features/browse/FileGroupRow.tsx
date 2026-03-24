import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { FileGroup } from '../../app/reducer.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { SIZE_W, AGE_W } from '../../shared/themes.js';
import { formatBytes } from '../../shared/formatters.js';
import { BAR_WIDTH } from './SizeBar.js';

// Match ArtifactRow's RIGHT_W: space + bar + space + size + space + age + space
const RIGHT_W = 1 + BAR_WIDTH + 1 + SIZE_W + 1 + AGE_W + 1;

interface FileGroupRowProps {
  group: FileGroup;
  isExpanded: boolean;
  isCursor: boolean;
  allSelected: boolean;
  someSelected: boolean;
}

export const FileGroupRow = memo(function FileGroupRow({
  group,
  isExpanded,
  isCursor,
  allSelected,
  someSelected,
}: FileGroupRowProps): React.ReactElement {
  const theme = useTheme();
  const bg = isCursor ? theme.cursorBg : undefined;
  const arrow = isExpanded ? '\u25BC' : '\u25B6';
  const checkbox = allSelected ? '[x]' : (someSelected ? '[-]' : '[ ]');
  const checkFg = isCursor ? theme.cursorFg : (allSelected ? theme.green : (someSelected ? theme.yellow : theme.overlay0));
  const arrowFg = isCursor ? theme.cursorFg : theme.overlay0;
  const nameFg = isCursor ? theme.cursorFg : theme.accent;
  const infoFg = isCursor ? theme.cursorFg : theme.overlay0;

  const fileCount = group.files.length;
  const label = `${group.type} (${fileCount} file${fileCount !== 1 ? 's' : ''})`;

  return (
    <Box backgroundColor={bg} flexGrow={1}>
      <Text color={checkFg}>{` ${checkbox} `}</Text>
      <Text color={arrowFg}>{arrow} </Text>
      <Text color={nameFg} bold>{label}</Text>
      <Box flexGrow={1} />
      <Box width={RIGHT_W} flexShrink={0}>
        <Text color={infoFg}>
          {formatBytes(group.totalSize).padStart(RIGHT_W - 1)}
        </Text>
        <Text>{' '}</Text>
      </Box>
    </Box>
  );
});
