import React from 'react';
import { Box, Text } from 'ink';
import { basename } from 'node:path';
import type { ScanResult } from '../../scanner/types.js';
import { theme, accent, typeBadgeColor, sizeColor, ageColor } from '../theme.js';
import { formatBytes, formatAge, ageDays } from '../formatters.js';

interface DetailPanelProps {
  artifact: ScanResult;
  width: number;
}

export function DetailPanel({ artifact, width }: DetailPanelProps): React.ReactElement {
  const name = basename(artifact.path);
  const innerW = Math.max(1, width - 4);
  const sep = '─'.repeat(innerW);
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeClr = sizeColor(artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageClr = ageColor(days);

  return (
    <Box flexDirection="column" width={width} borderStyle="round" borderColor={theme.surface2} paddingX={1}>
      <Text color={accent} bold>{name}</Text>
      <Text color={theme.surface0}>{sep}</Text>

      <Box><Text color={theme.overlay0}>{'Type'}</Text><Box flexGrow={1} /><Text color={typeColor}>{artifact.type}</Text></Box>
      <Box><Text color={theme.overlay0}>{'Size'}</Text><Box flexGrow={1} /><Text color={sizeClr} bold>{formatBytes(artifact.sizeBytes)}</Text></Box>
      <Box><Text color={theme.overlay0}>{'Age'}</Text><Box flexGrow={1} /><Text color={ageClr}>{formatAge(artifact.mtimeMs)}</Text></Box>
      <Text color={theme.surface0}>{sep}</Text>

      <Text color={theme.overlay0}>{'Path'}</Text>
      <Text color={theme.blue} wrap="truncate-end">{artifact.path}</Text>
    </Box>
  );
}
