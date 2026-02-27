import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../shared/ThemeContext.js';
import { formatBytes } from '../../shared/formatters.js';

interface DeleteConfirmProps {
  selectedCount: number;
  selectedBytes: number;
  focus: 'yes' | 'cancel';
}

export function DeleteConfirm({ selectedCount, selectedBytes, focus }: DeleteConfirmProps): React.ReactElement {
  const theme = useTheme();
  const yesColor = focus === 'yes' ? theme.accent : theme.overlay0;
  const cancelColor = focus === 'cancel' ? theme.accent : theme.overlay0;

  return (
    <Box borderStyle="single" borderColor={theme.accent} justifyContent="center" paddingX={2} marginTop={-1}>
      <Text color={theme.red} bold>
        {`  Delete ${selectedCount} artifact${selectedCount > 1 ? 's' : ''}?  `}
      </Text>
      <Text color={theme.yellow} bold>{`(${formatBytes(selectedBytes)} will be freed)  `}</Text>
      <Text backgroundColor={yesColor} color={theme.cursorFg}>{' Yes '}</Text>
      <Text>{' '}</Text>
      <Text backgroundColor={cancelColor} color={theme.cursorFg}>{' Cancel '}</Text>
    </Box>
  );
}
