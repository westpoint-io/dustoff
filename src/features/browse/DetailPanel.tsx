import React, { useMemo, useEffect, useSyncExternalStore } from 'react';
import { Box, Text } from 'ink';
import { basename, relative } from 'node:path';
import { readdirSync } from 'node:fs';
import type { ScanResult } from '../scanning/types.js';
import { useTheme } from '../../shared/ThemeContext.js';
import type { ThemePalette } from '../../shared/themes.js';
import { sizeColor, ageColor } from '../../shared/themes.js';
import { formatBytes, formatAge, ageDays, truncatePath } from '../../shared/formatters.js';
import { isSensitive } from '../../shared/sensitive.js';
import { getArtifactMeta } from '../../shared/artifactMeta.js';
import { getSubdirSizes } from './subdirSizes.js';
import type { SubdirSize } from './subdirSizes.js';

// ─── External store for subdir sizes ─────────────────────────────────────────

interface SubdirStore {
  sizes: SubdirSize[] | null;
  listeners: Set<() => void>;
}

const subdirStores = new Map<string, SubdirStore>();

function getOrCreateStore(path: string): SubdirStore {
  let store = subdirStores.get(path);
  if (!store) {
    store = { sizes: null, listeners: new Set() };
    subdirStores.set(path, store);
    getSubdirSizes(path).then((result) => {
      store!.sizes = result;
      store!.listeners.forEach((fn) => fn());
    }).catch(() => {
      store!.sizes = [];
      store!.listeners.forEach((fn) => fn());
    });
  }
  return store;
}

function subscribeToStore(path: string) {
  return (onStoreChange: () => void) => {
    const store = getOrCreateStore(path);
    store.listeners.add(onStoreChange);
    return () => { store.listeners.delete(onStoreChange); };
  };
}

function getStoreSnapshot(path: string) {
  return () => getOrCreateStore(path).sizes;
}

