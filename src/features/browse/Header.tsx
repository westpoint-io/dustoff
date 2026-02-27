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
  searchQuery?: string;
  isSearchMode?: boolean;
  filteredCount?: number;
  typeFilter?: Set<string> | null;
  detailWidth?: number;
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
  searchQuery = '',
  isSearchMode = false,
  filteredCount = 0,
  typeFilter = null,
  detailWidth = 0,
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
  const hasFilter = searchQuery.length > 0 && !isSearchMode;

  // Task 11: selection percentage
  let selectedLabel: string;
  if (selectedCount > 0 && totalBytes > 0) {
    const pct = (selectedBytes / totalBytes * 100).toFixed(1);
    selectedLabel = `${selectedCount} selected (${formatBytes(selectedBytes)} / ${formatBytes(totalBytes)} — ${pct}%)`;
  } else if (selectedCount > 0) {
    selectedLabel = `${selectedCount} selected (${formatBytes(selectedBytes)})`;
  } else {
    selectedLabel = 'None';
  }

  return (
      <Box height={LOGO.length} flexShrink={0} alignItems="flex-start" marginLeft={1}>
        {/* Left column — stats spread across 5 lines to match logo height */}
        <Box flexDirection="column" flexShrink={0}>
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
          <Box flexShrink={0}>
            <Text color={theme.text} bold>{'Sort:'.padEnd(LABEL_W)}</Text>
            <Text color={theme.text}>{sortLabel}</Text>
            <Text color={theme.overlay0}>{'   '}</Text>
            <Text color={theme.text} bold>{'Selected: '}</Text>
            <Text color={theme.text}>{selectedLabel}</Text>
            {typeFilter !== null && typeFilter.size > 0 && (
              <>
                <Text color={theme.overlay0}>{'   '}</Text>
                <Text color={theme.text} bold>{'Type: '}</Text>
                <Text color={theme.text}>{[...typeFilter].join(', ')}</Text>
              </>
            )}
            {hasFilter && (
              <>
                <Text color={theme.overlay0}>{'   '}</Text>
                <Text color={theme.text} bold>{'Filter: '}</Text>
                <Text color={theme.text}>{`"${searchQuery}" (${filteredCount})`}</Text>
              </>
            )}
          </Box>
        </Box>

        {/* Spacer */}
        <Box flexGrow={1} />

        {/* ASCII logo — far right, aligned with detail panel */}
        <Box flexDirection="column" alignItems="flex-end" flexShrink={1} {...(detailWidth > 0 ? { width: detailWidth } : {})}>
          {LOGO.map((line, i) => (
            <Text key={`logo-${i}`} color={theme.logoColors[i]}>{line}</Text>
          ))}
        </Box>
      </Box>
  );
}
