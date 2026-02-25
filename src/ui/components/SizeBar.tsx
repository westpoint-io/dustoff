import React from 'react';
import { Text } from 'ink';
import { sizeColor } from '../theme.js';

const BAR_WIDTH = 8;

interface SizeBarProps {
  bytes: number | null;
  maxBytes: number;
}

/**
 * Mini proportional fill bar — 8 chars wide.
 * Shows filled blocks (█) proportional to bytes/maxBytes in the appropriate size-tier color.
 * Shows all dim empty blocks (░) when bytes is null or maxBytes is 0.
 */
export function SizeBar({ bytes, maxBytes }: SizeBarProps): React.ReactElement {
  if (bytes === null || maxBytes === 0) {
    return <Text dimColor>{'░'.repeat(BAR_WIDTH)}</Text>;
  }

  const filled = Math.round((bytes / maxBytes) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const color = sizeColor(bytes);

  return (
    <>
      {filled > 0 && <Text color={color}>{'█'.repeat(filled)}</Text>}
      {empty > 0 && <Text dimColor>{'░'.repeat(empty)}</Text>}
    </>
  );
}
