import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

interface ShortcutDef {
  key: string;
  desc: string;
}

const SHORTCUTS: ShortcutDef[] = [
  { key: '↑↓', desc: 'navigate' },
  { key: 'Space', desc: 'select' },
  { key: 'Tab', desc: 'detail' },
  { key: 's', desc: 'sort' },
  { key: '/', desc: 'filter' },
  { key: 'q', desc: 'quit' },
];

/**
 * Shortcut bar matching mockup: keys in surface0 "kbd" style, descriptions in dim.
 */
export function ShortcutBar(): React.ReactElement {
  return (
    <Box paddingX={1} gap={2} borderStyle="single" borderColor={theme.surface0} borderTop={true} borderBottom={false} borderLeft={false} borderRight={false}>
      {SHORTCUTS.map(({ key, desc }) => (
        <Box key={key} gap={0}>
          <Text backgroundColor={theme.surface0} color={theme.subtext1}>{` ${key} `}</Text>
          <Text color={theme.overlay0}>{` ${desc}`}</Text>
        </Box>
      ))}
    </Box>
  );
}
