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
  width?: number;
}

export function TypeFilter({ types, cursorIndex, width = 60 }: TypeFilterProps): React.ReactElement {
  const theme = useTheme();
  const INNER_W = Math.max(30, width - 4);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={theme.accent}
      width={width}
      paddingX={1}
    >
      <Text color={theme.accent} bold>
        {'Filter by type (a:all Esc)'.padEnd(INNER_W)}
      </Text>
      {types.map((info, i) => {
        const isCursor = i === cursorIndex;
        const checkbox = info.selected ? '[x]' : '[ ]';
        const countStr = ` (${info.count})`;
        const maxTypeLen = INNER_W - checkbox.length - 1 - countStr.length;
        const typeName = info.type.length > maxTypeLen
          ? info.type.slice(0, maxTypeLen - 1) + '\u2026'
          : info.type;
        const row = `${checkbox} ${typeName}${countStr}`;
        const padded = row.padEnd(INNER_W);

        return (
          <Text
            key={info.type}
            backgroundColor={isCursor ? theme.cursorBg : undefined}
            color={isCursor ? theme.cursorFg : (theme.typeBadgeColor[info.type] ?? theme.text)}
            bold={isCursor}
          >
            {padded}
          </Text>
        );
      })}
    </Box>
  );
}
