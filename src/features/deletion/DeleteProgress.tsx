import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { theme } from '../../shared/theme.js';
import { formatBytes } from '../../shared/formatters.js';

interface DeleteProgressProps {
  done: number;
  total: number;
  freedBytes: number;
}

export function DeleteProgress({ done, total, freedBytes }: DeleteProgressProps): React.ReactElement {
  return (
    <Box borderStyle="single" borderColor={theme.yellow} justifyContent="center" paddingX={2}>
      <Spinner type="dots" />
      <Text color={theme.red} bold>
        {`  Deleting... ${done}/${total}  `}
      </Text>
      <Text color={theme.overlay0}>
        {`${formatBytes(freedBytes)} freed`}
      </Text>
    </Box>
  );
}
