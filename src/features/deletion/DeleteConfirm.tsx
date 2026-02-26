import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';
import { formatBytes } from '../../shared/formatters.js';

interface DeleteConfirmProps {
  selectedCount: number;
  selectedBytes: number;
}

export function DeleteConfirm({ selectedCount, selectedBytes }: DeleteConfirmProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor={theme.red} justifyContent="center" paddingX={2}>
      <Text color={theme.red} bold>
        {`  Delete ${selectedCount} artifact${selectedCount > 1 ? 's' : ''}?  `}
      </Text>
      <Text color={theme.yellow} bold>{`(${formatBytes(selectedBytes)} will be freed)  `}</Text>
      <Text backgroundColor="green" color="black">{' Yes '}</Text>
      <Text>{' '}</Text>
      <Text backgroundColor="gray" color="white">{' Cancel '}</Text>
    </Box>
  );
}
