import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { formatBytes, formatAge } from '../formatters.js';

// ASCII block-letter DUSTOFF logo — matches mockup exactly
const ASCII_LOGO = [
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
  const reclaimable = totalBytes > 0 ? formatBytes(totalBytes) : '—';
  const oldest = formatAge(oldestMtimeMs);

  // Sub-text for each stat cell
  const reclaimSub = scanStatus === 'scanning' ? 'updating...' : `${artifactCount} artifacts`;
  const artifactSub = scanStatus === 'scanning' ? 'scanning...' : `${typeCount} types`;
  const oldestSub = oldestPath ?? '';

  return (
    <Box borderStyle="single" borderColor={theme.surface0} borderBottom={true} borderTop={false} borderLeft={false} borderRight={false}>
      {/* Stats cells */}
      <Box flexGrow={1}>
        {/* Reclaimable */}
        <Box flexDirection="column" paddingX={1} paddingY={0} minWidth={16}>
          <Text color={theme.surface2}>{'RECLAIMABLE'}</Text>
          <Text color={theme.yellow} bold>{reclaimable}</Text>
          <Text color={theme.overlay0}>{reclaimSub}</Text>
        </Box>

        <Text color={theme.surface0}>{'│'}</Text>

        {/* Artifacts */}
        <Box flexDirection="column" paddingX={1} paddingY={0} minWidth={14}>
          <Text color={theme.surface2}>{'ARTIFACTS'}</Text>
          <Text color={theme.blue} bold>{String(artifactCount)}</Text>
          <Text color={theme.overlay0}>{artifactSub}</Text>
        </Box>

        <Text color={theme.surface0}>{'│'}</Text>

        {/* Oldest */}
        <Box flexDirection="column" paddingX={1} paddingY={0} minWidth={14}>
          <Text color={theme.surface2}>{'OLDEST'}</Text>
          <Text color={theme.red} bold>{oldest}</Text>
          <Text color={theme.overlay0}>{oldestSub}</Text>
        </Box>
      </Box>

      {/* ASCII logo */}
      <Box flexDirection="column" paddingLeft={1} borderStyle="single" borderColor={theme.surface0} borderLeft={true} borderRight={false} borderTop={false} borderBottom={false}>
        {ASCII_LOGO.map((line, i) => (
          <Text key={`logo-${i}`} color={theme.peach} dimColor>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}
