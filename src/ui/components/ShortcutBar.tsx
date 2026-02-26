import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../theme.js';

interface ShortcutBarProps {
  hasSelection: boolean;
}

const BASE_SHORTCUTS = [
  { key: '↑↓', desc: 'navigate' },
  { key: 'Space', desc: 'select' },
  { key: 'Tab', desc: 'detail' },
  { key: 's', desc: 'sort' },
  { key: 'q', desc: 'quit' },
];

const SELECTION_SHORTCUTS = [
  { key: '↑↓', desc: 'navigate' },
  { key: 'Space', desc: 'select' },
  { key: 'd', desc: 'delete' },
  { key: 'a', desc: 'select all' },
  { key: 'Esc', desc: 'clear' },
  { key: 'q', desc: 'quit' },
];

export function ShortcutBar({ hasSelection }: ShortcutBarProps): React.ReactElement {
  const shortcuts = hasSelection ? SELECTION_SHORTCUTS : BASE_SHORTCUTS;

  return (
    <Box gap={2} marginLeft={1}>
      {shortcuts.map(({ key, desc }) => (
        <Box key={key}>
          <Text bold color="black" backgroundColor="green">{` ${key} `}</Text>
          <Text color={theme.overlay0}>{` ${desc}`}</Text>
        </Box>
      ))}
    </Box>
  );
}
