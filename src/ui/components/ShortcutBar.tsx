import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

interface ShortcutEntry {
  key: string;
  desc: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { key: '↑↓', desc: 'navigate' },
  { key: 'PgUp/PgDn', desc: 'page' },
  { key: 'Tab', desc: 'detail' },
  { key: 's', desc: 'sort' },
  { key: '/', desc: 'filter (soon)' },
  { key: 'q', desc: 'quit' },
];

/**
 * Static shortcut hint bar at the bottom of the TUI.
 * Shows available keybindings — key in blue, description in dim.
 */
export function ShortcutBar(): React.ReactElement {
  return (
    <Box gap={2} paddingX={1}>
      {SHORTCUTS.map(({ key, desc }) => (
        <Box key={key}>
          <Text color={theme.blue}>{key}</Text>
          <Text>{' '}</Text>
          <Text dimColor>{desc}</Text>
        </Box>
      ))}
    </Box>
  );
}