function useSubdirSizes(path: string): SubdirSize[] | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const subscribe = useMemo(() => subscribeToStore(path), [path]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getSnapshot = useMemo(() => getStoreSnapshot(path), [path]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

// ─── Chart bar colors (matches DonutChart.tsx) ───────────────────────────────

const SEGMENT_COLORS = (theme: ThemePalette) => [theme.blue, theme.green, theme.yellow, theme.magenta, theme.cyan];

// ─── Scrollbar ───────────────────────────────────────────────────────────────

function renderScrollbar(
  theme: ThemePalette,
  innerHeight: number,
  totalLines: number,
  scrollOffset: number,
): React.ReactElement[] {
  if (totalLines <= innerHeight) return [];

  const trackHeight = innerHeight;
  const thumbSize = Math.max(1, Math.round((innerHeight / totalLines) * trackHeight));
  const maxThumbPos = trackHeight - thumbSize;
  const maxOffset = totalLines - innerHeight;
  const thumbPos = maxOffset > 0 ? Math.round((scrollOffset / maxOffset) * maxThumbPos) : 0;

  const rows: React.ReactElement[] = [];
  for (let i = 0; i < trackHeight; i++) {
    const isThumb = i >= thumbPos && i < thumbPos + thumbSize;
    rows.push(
      <Text key={`sb-${i}`} color={isThumb ? theme.accent : theme.overlay0}>
        {isThumb ? '\u2503' : '\u2502'}
      </Text>,
    );
  }
  return rows;
}

// ─── Components ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  artifact: ScanResult;
  width: number;
  rootPath: string;
  maxHeight?: number;
  scrollOffset?: number;
  onTotalLinesChange?: (totalLines: number) => void;
}

export function DetailPanel({ artifact, width, rootPath, maxHeight, scrollOffset = 0, onTotalLinesChange }: DetailPanelProps): React.ReactElement {
  const theme = useTheme();
  const name = basename(artifact.path);
  // Content width: border(2) + paddingX(2) + scrollbar(1) = 5
  const innerW = Math.max(1, width - 5);
  const sep = '\u2500'.repeat(innerW);
  const typeColor = theme.typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeClr = sizeColor(theme, artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageClr = ageColor(theme, days);

  const relativePath = relative(rootPath, artifact.path);

  const lastModDate = useMemo(() => {
    if (!artifact.mtimeMs) return '\u2014';
    const date = new Date(artifact.mtimeMs);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [artifact.mtimeMs]);

  const itemCount = useMemo(() => {
    try {
      const items = readdirSync(artifact.path, { withFileTypes: true });
      return items.length;
    } catch {
      return null;
    }
  }, [artifact.path]);

  const sensitiveInfo = useMemo(
    () => isSensitive(artifact.path),
    [artifact.path],
  );

  const meta = getArtifactMeta(artifact.type);
  const subdirSizes = useSubdirSizes(artifact.path);

  // Build content as a flat array — one element per visual line
  const lines: React.ReactElement[] = useMemo(() => {
    const result: React.ReactElement[] = [];
    let key = 0;
    const k = () => `dl-${key++}`;

    result.push(<Text key={k()} color={theme.accent} bold>{name}</Text>);
    result.push(<Text key={k()} color={theme.overlay0}>{sep}</Text>);
    result.push(
      <Box key={k()}><Text color={theme.text}>{'Type'}</Text><Box flexGrow={1} /><Text color={typeColor}>{artifact.type}</Text></Box>,
    );
    result.push(
      <Box key={k()}><Text color={theme.text}>{'Size'}</Text><Box flexGrow={1} /><Text color={sizeClr} bold>{formatBytes(artifact.sizeBytes)}</Text></Box>,
    );
    result.push(
      <Box key={k()}><Text color={theme.text}>{'Age'}</Text><Box flexGrow={1} /><Text color={ageClr}>{formatAge(artifact.mtimeMs)}</Text></Box>,
    );
    if (itemCount !== null) {
      result.push(
        <Box key={k()}><Text color={theme.text}>{'Items'}</Text><Box flexGrow={1} /><Text color={theme.text}>{itemCount}</Text></Box>,
      );
    }
    result.push(
      <Box key={k()}><Text color={theme.text}>{'Modified'}</Text><Box flexGrow={1} /><Text color={theme.text}>{lastModDate}</Text></Box>,
    );
    result.push(<Text key={k()} color={theme.overlay0}>{sep}</Text>);

    result.push(<Text key={k()} color={theme.text}>{'Relative Path'}</Text>);
    result.push(<Text key={k()} color={theme.blue}>{truncatePath(relativePath, innerW)}</Text>);
    result.push(<Text key={k()}>{' '}</Text>);
    result.push(<Text key={k()} color={theme.text}>{'Full Path'}</Text>);
    result.push(<Text key={k()} color={theme.blue}>{truncatePath(artifact.path, innerW)}</Text>);

    if (sensitiveInfo.sensitive) {
      result.push(<Text key={k()} color={theme.overlay0}>{sep}</Text>);
      result.push(<Text key={k()} color={theme.yellow}>{'\u26A0 '}{sensitiveInfo.reason}</Text>);
    }

    if (meta) {
      result.push(<Text key={k()} color={theme.overlay0}>{sep}</Text>);
      result.push(<Text key={k()} color={theme.text}>{meta.description}</Text>);
      result.push(<Text key={k()} color={theme.green}>{'$ '}{meta.regenerate}</Text>);
    }

    // Subdir chart — inline each bar as its own line element
    result.push(<Text key={k()} color={theme.overlay0}>{sep}</Text>);
    result.push(<Text key={k()} color={theme.text} bold>{'Largest Subdirs'}</Text>);

    if (subdirSizes === null) {
      result.push(<Text key={k()} color={theme.overlay0}>{'Calculating\u2026'}</Text>);
    } else if (subdirSizes.length > 0) {
      const segColors = SEGMENT_COLORS(theme);
      const maxBytes = subdirSizes[0]!.bytes;
      const sizeColW = 10; // enough for "1,024.5 MB"
      const nameColW = 12;
      const barWidth = Math.max(4, innerW - nameColW - sizeColW - 3); // 3 = spaces
      for (let i = 0; i < subdirSizes.length; i++) {
        const seg = subdirSizes[i]!;
        const filled = Math.max(1, Math.round((seg.bytes / maxBytes) * barWidth));
        const empty = barWidth - filled;
        const color = segColors[i % segColors.length]!;
        const segName = seg.name.length > nameColW ? seg.name.slice(0, nameColW - 1) + '\u2026' : seg.name;
        const sizeStr = formatBytes(seg.bytes).padStart(sizeColW);
        result.push(
          <Text key={k()}>
            <Text color={theme.text}>{segName.padEnd(nameColW)}</Text>
            <Text>{' '}</Text>
            <Text color={color}>{'\u2588'.repeat(filled)}</Text>
            <Text color={theme.overlay0}>{'\u2591'.repeat(empty)}</Text>
            <Text>{' '}</Text>
            <Text color={theme.overlay0}>{sizeStr}</Text>
          </Text>,
        );
      }
    } else {
      result.push(<Text key={k()} color={theme.overlay0}>{'Empty directory'}</Text>);
    }

    return result;
  }, [
    name, sep, theme, typeColor, sizeClr, ageClr, artifact, itemCount,
    lastModDate, relativePath, innerW, sensitiveInfo, meta, subdirSizes,
  ]);

  // Report total lines to parent
  useEffect(() => {
    onTotalLinesChange?.(lines.length);
  }, [lines.length, onTotalLinesChange]);

  // No maxHeight → render all content (used in tests without scroll)
  if (maxHeight === undefined) {
    return (
      <Box flexDirection="column" width={width} borderStyle="round" borderColor={theme.accent} paddingX={1}>
        {lines}
      </Box>
    );
  }

  // Scrollable viewport: border consumes 2 rows, scrollbar consumes 1 col
  const innerHeight = Math.max(1, maxHeight - 2);
  const totalLines = lines.length;
  const canScroll = totalLines > innerHeight;
  const maxOffset = Math.max(0, totalLines - innerHeight);
  const clampedOffset = Math.min(scrollOffset, maxOffset);
  const visibleLines = lines.slice(clampedOffset, clampedOffset + innerHeight);

  // Scrollbar column
  const scrollbarElements = canScroll
    ? renderScrollbar(theme, innerHeight, totalLines, clampedOffset)
    : [];

  // Column width: outer content area (width - border(2)) minus scrollbar(1 if present)
  // paddingX={1} on the column is included in columnW (Yoga box-sizing)
  const columnW = Math.max(1, width - 2 - (canScroll ? 1 : 0));

  return (
    <Box width={width} borderStyle="round" borderColor={theme.accent} height={maxHeight} overflowY="hidden">
      <Box flexDirection="column" width={columnW} paddingX={1} height={innerHeight} overflowY="hidden">
        {visibleLines}
      </Box>
      {canScroll && (
        <Box flexDirection="column" flexShrink={0}>
          {scrollbarElements}
        </Box>
      )}
    </Box>
  );
}
