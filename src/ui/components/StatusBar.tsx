import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { theme } from '../theme.js';

interface StatusBarProps {
  scanStatus: 'scanning' | 'complete';
  scanDurationMs: number | null;
  directoriesScanned: number;
  cursorIndex: number;
  totalArtifacts: number;
}

/**
 * Bottom status bar showing scan state and row position.
 * - Scanning: animated spinner + "Scanning..." + directories visited count (blue)
 * - Complete: "✓ Scan complete · {duration}" (green)
 * - Right side: "Row N of M" in subtext0
 */
export function StatusBar({
  scanStatus,
  scanDurationMs,
  directoriesScanned,
  cursorIndex,
  totalArtifacts,
}: StatusBarProps): React.ReactElement {
  const rowText = totalArtifacts > 0
    ? `Row ${cursorIndex + 1} of ${totalArtifacts}`
    : 'No artifacts';

  return (
    <Box borderStyle="single" borderColor={theme.surface1} paddingX={1} justifyContent="space-between">
      <Box>
        {scanStatus === 'scanning' ? (
          <>
            <Spinner type="dots" />
            <Text color={theme.blue}>{` Scanning... ${directoriesScanned} dirs visited`}</Text>
          </>
        ) : (
          <Text color={theme.green}>
            {`✓ Scan complete · ${scanDurationMs !== null ? `${scanDurationMs}ms` : ''}`}
          </Text>
        )}
      </Box>
      <Text color={theme.subtext0}>{rowText}</Text>
    </Box>
  );
}
