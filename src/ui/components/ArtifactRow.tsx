import React from 'react';
import { Box, Text } from 'ink';
import type { ScanResult } from '../../scanner/types.js';
import { theme, sizeColor, ageColor, typeBadgeColor } from '../theme.js';
import { formatBytes, formatAge, ageDays, truncatePath } from '../formatters.js';
import { SizeBar } from './SizeBar.js';

interface ArtifactRowProps {
  artifact: ScanResult;
  index: number;
  isCursor: boolean;
  isEven: boolean;
  maxSizeBytes: number;
}

export function ArtifactRow({
  artifact,
  index,
  isCursor,
  isEven,
  maxSizeBytes,
}: ArtifactRowProps): React.ReactElement {
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const days = ageDays(artifact.mtimeMs);
  const ageText = formatAge(artifact.mtimeMs);
  const ageClr = ageColor(days);
  const sizeText = formatBytes(artifact.sizeBytes);
  const sizeClr = sizeColor(artifact.sizeBytes);
  const pathWidth = Math.max(20, Math.floor((process.stdout.columns || 80) * 0.35));

  // Cursor indicator
  const cursorGlyph = isCursor ? '›' : ' ';
  const idxColor = isCursor ? theme.blue : theme.overlay0;

  return (
    <Box>
      {/* Cursor + # */}
      <Text color={isCursor ? theme.blue : theme.overlay0} bold={isCursor}>
        {`${cursorGlyph}${String(index).padStart(2)} `}
      </Text>

      {/* TYPE badge */}
      <Box width={14}>
        <Text backgroundColor={isCursor ? undefined : undefined} color={typeColor}>{artifact.type.padEnd(13)}</Text>
      </Box>

      {/* PATH */}
      <Box flexGrow={1}>
        <Text>{truncatePath(artifact.path, pathWidth)}</Text>
      </Box>

      {/* SIZE bar */}
      <Box width={10}>
        <SizeBar bytes={artifact.sizeBytes} maxBytes={maxSizeBytes} />
      </Box>

      {/* SIZE text */}
      <Box width={10} justifyContent="flex-end">
        {artifact.sizeBytes === null ? (
          <Text italic color={theme.overlay0}>{'calculating...'}</Text>
        ) : (
          <Text color={sizeClr} bold={artifact.sizeBytes >= 1024 * 1024 * 1024}>{sizeText}</Text>
        )}
      </Box>

      {/* AGE */}
      <Box width={6} justifyContent="flex-end">
        <Text color={ageClr} bold={days >= 90}>{ageText}</Text>
      </Box>
    </Box>
  );
}
