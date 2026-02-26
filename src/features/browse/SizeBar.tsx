import React from 'react';
import { Text } from 'ink';
import { useTheme } from '../../shared/ThemeContext.js';
import { sizeColor } from '../../shared/themes.js';

export const BAR_WIDTH = 8;

interface SizeBarProps {
  sizeBytes: number | null;
  maxSizeBytes: number;
  isCursor: boolean;
}

export function SizeBar({ sizeBytes, maxSizeBytes, isCursor }: SizeBarProps): React.ReactElement {
  const theme = useTheme();
  if (sizeBytes === null || maxSizeBytes === 0) {
    return <Text color={isCursor ? theme.cursorFg : theme.overlay0}>{'░'.repeat(BAR_WIDTH)}</Text>;
  }
  const ratio = Math.min(1, sizeBytes / maxSizeBytes);
  const filled = Math.round(ratio * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const barColor = isCursor ? theme.cursorFg : sizeColor(theme, sizeBytes);
  const trackColor = isCursor ? theme.cursorFg : theme.overlay0;
  return (
    <Text>
      <Text color={barColor}>{'█'.repeat(filled)}</Text>
      <Text color={trackColor}>{'░'.repeat(empty)}</Text>
    </Text>
  );
}
