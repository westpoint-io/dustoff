import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../shared/ThemeContext.js';

interface StatusBarProps {
  scanStatus: 'scanning' | 'complete';
  scanDurationMs: number | null;
  directoriesScanned: number;
  cursorIndex: number;
  totalArtifacts: number;
}

export function StatusBar({
  scanStatus,
  scanDurationMs,
  directoriesScanned,
  cursorIndex,
  totalArtifacts,
}: StatusBarProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Box justifyContent="space-between" marginRight={1}>
      {/* Left: spacer */}
      <Box />

      {/* Right: status + position */}
      <Box>
        {scanStatus === 'scanning' ? (
          <Text color={theme.yellow}>{'Scanning'}</Text>
        ) : (
          <Text color={theme.green}>{'Ready'}</Text>
        )}
        <Text color={theme.overlay0}>{' · '}</Text>
        <Text color={theme.text}>
          {totalArtifacts > 0 ? `${cursorIndex + 1}/${totalArtifacts}` : '0/0'}
        </Text>
      </Box>
    </Box>
  );
}
