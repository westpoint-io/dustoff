import React from 'react';
import { Box, Text } from 'ink';
import { basename } from 'node:path';
import type { ScanResult } from '../../scanner/types.js';
import { theme, typeBadgeColor, sizeColor, ageColor } from '../theme.js';
import { formatBytes, formatAge, ageDays } from '../formatters.js';

interface DetailPanelProps {
  artifact: ScanResult;
  width: number;
}

export function DetailPanel({ artifact, width }: DetailPanelProps): React.ReactElement {
  const name = basename(artifact.path);
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeText = formatBytes(artifact.sizeBytes);
  const sizeClr = sizeColor(artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageText = `${formatAge(artifact.mtimeMs)} ago`;
  const ageClr = ageColor(days);
  const sep = '─'.repeat(width - 2);

  return (
    <Box flexDirection="column" width={width} paddingLeft={1}>
      {/* Panel header */}
      <Box justifyContent="space-between">
        <Text color={theme.blue} bold>{name}</Text>
        <Text color={typeColor}>{artifact.type}</Text>
      </Box>
      <Text color={theme.surface0}>{sep}</Text>

      {/* PATH */}
      <Text color={theme.surface2}>{'PATH'}</Text>
      <Text color={theme.blue} wrap="truncate-end">{artifact.path}</Text>
      <Text color={theme.surface0}>{sep}</Text>

      {/* INFO */}
      <Text color={theme.surface2}>{'INFO'}</Text>
      <Box justifyContent="space-between">
        <Text color={theme.overlay0}>{'Type'}</Text>
        <Text color={typeColor}>{artifact.type}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text color={theme.overlay0}>{'Size'}</Text>
        {artifact.sizeBytes === null ? (
          <Text italic color={theme.overlay0}>{'calculating...'}</Text>
        ) : (
          <Text color={sizeClr} bold>{sizeText}</Text>
        )}
      </Box>
      <Box justifyContent="space-between">
        <Text color={theme.overlay0}>{'Last modified'}</Text>
        <Text color={ageClr}>{ageText}</Text>
      </Box>
      <Text color={theme.surface0}>{sep}</Text>

      {/* CONTENTS — stub */}
      <Text color={theme.surface2}>{'CONTENTS'}</Text>
      <Text color={theme.overlay0} italic>{'Run detail scan for breakdown'}</Text>
      <Text color={theme.surface0}>{sep}</Text>

      {/* SAFE TO DELETE? — stub */}
      <Text color={theme.surface2}>{'SAFE TO DELETE?'}</Text>
      <Text color={theme.overlay0} italic>{'Analysis available after selection'}</Text>
    </Box>
  );
}
