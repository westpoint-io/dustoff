import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../shared/ThemeContext.js';

export interface TypeInfo {
  type: string;
  count: number;
  selected: boolean;
}

interface TypeFilterProps {
  types: TypeInfo[];
  cursorIndex: number;
}

export function TypeFilter({ types, cursorIndex }: TypeFilterProps): React.ReactElement {
  const theme = useTheme();

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      paddingX={1}
    >
      <Box marginBottom={0}>
        <Text color={theme.accent} bold>
          {'Filter by type (Enter to toggle, Esc to close)'}
        </Text>
      </Box>
      {types.map((info, i) => {
        const isCursor = i === cursorIndex;
        const checkbox = info.selected ? '[x]' : '[ ]';
        const badgeColor = theme.typeBadgeColor[info.type] ?? theme.text;

        return (
          <Box key={info.type}>
            <Text
              backgroundColor={isCursor ? theme.cursorBg : undefined}
              color={isCursor ? theme.cursorFg : theme.text}
            >
              {'  '}
              {checkbox}
              {' '}
            </Text>
            <Text
              backgroundColor={isCursor ? theme.cursorBg : undefined}
              color={isCursor ? theme.cursorFg : badgeColor}
              bold
            >
              {info.type}
            </Text>
            <Text
              backgroundColor={isCursor ? theme.cursorBg : undefined}
              color={isCursor ? theme.cursorFg : theme.overlay0}
            >
              {` (${info.count})`}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
