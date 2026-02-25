import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { theme } from '../theme.js';
import { formatBytes, formatAge } from '../formatters.js';

// Compact 3-line DUSTOFF logo using half-block chars — mimics the mockup's
// 6.5px ASCII art (half body font). Full 6-line art is too tall for terminal header.
const LOGO = [
  '█▀▄ █ █ ▄▀▀ ▀█▀ ▄▀▄ █▀▀ █▀▀',
  '█▄▀ █▄█ ▄▄▀  █  █▄█ █▀  █▀ ',
  '▀    ▀  ▀▀▀  ▀   ▀  ▀   ▀  ',
];

interface HeaderProps {
  totalBytes: number;
  artifactCount: number;
  oldestMtimeMs: number | undefined;
  oldestPath: string | undefined;
  scanStatus: 'scanning' | 'complete';
  typeCount: number;
}

export function Header({
  totalBytes,
  artifactCount,
  oldestMtimeMs,
  oldestPath,
  scanStatus,
  typeCount,
}: HeaderProps): React.ReactElement {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;
  const reclaimable = totalBytes > 0 ? formatBytes(totalBytes) : '—';
  const oldest = formatAge(oldestMtimeMs);
  const reclaimSub = scanStatus === 'scanning' ? 'updating...' : `${artifactCount} artifacts`;
  const artifactSub = scanStatus === 'scanning' ? 'scanning...' : `${typeCount} types`;
  const oldestSub = oldestPath ? oldestPath.slice(0, 22) : '';

  return (
    <Box flexDirection="column">
      <Box>
        {/* Stat cells */}
        <Box width={16} flexDirection="column">
          <Text color={theme.surface2}>{'RECLAIMABLE'}</Text>
          <Text color={theme.yellow} bold>{reclaimable}</Text>
          <Text color={theme.overlay0}>{reclaimSub}</Text>
        </Box>
        <Text color={theme.surface0}>{'│ '}</Text>
        <Box width={16} flexDirection="column">
          <Text color={theme.surface2}>{'ARTIFACTS'}</Text>
          <Text color={theme.blue} bold>{String(artifactCount)}</Text>
          <Text color={theme.overlay0}>{artifactSub}</Text>
        </Box>
        <Text color={theme.surface0}>{'│ '}</Text>
        <Box width={22} flexDirection="column">
          <Text color={theme.surface2}>{'OLDEST'}</Text>
          <Text color={theme.red} bold>{oldest}</Text>
          <Text color={theme.overlay0}>{oldestSub}</Text>
        </Box>

        {/* Spacer + Logo */}
        <Box flexGrow={1} />
        <Box flexDirection="column" alignItems="flex-end">
          {LOGO.map((line, i) => (
            <Text key={`l${i}`} color={theme.peach} dimColor>{line}</Text>
          ))}
        </Box>
      </Box>
      <Text color={theme.surface0}>{'─'.repeat(cols)}</Text>
    </Box>
  );
}
