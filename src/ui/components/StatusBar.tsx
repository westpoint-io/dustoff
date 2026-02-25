import React from 'react';
import { Box, Text, useStdout } from 'ink';
import Spinner from 'ink-spinner';
import { theme } from '../theme.js';

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
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const rowText = totalArtifacts > 0
    ? `Row ${cursorIndex + 1} of ${totalArtifacts}`
    : '';

  return (
    <Box flexDirection="column">
      <Text color={theme.surface0}>{'─'.repeat(cols)}</Text>
      <Box justifyContent="space-between">
        {/* Left: scan state */}
        <Box>
          {scanStatus === 'scanning' ? (
            <>
              <Text color={theme.green}>{'● Scanning'}</Text>
              <Spinner type="dots" />
              <Text color={theme.overlay0}>{` ${directoriesScanned.toLocaleString()} dirs`}</Text>
            </>
          ) : (
            <Text color={theme.green}>
              {`✓ Scan complete · ${scanDurationMs !== null ? `${(scanDurationMs / 1000).toFixed(1)}s` : ''}`}
            </Text>
          )}
        </Box>

        {/* Center: directory count */}
        {scanStatus === 'complete' && (
          <Text color={theme.overlay0}>{`${directoriesScanned.toLocaleString()} directories`}</Text>
        )}

        {/* Right: row position */}
        <Text color={theme.overlay0}>{rowText}</Text>
      </Box>
    </Box>
  );
}
