import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { ScanResult } from '../scanning/types.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { sizeColor, ageColor, TYPE_W, SIZE_W, AGE_W } from '../../shared/themes.js';
import { formatBytes, formatAge, ageDays } from '../../shared/formatters.js';
import { SizeBar } from './SizeBar.js';

interface ArtifactRowProps {
  artifact: ScanResult;
  isCursor: boolean;
  isSelected: boolean;
  rootPath: string;
  maxSizeBytes: number;
  commonPrefix: string;
  themeName?: string;
}

// Memoized row — prevents re-render on every cursor move for non-cursor rows
export const ArtifactRow = memo(function ArtifactRow({
  artifact,
  isCursor,
  isSelected,
  rootPath,
  maxSizeBytes,
  commonPrefix,
}: ArtifactRowProps): React.ReactElement {
  const theme = useTheme();
  // Full-row highlight: cursor gets accent bg, selected (non-cursor) gets muted bg
  const bg = isCursor ? theme.cursorBg : (isSelected ? '#3a3a3a' : undefined);
  const fg = isCursor ? theme.cursorFg : theme.text;
  const typeFg = isCursor ? theme.cursorFg : (theme.typeBadgeColor[artifact.type] ?? theme.subtext0);
  const sizeFg = isCursor ? theme.cursorFg : sizeColor(theme, artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageFg = isCursor ? theme.cursorFg : ageColor(theme, days);
  const checkFg = isCursor ? theme.cursorFg : (isSelected ? theme.green : theme.overlay0);

  // Strip rootPath prefix for compact display
  const prefix = rootPath.endsWith('/') ? rootPath : rootPath + '/';
  const displayPath = artifact.path.startsWith(prefix)
    ? artifact.path.slice(prefix.length)
    : artifact.path;

  // Split displayPath into dim common prefix + bright suffix
  const dimPart = displayPath.startsWith(commonPrefix) ? commonPrefix : '';
  const brightPart = dimPart ? displayPath.slice(dimPart.length) : displayPath;

  const checkbox = isSelected ? '[x]' : '[ ]';

  return (
    <Box backgroundColor={bg}>
      <Text color={checkFg}>{` ${checkbox} `}</Text>
      <Text color={typeFg}>{artifact.type.padEnd(TYPE_W)}</Text>
      <Text wrap="truncate-end">
        {isCursor ? (
          <Text color={fg}>{displayPath}</Text>
        ) : (
          <>
            <Text color={theme.overlay0}>{dimPart}</Text>
            <Text color={fg}>{brightPart}</Text>
          </>
        )}
      </Text>
      <Box flexGrow={1} />
      <SizeBar sizeBytes={artifact.sizeBytes} maxSizeBytes={maxSizeBytes} isCursor={isCursor} />
      <Text color={sizeFg} bold={!isCursor}>
        {formatBytes(artifact.sizeBytes).padStart(SIZE_W)}
      </Text>
      <Text color={ageFg}>
        {formatAge(artifact.mtimeMs).padStart(AGE_W)}
      </Text>
      <Text>{' '}</Text>
    </Box>
  );
});
