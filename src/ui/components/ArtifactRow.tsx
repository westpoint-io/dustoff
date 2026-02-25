import React from 'react';
import { Box, Text } from 'ink';
import type { ScanResult } from '../../scanner/types.js';
import { theme, sizeColor, ageColor, typeBadgeColor } from '../theme.js';
import { formatBytes, formatAge, truncatePath } from '../formatters.js';
import { SizeBar } from './SizeBar.js';
import { differenceInDays } from 'date-fns';

const PATH_MAX_WIDTH = 40;
const TYPE_WIDTH = 12;

interface ArtifactRowProps {
  artifact: ScanResult;
  index: number;       // 1-based display row number
  isCursor: boolean;
  isEven: boolean;
  maxSizeBytes: number;
}

/**
 * Renders a single artifact row in the table.
 *
 * Cursor row gets a blue left-border (Ink's borderLeft) and › glyph indicator.
 * Non-cursor rows have a plain space in place of the glyph, no border.
 *
 * Columns:
 * - #: row index (muted)
 * - TYPE: artifact type as color-coded badge
 * - PATH: truncated path, flex fill
 * - SIZE bar: proportional fill bar (SizeBar component)
 * - SIZE: formatBytes (italic dimColor if calculating)
 * - AGE: formatAge with age-tier color
 */
export function ArtifactRow({
  artifact,
  index,
  isCursor,
  maxSizeBytes,
}: ArtifactRowProps): React.ReactElement {
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const typePadded = artifact.type.slice(0, TYPE_WIDTH).padEnd(TYPE_WIDTH);

  const pathTruncated = truncatePath(artifact.path, PATH_MAX_WIDTH);
  const pathPadded = pathTruncated.padEnd(PATH_MAX_WIDTH);

  const sizeText = formatBytes(artifact.sizeBytes);
  const sizeCol = sizeText.padStart(14);
  const sizeTextColor = sizeColor(artifact.sizeBytes);

  const ageDays =
    artifact.mtimeMs !== undefined
      ? differenceInDays(Date.now(), new Date(artifact.mtimeMs))
      : 999;
  const ageText = formatAge(artifact.mtimeMs);
  const ageCol = ageText.padStart(14);
  const ageTextColor = ageColor(ageDays);

  const indexStr = String(index).padStart(3);

  const rowContent = (
    <>
      <Text dimColor>{`${indexStr} `}</Text>
      <Text color={typeColor}>{typePadded}</Text>
      <Text>{' '}</Text>
      <Text>{pathPadded}</Text>
      <Text>{' '}</Text>
      <SizeBar bytes={artifact.sizeBytes} maxBytes={maxSizeBytes} />
      <Text>{' '}</Text>
      {artifact.sizeBytes === null ? (
        <Text italic dimColor>{sizeCol}</Text>
      ) : (
        <Text color={sizeTextColor}>{sizeCol}</Text>
      )}
      <Text>{' '}</Text>
      <Text color={ageTextColor}>{ageCol}</Text>
    </>
  );

  if (isCursor) {
    return (
      <Box
        borderStyle="single"
        borderLeft={true}
        borderRight={false}
        borderTop={false}
        borderBottom={false}
        borderLeftColor={theme.blue}
      >
        <Text color={theme.blue}>{'›'}</Text>
        {rowContent}
      </Box>
    );
  }

  return (
    <Box>
      <Text>{' '}</Text>
      {rowContent}
    </Box>
  );
}
