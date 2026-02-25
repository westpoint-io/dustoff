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
 * Status bar matching mockup layout:
 * Scanning: ● Scanning... [████░░░░] 58%  |  684 / 1,180 dirs  |  Row 4 of 9
 * Complete: ✓ Scan complete · 0.8s         |  1,180 directories  |  Row 2 of 13
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
    <Box>
      {/* Top separator */}
      <Box position="absolute" marginTop={-1}>
        <Text color={theme.surface0}>{'─'.repeat(process.stdout.columns || 80)}</Text>
      </Box>
      <Box paddingX={1} justifyContent="space-between" width="100%">
        <Box>
          {scanStatus === 'scanning' ? (
            <>
              <Text color={theme.green}>{'● '}</Text>
              <Text color={theme.green}>{'Scanning'}</Text>
              <Spinner type="dots" />
              <Text color={theme.overlay0}>{` ${directoriesScanned.toLocaleString()} dirs`}</Text>
            </>
          ) : (
            <Text color={theme.green}>
              {`✓ Scan complete · ${scanDurationMs !== null ? `${(scanDurationMs / 1000).toFixed(1)}s` : ''}`}
            </Text>
          )}
        </Box>

        {/* Middle: directory count */}
        <Box>
          <Text color={theme.overlay0}>
            {scanStatus === 'complete'
              ? `${directoriesScanned.toLocaleString()} directories`
              : ''}
          </Text>
        </Box>

        {/* Right: row position */}
        <Text color={theme.overlay0}>{rowText}</Text>
      </Box>
    </Box>
  );
}
