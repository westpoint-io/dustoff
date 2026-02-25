import React from 'react';
import { Box, Text } from 'ink';
import { basename } from 'node:path';
import type { ScanResult } from '../../scanner/types.js';
import { theme, typeBadgeColor } from '../theme.js';
import { formatBytes, formatAge } from '../formatters.js';

interface DetailPanelProps {
  artifact: ScanResult;
  width: number;
}

/**
 * Right-side detail panel shown when Tab is pressed.
 * Displays artifact name, path, type, size, and last-modified info.
 * Contents tree and breakdown bar are Phase 3 stubs — placeholder text shown.
 */
export function DetailPanel({ artifact, width }: DetailPanelProps): React.ReactElement {
  const name = basename(artifact.path);
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeText = formatBytes(artifact.sizeBytes);
  const ageText = formatAge(artifact.mtimeMs);
  const modifiedDate = artifact.mtimeMs !== undefined
    ? new Date(artifact.mtimeMs).toLocaleDateString()
    : 'unknown';

  return (
    <Box
      flexDirection="column"
      width={width}
      borderStyle="single"
      borderColor={theme.surface1}
      paddingX={1}
    >
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold>{name}</Text>
        <Text>{' '}</Text>
        <Text color={typeColor}>{`[${artifact.type}]`}</Text>
      </Box>

      {/* Path */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={theme.subtext0} dimColor>{'Path'}</Text>
        <Text color={theme.blue} wrap="wrap">{artifact.path}</Text>
      </Box>

      {/* Info */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={theme.subtext0} dimColor>{'Info'}</Text>
        <Box>
          <Text dimColor>{'Type  '}</Text>
          <Text color={typeColor}>{artifact.type}</Text>
        </Box>
        <Box>
          <Text dimColor>{'Size  '}</Text>
          {artifact.sizeBytes === null ? (
            <Text italic dimColor>{'calculating...'}</Text>
          ) : (
            <Text>{sizeText}</Text>
          )}
        </Box>
        <Box>
          <Text dimColor>{'Mtime '}</Text>
          <Text>{`${modifiedDate} (${ageText})`}</Text>
        </Box>
      </Box>

      {/* Safe to delete? */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={theme.subtext0} dimColor>{'Safe to delete?'}</Text>
        <Text dimColor>{'Analysis available after selection'}</Text>
      </Box>

      {/* Contents — Phase 3 stub */}
      <Box flexDirection="column">
        <Text color={theme.subtext0} dimColor>{'Contents'}</Text>
        <Text dimColor>{'Run detail scan for breakdown'}</Text>
      </Box>
    </Box>
  );
}
