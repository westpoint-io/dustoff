import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { theme } from '../theme.js';

const SHORTCUTS = [
  { key: '↑↓', desc: 'navigate' },
  { key: 'Tab', desc: 'toggle detail' },
  { key: '1-6', desc: 'sort column' },
  { key: '/', desc: 'filter' },
  { key: '?', desc: 'help' },
  { key: 'q', desc: 'quit' },
];

export function ShortcutBar(): React.ReactElement {
  const { stdout } = useStdout();
  const cols = stdout?.columns ?? 80;

  return (
    <Box flexDirection="column">
      <Text color={theme.surface0}>{'─'.repeat(cols)}</Text>
      <Box gap={2}>
        {SHORTCUTS.map(({ key, desc }) => (
          <Box key={key}>
            <Text backgroundColor={theme.surface0} color={theme.subtext1}>{` ${key} `}</Text>
            <Text color={theme.overlay0}>{` ${desc}`}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
