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

function Section({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color={theme.surface0}>{'─'.repeat(40)}</Text>
      <Text color={theme.surface2}>{label}</Text>
      {children}
    </Box>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <Box justifyContent="space-between">
      <Text color={theme.overlay0}>{label}</Text>
      {children}
    </Box>
  );
}

export function DetailPanel({ artifact, width }: DetailPanelProps): React.ReactElement {
  const name = basename(artifact.path);
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeText = formatBytes(artifact.sizeBytes);
  const sizeClr = sizeColor(artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageText = formatAge(artifact.mtimeMs);
  const ageClr = ageColor(days);

  return (
    <Box flexDirection="column" width={width}>
      {/* Panel header: name + type badge */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color={theme.blue} bold>{name}</Text>
        <Text color={typeColor}>{artifact.type}</Text>
      </Box>

      {/* PATH */}
      <Section label="PATH">
        <Text color={theme.blue} wrap="truncate-end">{artifact.path}</Text>
      </Section>

      {/* INFO */}
      <Section label="INFO">
        <InfoRow label="Type">
          <Text color={typeColor}>{artifact.type}</Text>
        </InfoRow>
        <InfoRow label="Size">
          {artifact.sizeBytes === null ? (
            <Text italic color={theme.overlay0}>{'calculating...'}</Text>
          ) : (
            <Text color={sizeClr} bold>{sizeText}</Text>
          )}
        </InfoRow>
        <InfoRow label="Last modified">
          <Text color={ageClr}>{`${ageText} ago`}</Text>
        </InfoRow>
      </Section>

      {/* CONTENTS — stub */}
      <Section label="CONTENTS">
        <Text color={theme.overlay0} italic>{'Run detail scan for breakdown'}</Text>
      </Section>

      {/* SAFE TO DELETE? — stub */}
      <Section label="SAFE TO DELETE?">
        <Text color={theme.overlay0} italic>{'Analysis available after selection'}</Text>
      </Section>
    </Box>
  );
}
