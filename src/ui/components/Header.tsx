import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';
import { formatBytes, formatAge } from '../formatters.js';

interface StatCellProps {
  label: string;
  value: string;
  color: string;
}

function StatCell({ label, value, color }: StatCellProps): React.ReactElement {
  return (
    <Box flexDirection="column" marginRight={4}>
      <Text color={theme.subtext0} dimColor>{label}</Text>
      <Text color={color} bold>{value}</Text>
    </Box>
  );
}

interface HeaderProps {
  totalBytes: number;
  artifactCount: number;
  oldestMtimeMs: number | undefined;
}

/**
 * Stats bar with 3 stat cells + ASCII "DUSTOFF" logo.
 * - Reclaimable: total size of resolved artifacts (yellow)
 * - Artifacts: count of found artifacts (blue)
 * - Oldest: age of oldest artifact by mtimeMs (red)
 */
export function Header({ totalBytes, artifactCount, oldestMtimeMs }: HeaderProps): React.ReactElement {
  const reclaimable = totalBytes > 0 ? formatBytes(totalBytes) : '—';
  const oldest = oldestMtimeMs !== undefined ? formatAge(oldestMtimeMs) : '—';

  return (
    <Box borderStyle="single" borderColor={theme.surface1} paddingX={1} justifyContent="space-between">
      <Box>
        <StatCell label="Reclaimable" value={reclaimable} color={theme.yellow} />
        <StatCell label="Artifacts" value={String(artifactCount)} color={theme.blue} />
        <StatCell label="Oldest" value={oldest} color={theme.red} />
      </Box>
      <Box alignItems="center">
        <Text color={theme.peach} dimColor bold>{'DUSTOFF'}</Text>
      </Box>
    </Box>
  );
}
