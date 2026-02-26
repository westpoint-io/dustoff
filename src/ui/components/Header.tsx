import React from 'react';
import { Box, Text } from 'ink';
import { theme, LOGO, logoColors } from '../theme.js';
import { formatBytes, formatAge } from '../formatters.js';

interface HeaderProps {
  rootPath: string;
  totalBytes: number;
  artifactCount: number;
  oldestMtimeMs: number | undefined;
  scanStatus: 'scanning' | 'complete';
}

// Fixed-width label column for alignment
const LABEL_W = 13;

export function Header({
  rootPath,
  totalBytes,
  artifactCount,
  oldestMtimeMs,
  scanStatus,
}: HeaderProps): React.ReactElement {
  const reclaimable = totalBytes > 0 ? formatBytes(totalBytes) : '—';
  const oldest = oldestMtimeMs !== undefined ? formatAge(oldestMtimeMs) : '—';
  const displayPath = rootPath.replace(process.env.HOME || '', '~');

  return (
    <Box alignItems="flex-end" marginLeft={1}>
      {/* Context info — left side */}
      <Box flexDirection="column">
        <Box>
          <Text color={theme.text} bold>{'Scan:'.padEnd(LABEL_W)}</Text>
          <Text color={theme.sky}>{displayPath}</Text>
        </Box>
        <Box>
          <Text color={theme.text} bold>{'Artifacts:'.padEnd(LABEL_W)}</Text>
          <Text color={theme.text}>{String(artifactCount)}</Text>
        </Box>
        <Box>
          <Text color={theme.text} bold>{'Reclaimable:'.padEnd(LABEL_W)}</Text>
          <Text color={theme.yellow} bold>{reclaimable}</Text>
        </Box>
        <Box>
          <Text color={theme.text} bold>{'Oldest:'.padEnd(LABEL_W)}</Text>
          <Text color={theme.red}>{oldest}</Text>
        </Box>
      </Box>

      {/* Spacer */}
      <Box flexGrow={1} />

      {/* ASCII logo — right side */}
      <Box flexDirection="column" alignItems="flex-end">
        {LOGO.map((line, i) => (
          <Text key={`logo-${i}`} color={logoColors[i]}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}
