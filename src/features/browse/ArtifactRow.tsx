import React, { memo } from 'react';
import { Box, Text } from 'ink';
import type { ScanResult } from '../scanning/types.js';
import { useTheme } from '../../shared/ThemeContext.js';
import { sizeColor, ageColor, TYPE_W, SIZE_W, AGE_W } from '../../shared/themes.js';
import { formatBytes, formatAge, ageDays } from '../../shared/formatters.js';
import { SizeBar, BAR_WIDTH } from './SizeBar.js';

// Fixed width for right-side columns: space + bar + space + size + space + age + space
const RIGHT_W = 1 + BAR_WIDTH + 1 + SIZE_W + 1 + AGE_W + 1;

interface ArtifactRowProps {
  artifact: ScanResult;
  isCursor: boolean;
  isSelected: boolean;
  rootPath: string;
  maxSizeBytes: number;
  commonPrefix: string;
  themeName?: string;
  pathWidth?: number;
  isSensitive?: boolean;
}

// Memoized row — prevents re-render on every cursor move for non-cursor rows
export const ArtifactRow = memo(function ArtifactRow({
  artifact,
  isCursor,
  isSelected,
  rootPath,
  maxSizeBytes,
  commonPrefix,
  pathWidth = 60,
  isSensitive = false,
}: ArtifactRowProps): React.ReactElement {
  const theme = useTheme();
  // Full-row highlight: cursor gets accent bg, selected (non-cursor) gets muted bg
  const bg = isCursor ? theme.cursorBg : (isSelected ? theme.selectedBg : undefined);
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

  // Truncate path to fit available width (subtract 2 for ⚠ prefix when sensitive)
  const effectivePathWidth = isSensitive ? pathWidth - 2 : pathWidth;
  const truncatedPath = displayPath.length > effectivePathWidth
    ? displayPath.slice(0, effectivePathWidth - 1) + '…'
    : displayPath;
  const truncatedDim = truncatedPath.startsWith(dimPart) ? dimPart : '';
  const truncatedBright = truncatedDim
    ? truncatedPath.slice(truncatedDim.length)
    : truncatedPath;

  const checkbox = isSelected ? '[x]' : '[ ]';

  // Pad path to fill the full allocated width so Ink overwrites every character
  // on each render — prevents ghost characters when cursor highlight moves.
  const paddedPath = truncatedPath.padEnd(effectivePathWidth);
  const pathPadding = ' '.repeat(Math.max(0, effectivePathWidth - truncatedDim.length - truncatedBright.length));

  return (
    <Box backgroundColor={bg} flexGrow={1}>
      <Text color={checkFg}>{` ${checkbox} `}</Text>
      <Text color={typeFg}>{artifact.type.length > TYPE_W ? artifact.type.slice(0, TYPE_W - 1) + '…' : artifact.type.padEnd(TYPE_W)}</Text>
      <Box flexGrow={1}>
        {isSensitive && <Text color={isCursor ? theme.cursorFg : theme.yellow}>{'\u26A0 '}</Text>}
        {isCursor ? (
          <Text color={fg}>{paddedPath}</Text>
        ) : (
          <Text>
            <Text color={theme.overlay0}>{truncatedDim}</Text>
            <Text color={fg}>{truncatedBright}{pathPadding}</Text>
          </Text>
        )}
      </Box>
      <Box width={RIGHT_W} flexShrink={0}>
        <Text>{' '}</Text>
        <SizeBar sizeBytes={artifact.sizeBytes} maxSizeBytes={maxSizeBytes} isCursor={isCursor} />
        <Text>{' '}</Text>
        <Text color={sizeFg} bold={!isCursor}>
          {formatBytes(artifact.sizeBytes).padStart(SIZE_W)}
        </Text>
        <Text>{' '}</Text>
        <Text color={ageFg}>
          {formatAge(artifact.mtimeMs).padStart(AGE_W)}
        </Text>
        <Text>{' '}</Text>
      </Box>
    </Box>
  );
});
