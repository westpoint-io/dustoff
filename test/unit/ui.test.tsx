import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ArtifactRow } from '../../src/ui/components/ArtifactRow.js';
import { SizeBar } from '../../src/ui/components/SizeBar.js';
import { Header } from '../../src/ui/components/Header.js';
import { StatusBar } from '../../src/ui/components/StatusBar.js';
import { ShortcutBar } from '../../src/ui/components/ShortcutBar.js';
import { formatBytes, formatAge } from '../../src/ui/formatters.js';
import { sizeColor } from '../../src/ui/theme.js';
import { theme } from '../../src/ui/theme.js';

// ─── Pure function tests (no Ink render required) ───────────────────────────

describe('formatBytes', () => {
  it('returns "calculating..." for null', () => {
    expect(formatBytes(null)).toBe('calculating...');
  });

  it('formats bytes as human-readable', () => {
    // 1 GB — pretty-bytes formats as "1 GB"
    const result = formatBytes(1073741824);
    expect(result).toContain('GB');
  });

  it('formats small bytes', () => {
    const result = formatBytes(1024);
    expect(result).toContain('kB');
  });
});

describe('sizeColor', () => {
  it('returns overlay0 color for null (calculating)', () => {
    expect(sizeColor(null)).toBe(theme.overlay0);
  });

  it('returns yellow for < 100MB', () => {
    expect(sizeColor(50 * 1024 * 1024)).toBe(theme.yellow);
  });

  it('returns peach for 100MB - 1GB range', () => {
    expect(sizeColor(500 * 1024 * 1024)).toBe(theme.peach);
  });

  it('returns red for >= 1GB', () => {
    expect(sizeColor(2 * 1024 * 1024 * 1024)).toBe(theme.red);
  });
});

// ─── Component tests using ink-testing-library ───────────────────────────────

describe('ArtifactRow', () => {
  const baseArtifact = {
    path: '/home/user/project/node_modules',
    type: 'node_modules',
    sizeBytes: null,
    mtimeMs: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
  };

  it('shows "calculating..." when sizeBytes is null', () => {
    const { lastFrame } = render(
      <ArtifactRow
        artifact={baseArtifact}
        index={1}
        isCursor={false}
        isEven={false}
        maxSizeBytes={0}
      />
    );
    expect(lastFrame()).toContain('calculating...');
  });

  it('shows formatted size when sizeBytes is set', () => {
    const artifact = { ...baseArtifact, sizeBytes: 1073741824 };
    const { lastFrame } = render(
      <ArtifactRow
        artifact={artifact}
        index={1}
        isCursor={false}
        isEven={false}
        maxSizeBytes={1073741824}
      />
    );
    expect(lastFrame()).toContain('GB');
  });

  it('shows cursor glyph when isCursor is true', () => {
    const { lastFrame } = render(
      <ArtifactRow
        artifact={baseArtifact}
        index={1}
        isCursor={true}
        isEven={false}
        maxSizeBytes={0}
      />
    );
    expect(lastFrame()).toContain('›');
  });

  it('does not show cursor glyph when isCursor is false', () => {
    const { lastFrame } = render(
      <ArtifactRow
        artifact={baseArtifact}
        index={1}
        isCursor={false}
        isEven={false}
        maxSizeBytes={0}
      />
    );
    expect(lastFrame()).not.toContain('›');
  });
});

describe('SizeBar', () => {
  it('renders all empty blocks (░) when bytes is null', () => {
    const { lastFrame } = render(<SizeBar bytes={null} maxBytes={1000} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('░');
    expect(frame).not.toContain('█');
  });

  it('renders all empty blocks (░) when maxBytes is 0', () => {
    const { lastFrame } = render(<SizeBar bytes={500} maxBytes={0} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('░');
    expect(frame).not.toContain('█');
  });

  it('renders filled blocks (█) proportional to bytes', () => {
    // bytes=500, maxBytes=1000 → 50% → 4 filled out of 8
    const { lastFrame } = render(<SizeBar bytes={500} maxBytes={1000} />);
    const frame = lastFrame() ?? '';
    expect(frame).toContain('█');
    // Count filled chars — strip ANSI codes for plain comparison
    const stripped = frame.replace(/\x1b\[[0-9;]*m/g, '');
    const filledCount = (stripped.match(/█/g) ?? []).length;
    expect(filledCount).toBe(4);
  });

  it('renders full bar when bytes equals maxBytes', () => {
    const { lastFrame } = render(<SizeBar bytes={1000} maxBytes={1000} />);
    const frame = lastFrame() ?? '';
    const stripped = frame.replace(/\x1b\[[0-9;]*m/g, '');
    const filledCount = (stripped.match(/█/g) ?? []).length;
    expect(filledCount).toBe(8);
  });
});

describe('Header', () => {
  it('shows artifact count', () => {
    const { lastFrame } = render(
      <Header totalBytes={0} artifactCount={42} oldestMtimeMs={undefined} />
    );
    expect(lastFrame()).toContain('42');
  });

  it('shows reclaimable total as formatted bytes', () => {
    const totalBytes = 2 * 1024 * 1024 * 1024; // 2 GB
    const { lastFrame } = render(
      <Header totalBytes={totalBytes} artifactCount={5} oldestMtimeMs={undefined} />
    );
    expect(lastFrame()).toContain('GB');
  });

  it('shows DUSTOFF logo', () => {
    const { lastFrame } = render(
      <Header totalBytes={0} artifactCount={0} oldestMtimeMs={undefined} />
    );
    expect(lastFrame()).toContain('DUSTOFF');
  });

  it('shows dash when totalBytes is 0', () => {
    const { lastFrame } = render(
      <Header totalBytes={0} artifactCount={0} oldestMtimeMs={undefined} />
    );
    expect(lastFrame()).toContain('—');
  });
});

describe('StatusBar', () => {
  it('shows scanning state with "Scanning" text', () => {
    const { lastFrame } = render(
      <StatusBar
        scanStatus="scanning"
        scanDurationMs={null}
        directoriesScanned={42}
        cursorIndex={0}
        totalArtifacts={10}
      />
    );
    expect(lastFrame()).toContain('Scanning');
  });

  it('shows complete state with "Scan complete" text', () => {
    const { lastFrame } = render(
      <StatusBar
        scanStatus="complete"
        scanDurationMs={1234}
        directoriesScanned={100}
        cursorIndex={2}
        totalArtifacts={15}
      />
    );
    expect(lastFrame()).toContain('Scan complete');
  });

  it('shows row position info', () => {
    const { lastFrame } = render(
      <StatusBar
        scanStatus="complete"
        scanDurationMs={100}
        directoriesScanned={10}
        cursorIndex={4}
        totalArtifacts={20}
      />
    );
    // cursorIndex=4 → Row 5 of 20
    expect(lastFrame()).toContain('Row 5 of 20');
  });
});

describe('ShortcutBar', () => {
  it('shows "navigate" hint', () => {
    const { lastFrame } = render(<ShortcutBar />);
    expect(lastFrame()).toContain('navigate');
  });

  it('shows "sort" hint', () => {
    const { lastFrame } = render(<ShortcutBar />);
    expect(lastFrame()).toContain('sort');
  });

  it('shows "quit" hint', () => {
    const { lastFrame } = render(<ShortcutBar />);
    expect(lastFrame()).toContain('quit');
  });
});
