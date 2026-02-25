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

/**
 * Detail panel matching mockup layout:
 * - Panel header: name + type badge
 * - Path section
 * - Info section: Type, Size, Files, Last modified, Pkg manager
 * - Heaviest section (stub)
 * - Safe to delete? section (stub)
 */
export function DetailPanel({ artifact, width }: DetailPanelProps): React.ReactElement {
  const name = basename(artifact.path);
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeText = formatBytes(artifact.sizeBytes);
  const sizeClr = sizeColor(artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageText = formatAge(artifact.mtimeMs);
  const ageClr = ageColor(days);

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderColor={theme.surface0}
      borderLeft={true}
      borderRight={false}
      borderTop={false}
      borderBottom={false}
    >
      {/* Panel header */}
      <Box paddingX={1} paddingY={0} justifyContent="space-between" borderStyle="single" borderColor={theme.surface0} borderBottom={true} borderTop={false} borderLeft={false} borderRight={false}>
        <Text color={theme.blue} bold>{name}</Text>
        <Text color={typeColor}>{artifact.type}</Text>
      </Box>

      {/* Path section */}
      <Box flexDirection="column" paddingX={1} paddingY={0} borderStyle="single" borderColor={theme.surface0} borderBottom={true} borderTop={false} borderLeft={false} borderRight={false}>
        <Text color={theme.surface2}>{'PATH'}</Text>
        <Text color={theme.blue} wrap="truncate-end">{artifact.path}</Text>
      </Box>

      {/* Info section */}
      <Box flexDirection="column" paddingX={1} paddingY={0} borderStyle="single" borderColor={theme.surface0} borderBottom={true} borderTop={false} borderLeft={false} borderRight={false}>
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
          <Text color={ageClr}>{`${ageText} ago`}</Text>
        </Box>
      </Box>

      {/* Heaviest / Contents — stub for Phase 3 */}
      <Box flexDirection="column" paddingX={1} paddingY={0} borderStyle="single" borderColor={theme.surface0} borderBottom={true} borderTop={false} borderLeft={false} borderRight={false}>
        <Text color={theme.surface2}>{'CONTENTS'}</Text>
        <Text color={theme.overlay0} italic>{'Run detail scan for breakdown'}</Text>
      </Box>

      {/* Safe to delete? */}
      <Box flexDirection="column" paddingX={1} paddingY={0}>
        <Text color={theme.surface2}>{'SAFE TO DELETE?'}</Text>
        <Text color={theme.overlay0} italic>{'Analysis available after selection'}</Text>
      </Box>
    </Box>
  );
}
