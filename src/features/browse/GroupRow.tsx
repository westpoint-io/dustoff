import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { ArtifactGroup } from './grouping.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { formatBytes } from '../../shared/formatters.js';

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
    <Box backgroundColor={bg}>
      <Text color={checkFg}>{` ${checkbox} `}</Text>
      <Text color={arrowFg}>{arrow} </Text>
      <Text color={nameFg} bold>{displayKey}</Text>
      <Box flexGrow={1} />
      <Text color={infoFg}>
        {`${group.children.length} items  ${formatBytes(group.totalSize)}`}
      </Text>
      <Text>{' '}</Text>
    </Box>
  );
});
