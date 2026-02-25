import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { theme } from '../theme.js';
import { formatBytes, formatAge } from '../formatters.js';

// Compact ASCII art — 6 lines, dimmed peach to match mockup header-ascii
const LOGO = [
  '██████╗ ██╗   ██╗███████╗████████╗ ██████╗ ███████╗███████╗',
  '██╔══██╗██║   ██║██╔════╝╚══██╔══╝██╔═══██╗██╔════╝██╔════╝',
  '██║  ██║██║   ██║███████╗   ██║   ██║   ██║█████╗  █████╗  ',
  '██║  ██║██║   ██║╚════██║   ██║   ██║   ██║██╔══╝  ██╔══╝  ',
  '██████╔╝╚██████╔╝███████║   ██║   ╚██████╔╝██║     ██║     ',
  '╚═════╝  ╚═════╝ ╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ╚═╝     ',
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
  const oldestSub = oldestPath ? oldestPath.slice(0, 20) : '';

  // Stat column width
  const statW = 16;

  return (
    <Box flexDirection="column">
      {/* Stats row + logo */}
      <Box>
        {/* Stats area */}
        <Box>
          {/* Reclaimable */}
          <Box flexDirection="column" width={statW}>
            <Text color={theme.surface2}>{'RECLAIMABLE'}</Text>
            <Text color={theme.yellow} bold>{reclaimable}</Text>
            <Text color={theme.overlay0}>{reclaimSub}</Text>
          </Box>
          <Box flexDirection="column" width={1} marginRight={1}>
            <Text color={theme.surface0}>{'│'}</Text>
            <Text color={theme.surface0}>{'│'}</Text>
            <Text color={theme.surface0}>{'│'}</Text>
          </Box>
          {/* Artifacts */}
          <Box flexDirection="column" width={statW}>
            <Text color={theme.surface2}>{'ARTIFACTS'}</Text>
            <Text color={theme.blue} bold>{String(artifactCount)}</Text>
            <Text color={theme.overlay0}>{artifactSub}</Text>
          </Box>
          <Box flexDirection="column" width={1} marginRight={1}>
            <Text color={theme.surface0}>{'│'}</Text>
            <Text color={theme.surface0}>{'│'}</Text>
            <Text color={theme.surface0}>{'│'}</Text>
          </Box>
          {/* Oldest */}
          <Box flexDirection="column" width={statW}>
            <Text color={theme.surface2}>{'OLDEST'}</Text>
            <Text color={theme.red} bold>{oldest}</Text>
            <Text color={theme.overlay0}>{oldestSub}</Text>
          </Box>
        </Box>
        {/* Spacer */}
        <Box flexGrow={1} />
        {/* ASCII logo - right aligned, dimmed */}
        <Box flexDirection="column">
          {LOGO.map((line, i) => (
            <Text key={`h${i}`} color={theme.peach} dimColor>{line}</Text>
          ))}
        </Box>
      </Box>
      {/* Bottom separator */}
      <Text color={theme.surface0}>{'─'.repeat(cols)}</Text>
    </Box>
  );
}
