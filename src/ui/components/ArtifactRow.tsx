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

/**
 * Single artifact row matching the mockup layout:
 * [#] [TYPE badge] [PATH] [SIZE bar] [SIZE text] [AGE]
 *
 * Cursor row: blue left border + › glyph + highlighted background
 * Even rows: subtle surface0 tint background
 */
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

  // Row background: cursor gets surface0, even rows get subtle tint
  const bgColor = isCursor ? theme.surface0 : undefined;

  return (
    <Box
      paddingX={1}
      borderStyle={isCursor ? 'single' : undefined}
      borderLeft={isCursor}
      borderRight={false}
      borderTop={false}
      borderBottom={false}
      borderColor={theme.blue}
    >
      {/* # column */}
      <Box width={4}>
        {isCursor ? (
          <Text color={theme.blue} bold>{'›'}{String(index)}</Text>
        ) : (
          <Text color={theme.overlay0}>{String(index).padStart(2)}</Text>
        )}
      </Box>

      {/* TYPE column - badge style */}
      <Box width={14}>
        <Text color={typeColor}>{artifact.type}</Text>
      </Box>

      {/* PATH column - flex fill */}
      <Box flexGrow={1}>
        <Text>{truncatePath(artifact.path, process.stdout.columns ? Math.floor(process.stdout.columns * 0.35) : 40)}</Text>
      </Box>

      {/* SIZE bar column */}
      <Box width={10}>
        <SizeBar bytes={artifact.sizeBytes} maxBytes={maxSizeBytes} />
      </Box>

      {/* SIZE text column */}
      <Box width={12} justifyContent="flex-end">
        {artifact.sizeBytes === null ? (
          <Text italic color={theme.overlay0}>{'calculating...'}</Text>
        ) : (
          <Text color={sizeClr} bold={artifact.sizeBytes >= 1024 * 1024 * 1024}>{sizeText}</Text>
        )}
      </Box>

      {/* AGE column */}
      <Box width={6} justifyContent="flex-end">
        <Text color={ageClr} bold={days >= 90}>{ageText}</Text>
      </Box>
    </Box>
  );
}
