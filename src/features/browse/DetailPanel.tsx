import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { basename, relative } from 'node:path';
import { readdirSync } from 'node:fs';
import type { ScanResult } from '../scanning/types.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { sizeColor, ageColor } from '../../shared/themes.js';
import { formatBytes, formatAge, ageDays, truncatePath } from '../../shared/formatters.js';

interface DetailPanelProps {
  artifact: ScanResult;
  width: number;
  rootPath: string;
}

export function DetailPanel({ artifact, width, rootPath }: DetailPanelProps): React.ReactElement {
  const theme = useTheme();
  const name = basename(artifact.path);
  const innerW = Math.max(1, width - 4);
  const sep = '─'.repeat(innerW);
  const typeColor = theme.typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeClr = sizeColor(theme, artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageClr = ageColor(theme, days);

  // Relative path from root
  const relativePath = relative(rootPath, artifact.path);

  // Last modified date
  const lastModDate = useMemo(() => {
    if (!artifact.mtimeMs) return '—';
    const date = new Date(artifact.mtimeMs);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [artifact.mtimeMs]);

  // Item count in directory
  const itemCount = useMemo(() => {
    try {
      const items = readdirSync(artifact.path, { withFileTypes: true });
      return items.length;
    } catch {
      return null;
    }
  }, [artifact.path]);

  return (
    <Box flexDirection="column" width={width} borderStyle="round" borderColor={theme.red} paddingX={1}>
      <Text color={theme.accent} bold>{name}</Text>
      <Text color={theme.overlay0}>{sep}</Text>

      <Box><Text color={theme.text}>{'Type'}</Text><Box flexGrow={1} /><Text color={typeColor}>{artifact.type}</Text></Box>
      <Box><Text color={theme.text}>{'Size'}</Text><Box flexGrow={1} /><Text color={sizeClr} bold>{formatBytes(artifact.sizeBytes)}</Text></Box>
      <Box><Text color={theme.text}>{'Age'}</Text><Box flexGrow={1} /><Text color={ageClr}>{formatAge(artifact.mtimeMs)}</Text></Box>
      {itemCount !== null && (
        <Box><Text color={theme.text}>{'Items'}</Text><Box flexGrow={1} /><Text color={theme.text}>{itemCount}</Text></Box>
      )}
      <Box><Text color={theme.text}>{'Modified'}</Text><Box flexGrow={1} /><Text color={theme.text}>{lastModDate}</Text></Box>
      <Text color={theme.overlay0}>{sep}</Text>

      <Text color={theme.text}>{'Relative Path'}</Text>
      <Text color={theme.blue}>{truncatePath(relativePath, innerW)}</Text>

      <Box marginTop={1}><Text color={theme.overlay0}>{'Full Path'}</Text></Box>
      <Text color={theme.blue}>{truncatePath(artifact.path, innerW)}</Text>
    </Box>
  );
}
