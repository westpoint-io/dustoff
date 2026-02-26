import { useStdout } from 'ink';

export interface WindowResult<T> {
  visibleItems: T[];
  scrollOffset: number;
  visibleCount: number;
}

/**
 * Computes a viewport window into the items array, keeping the cursor visible.
 *
 * Ink has no built-in scroll. This hook slices items to the visible terminal
 * height, tracking scroll offset to keep the cursor centered in the viewport.
 *
 * @param items - The full sorted item list
 * @param cursorIndex - Current cursor position in the full list
 * @param reservedRows - Rows consumed by header, table header, status bar, etc. (default: 7)
 */
export function useWindow<T>(
  items: T[],
  cursorIndex: number,
  reservedRows: number = 7,
): WindowResult<T> {
  const { stdout } = useStdout();
  const rows = stdout?.rows ?? 24;
  const visibleCount = Math.max(1, rows - reservedRows);

  // Keep cursor visible: scroll offset tracks cursor, centered in viewport
  const scrollOffset = Math.max(
    0,
    Math.min(
      cursorIndex - Math.floor(visibleCount / 2),
      Math.max(0, items.length - visibleCount),
    ),
  );

  return {
    visibleItems: items.slice(scrollOffset, scrollOffset + visibleCount),
    scrollOffset,
    visibleCount,
  };
}
