import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { ArtifactGroup } from './grouping.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { SIZE_W, AGE_W } from '../../shared/themes.js';
import { formatBytes } from '../../shared/formatters.js';
import { BAR_WIDTH } from './SizeBar.js';

// Match ArtifactRow's RIGHT_W: space + bar + space + size + space + age + space
const RIGHT_W = 1 + BAR_WIDTH + 1 + SIZE_W + 1 + AGE_W + 1;

interface GroupRowProps {
  group: ArtifactGroup;
  isCollapsed: boolean;
  isCursor: boolean;
  allSelected: boolean;
  someSelected: boolean;
}

export const GroupRow = memo(function GroupRow({
  group,
  isCollapsed,
  isCursor,
  allSelected,
  someSelected,
}: GroupRowProps): React.ReactElement {
  const theme = useTheme();
  const bg = isCursor ? theme.cursorBg : undefined;
  const arrow = isCollapsed ? '\u25B6' : '\u25BC';
  const checkbox = allSelected ? '[x]' : (someSelected ? '[-]' : '[ ]');
  const checkFg = isCursor ? theme.cursorFg : (allSelected ? theme.green : (someSelected ? theme.yellow : theme.overlay0));
  const arrowFg = isCursor ? theme.cursorFg : theme.overlay0;
  const nameFg = isCursor ? theme.cursorFg : theme.accent;
  const infoFg = isCursor ? theme.cursorFg : theme.overlay0;
  const displayKey = group.key === '.' ? './' : group.key + '/';

  return (
    <Box backgroundColor={bg} flexGrow={1}>
      <Text color={checkFg}>{` ${checkbox} `}</Text>
      <Text color={arrowFg}>{arrow} </Text>
      <Text color={nameFg} bold>{displayKey}</Text>
      <Box flexGrow={1} />
      <Box width={RIGHT_W} flexShrink={0}>
        <Text color={infoFg}>
          {`${group.children.length} items  ${formatBytes(group.totalSize)}`.padStart(RIGHT_W - 1)}
        </Text>
        <Text>{' '}</Text>
      </Box>
    </Box>
  );
});
