import React, { memo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../shared/ThemeContext.js';

interface SectionSeparatorProps {
  label: string;
  width: number;
}

export const SectionSeparator = memo(function SectionSeparator({
  label,
  width,
}: SectionSeparatorProps): React.ReactElement {
  const theme = useTheme();
  const labelText = ` ${label} `;
  const lineWidth = Math.max(0, width - labelText.length - 2); // 2 for leading chars
  const leftLine = '\u2500\u2500';
  const rightLine = '\u2500'.repeat(Math.max(0, lineWidth));

  return (
    <Box>
      <Text color={theme.overlay0}>{leftLine}</Text>
      <Text color={theme.overlay0} bold>{labelText}</Text>
      <Text color={theme.overlay0}>{rightLine}</Text>
    </Box>
  );
});
