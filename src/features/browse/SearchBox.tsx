import React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../shared/theme.js';

interface SearchBoxProps {
  query: string;
  isActive: boolean;
  totalResults: number;
}

export function SearchBox({ query, isActive, totalResults }: SearchBoxProps): React.ReactElement | null {
  // Don't render if not active and no query
  if (!isActive && query.length === 0) {
    return null;
  }

  return (
    <Box borderStyle="single" borderColor={theme.blue} paddingX={2}>
      <Text bold>{query || '_'}</Text>
      {query.length > 0 && (
        <Text color={theme.overlay0}>{` (${totalResults} results)`}</Text>
      )}
    </Box>
  );
}
