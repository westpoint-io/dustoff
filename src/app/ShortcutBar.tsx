import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../shared/ThemeContext.js';

interface ShortcutBarProps {
  hasSelection: boolean;
  hasFilter?: boolean;
}

const BASE_SHORTCUTS = [
  { key: '▲▼', desc: 'navigate' },
  { key: '␣', desc: 'select' },
  { key: 'a', desc: 'select all' },
  { key: '⇥', desc: 'detail' },
  { key: 's', desc: 'sort' },
  { key: 't', desc: 'theme' },
  { key: 'q', desc: 'quit' },
];

const DELETE_SHORTCUTS = [
  { key: '▲▼', desc: 'navigate' },
  { key: '␣', desc: 'select' },
  { key: 'a', desc: 'select all' },
  { key: 'd', desc: 'delete' },
  { key: 'esc', desc: 'clear' },
  { key: 'q', desc: 'quit' },
];

const FILTER_SHORTCUTS = [
  { key: '▲▼', desc: 'navigate' },
  { key: '␣', desc: 'select' },
  { key: 'a', desc: 'select all' },
  { key: 's', desc: 'sort' },
  { key: '/', desc: 'edit filter' },
  { key: 'esc', desc: 'clear filter' },
  { key: 'q', desc: 'quit' },
];

export function ShortcutBar({ hasSelection, hasFilter = false }: ShortcutBarProps): React.ReactElement {
  const theme = useTheme();
  let shortcuts: Array<{ key: string; desc: string }>;
  if (hasSelection) {
    shortcuts = DELETE_SHORTCUTS;
  } else if (hasFilter) {
    shortcuts = FILTER_SHORTCUTS;
  } else {
    shortcuts = BASE_SHORTCUTS;
  }

  return (
    <Box gap={1} marginLeft={1}>
      {shortcuts.map(({ key, desc }) => (
        <Box key={key}>
          <Text backgroundColor={theme.accent} color={theme.cursorFg} bold>{` ${key} `}</Text>
          <Text color={theme.text}>{` ${desc}`}</Text>
        </Box>
      ))}
    </Box>
  );
}
