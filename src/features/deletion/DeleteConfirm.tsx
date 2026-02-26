import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import { formatBytes } from '../../shared/formatters.js';

interface DeleteConfirmProps {
  selectedCount: number;
  selectedBytes: number;
  focus: 'yes' | 'cancel';
}

export function DeleteConfirm({ selectedCount, selectedBytes, focus }: DeleteConfirmProps): React.ReactElement {
  const yesColor = focus === 'yes' ? 'green' : theme.white;
  const cancelColor = focus === 'cancel' ? 'green' : theme.white;

  return (
    <Box borderStyle="single" borderColor={theme.red} justifyContent="center" paddingX={2} marginTop={-1}>
      <Text color={theme.red} bold>
        {`  Delete ${selectedCount} artifact${selectedCount > 1 ? 's' : ''}?  `}
      </Text>
      <Text color={theme.yellow} bold>{`(${formatBytes(selectedBytes)} will be freed)  `}</Text>
      <Text backgroundColor={yesColor} color="black">{' Yes '}</Text>
      <Text>{' '}</Text>
      <Text backgroundColor={cancelColor} color="black">{' Cancel '}</Text>
    </Box>
  );
}
