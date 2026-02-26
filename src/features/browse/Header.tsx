import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../shared/ThemeContext.js';
import { LOGO } from '../../shared/themes.js';
import { formatBytes, formatAge, truncatePath } from '../../shared/formatters.js';

interface HeaderProps {
  rootPath: string;
  totalBytes: number;
  artifactCount: number;
  oldestMtimeMs: number | undefined;
  scanStatus: 'scanning' | 'complete';
  sortKey: 'size' | 'path' | 'age';
  sortDir: 'asc' | 'desc';
  selectedCount?: number;
  selectedBytes?: number;
  termHeight?: number;
}

// Fixed-width label column for alignment
const LABEL_W = 13;

const SORT_LABELS: Record<string, string> = {
  size: 'Size',
  path: 'Path',
  age: 'Age',
};

export function Header({
  rootPath,
  totalBytes,
  artifactCount,
  oldestMtimeMs,
  scanStatus,
  sortKey,
  sortDir,
  selectedCount = 0,
  selectedBytes = 0,
  termHeight = 40,
}: HeaderProps): React.ReactElement {
  const theme = useTheme();
  const reclaimable = totalBytes > 0 ? formatBytes(totalBytes) : '—';
  const displayPath = truncatePath(rootPath.replace(process.env.HOME || '', '~'), 50);

  // Compact single-line header for short terminals
  if (termHeight < 30) {
    return (
      <Box marginLeft={1}>
        <Text color={theme.accent} bold>{'DUSTOFF'}</Text>
        <Text color={theme.overlay0}>{' | '}</Text>
        <Text color={theme.sky}>{displayPath}</Text>
        <Text color={theme.overlay0}>{' | '}</Text>
        <Text color={theme.text}>{`${artifactCount} artifacts`}</Text>
        <Text color={theme.overlay0}>{' | '}</Text>
        <Text color={theme.yellow} bold>{`${reclaimable} reclaimable`}</Text>
      </Box>
    );
  }

  const oldest = oldestMtimeMs !== undefined ? formatAge(oldestMtimeMs) : '—';
  const sortLabel = `${SORT_LABELS[sortKey]} ${sortDir === 'desc' ? '↓' : '↑'}`;
  const selectedLabel = selectedCount > 0 ? `${selectedCount} selected (${formatBytes(selectedBytes)})` : 'None';

  return (
    <Box alignItems="flex-end" marginLeft={1}>
      {/* Left column — Scan, Artifacts, Reclaimable */}
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
      </Box>

      {/* Right column — Oldest, Sort, Selected */}
      <Box flexDirection="column" marginLeft={3}>
        <Box>
          <Text color={theme.text} bold>{'Oldest:'.padEnd(LABEL_W)}</Text>
          <Text color={theme.red}>{oldest}</Text>
        </Box>
        <Box>
          <Text color={theme.text} bold>{'Sort:'.padEnd(LABEL_W)}</Text>
          <Text color={theme.yellow}>{sortLabel}</Text>
        </Box>
        <Box>
          <Text color={theme.text} bold>{'Selected:'.padEnd(LABEL_W)}</Text>
          <Text color={theme.blue}>{selectedLabel}</Text>
        </Box>
      </Box>

      {/* Spacer */}
      <Box flexGrow={1} />

      {/* ASCII logo — far right */}
      <Box flexDirection="column" alignItems="flex-end">
        {LOGO.map((line, i) => (
          <Text key={`logo-${i}`} color={theme.logoColors[i]}>{line}</Text>
        ))}
      </Box>
    </Box>
  );
}
