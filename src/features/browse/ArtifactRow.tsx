import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { ScanResult } from '../scanning/types.js';
import { theme, cursorBg, sizeColor, ageColor, typeBadgeColor, TYPE_W, SIZE_W, AGE_W } from '../../shared/theme.js';
import { formatBytes, formatAge, ageDays } from '../../shared/formatters.js';

interface ArtifactRowProps {
  artifact: ScanResult;
  isCursor: boolean;
  isSelected: boolean;
  rootPath: string;
}

// Memoized row — prevents re-render on every cursor move for non-cursor rows
export const ArtifactRow = memo(function ArtifactRow({
  artifact,
  isCursor,
  isSelected,
  rootPath,
}: ArtifactRowProps): React.ReactElement {
  // Full-row highlight: when cursor, dark text on accent bg
  const bg = isCursor ? cursorBg : undefined;
  const cursorFg = 'black';
  const fg = isCursor ? cursorFg : theme.text;
  const typeFg = isCursor ? cursorFg : (typeBadgeColor[artifact.type] ?? theme.subtext0);
  const sizeFg = isCursor ? cursorFg : sizeColor(artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageFg = isCursor ? cursorFg : ageColor(days);
  const checkFg = isCursor ? cursorFg : (isSelected ? theme.green : theme.overlay0);

  // Strip rootPath prefix for compact display
  const prefix = rootPath.endsWith('/') ? rootPath : rootPath + '/';
  const displayPath = artifact.path.startsWith(prefix)
    ? artifact.path.slice(prefix.length)
    : artifact.path;

  const checkbox = isSelected ? '[x]' : '[ ]';

  return (
    <Box>
      <Text backgroundColor={bg} color={checkFg}>{` ${checkbox} `}</Text>
      <Text backgroundColor={bg} color={typeFg}>{artifact.type.padEnd(TYPE_W)}</Text>
      <Text backgroundColor={bg} color={fg} wrap="truncate-end">{displayPath}</Text>
      <Box flexGrow={1}><Text backgroundColor={bg}>{' '}</Text></Box>
      <Text backgroundColor={bg} color={sizeFg} bold={!isCursor}>
        {formatBytes(artifact.sizeBytes).padStart(SIZE_W)}
      </Text>
      <Text backgroundColor={bg} color={ageFg}>
        {formatAge(artifact.mtimeMs).padStart(AGE_W)}
      </Text>
      <Text backgroundColor={bg}>{' '}</Text>
    </Box>
  );
});
