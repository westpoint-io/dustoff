import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ArtifactRow } from '../../src/features/browse/ArtifactRow.js';
import { Header } from '../../src/features/browse/Header.js';
import { StatusBar } from '../../src/app/StatusBar.js';
import { DetailPanel } from '../../src/features/browse/DetailPanel.js';
import { ShortcutBar } from '../../src/app/ShortcutBar.js';
import { formatBytes, formatAge } from '../../src/shared/formatters.js';
import { sizeColor, theme } from '../../src/shared/theme.js';
import { reducer, type AppState } from '../../src/app/reducer.js';

// ─── Pure function tests (no Ink render required) ───────────────────────────

describe('formatBytes', () => {
  it('returns "calculating..." for null', () => {
    expect(formatBytes(null)).toBe('calculating...');
  });

  it('formats bytes as human-readable', () => {
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
    sizeBytes: null as number | null,
    mtimeMs: Date.now() - 90 * 24 * 60 * 60 * 1000,
  };

  it('shows "calculating..." when sizeBytes is null', () => {
    const { lastFrame } = render(
      <ArtifactRow
        artifact={baseArtifact}
        isCursor={false}
        isSelected={false}
        rootPath="/home/user/project"
      />,
      { columns: 160 },
    );
    expect(lastFrame()).toContain('calculat');
  });

  it('shows formatted size when sizeBytes is set', () => {
    const artifact = { ...baseArtifact, sizeBytes: 1073741824 };
    const { lastFrame } = render(
      <ArtifactRow
        artifact={artifact}
        isCursor={false}
        isSelected={false}
        rootPath="/home/user/project"
      />
    );
    expect(lastFrame()).toContain('GB');
  });

  it('shows artifact type', () => {
    const { lastFrame } = render(
      <ArtifactRow
        artifact={baseArtifact}
        isCursor={false}
        isSelected={false}
        rootPath="/home/user"
      />
    );
    expect(lastFrame()).toContain('node_modules');
  });

  it('strips rootPath prefix from displayed path', () => {
    const { lastFrame } = render(
      <ArtifactRow
        artifact={baseArtifact}
        isCursor={false}
        isSelected={false}
        rootPath="/home/user"
      />,
      { columns: 160 },
    );
    // Should show "project/node_modules" not the full path
    expect(lastFrame()).toContain('project/node_modules');
  });
});

describe('Header', () => {
  const headerProps = {
    rootPath: '/home/user/projects',
    totalBytes: 0,
    artifactCount: 0,
    oldestMtimeMs: undefined as number | undefined,
    scanStatus: 'scanning' as const,
    sortKey: 'size' as const,
    sortDir: 'desc' as const,
  };

  it('shows artifact count', () => {
    const { lastFrame } = render(
      <Header {...headerProps} artifactCount={42} />,
      { columns: 120 },
    );
    expect(lastFrame()).toContain('42');
  });

  it('shows reclaimable total as formatted bytes', () => {
    const totalBytes = 2 * 1024 * 1024 * 1024;
    const { lastFrame } = render(
      <Header {...headerProps} totalBytes={totalBytes} artifactCount={5} />,
      { columns: 120 },
    );
    expect(lastFrame()).toContain('GB');
  });

  it('shows DUSTOFF logo', () => {
    const { lastFrame } = render(
      <Header {...headerProps} />,
      { columns: 120 },
    );
    // FIGlet standard logo renders "DUSTOFF" as ASCII art
    expect(lastFrame()).toContain('____');
  });

  it('shows dash when totalBytes is 0', () => {
    const { lastFrame } = render(
      <Header {...headerProps} />,
      { columns: 120 },
    );
    expect(lastFrame()).toContain('—');
  });

  it('shows scan path', () => {
    const { lastFrame } = render(
      <Header {...headerProps} />,
      { columns: 120 },
    );
    expect(lastFrame()).toContain('Scan:');
  });
});

describe('StatusBar', () => {
  it('shows "Scanning" during scan', () => {
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

  it('shows "Ready" when scan is complete', () => {
    const { lastFrame } = render(
      <StatusBar
        scanStatus="complete"
        scanDurationMs={1234}
        directoriesScanned={100}
        cursorIndex={2}
        totalArtifacts={15}
      />
    );
    expect(lastFrame()).toContain('Ready');
  });

  it('shows position info', () => {
    const { lastFrame } = render(
      <StatusBar
        scanStatus="complete"
        scanDurationMs={100}
        directoriesScanned={10}
        cursorIndex={4}
        totalArtifacts={20}
      />
    );
    expect(lastFrame()).toContain('5/20');
  });

  it('shows view name', () => {
    const { lastFrame } = render(
      <StatusBar
        scanStatus="complete"
        scanDurationMs={100}
        directoriesScanned={10}
        cursorIndex={0}
        totalArtifacts={5}
      />
    );
    expect(lastFrame()).toContain('<artifacts>');
  });
});

describe('DetailPanel', () => {
  const artifact = {
    path: '/home/user/projects/webapp/node_modules',
    type: 'node_modules',
    sizeBytes: 1340000000,
    mtimeMs: Date.now() - 92 * 24 * 60 * 60 * 1000,
  };

  it('shows artifact name', () => {
    const { lastFrame } = render(
      <DetailPanel artifact={artifact} width={32} />
    );
    expect(lastFrame()).toContain('node_modules');
  });

  it('shows size', () => {
    const { lastFrame } = render(
      <DetailPanel artifact={artifact} width={32} />
    );
    expect(lastFrame()).toContain('GB');
  });

  it('shows path', () => {
    const { lastFrame } = render(
      <DetailPanel artifact={artifact} width={50} />
    );
    expect(lastFrame()).toContain('webapp');
  });

  it('shows type label', () => {
    const { lastFrame } = render(
      <DetailPanel artifact={artifact} width={32} />
    );
    expect(lastFrame()).toContain('Type');
  });
});

// ─── Selection & delete reducer tests ────────────────────────────────────────

describe('reducer — selection', () => {
  const baseState: AppState = {
    artifacts: [
      { path: '/a/node_modules', type: 'node_modules', sizeBytes: 100, mtimeMs: Date.now() },
      { path: '/b/dist', type: 'dist', sizeBytes: 200, mtimeMs: Date.now() },
    ],
    scanStatus: 'complete',
    scanDurationMs: 100,
    directoriesScanned: 10,
    cursorIndex: 0,
    sortKey: 'size',
    sortDir: 'desc',
    detailVisible: true,
    maxSizeBytes: 200,
    selectedPaths: new Set(),
    viewMode: 'browse',
    deleteProgress: null,
  };

  it('TOGGLE_SELECT adds a path', () => {
    const next = reducer(baseState, { type: 'TOGGLE_SELECT', path: '/a/node_modules' });
    expect(next.selectedPaths.has('/a/node_modules')).toBe(true);
    expect(next.selectedPaths.size).toBe(1);
  });

  it('TOGGLE_SELECT removes an already-selected path', () => {
    const withSelection = { ...baseState, selectedPaths: new Set(['/a/node_modules']) };
    const next = reducer(withSelection, { type: 'TOGGLE_SELECT', path: '/a/node_modules' });
    expect(next.selectedPaths.has('/a/node_modules')).toBe(false);
    expect(next.selectedPaths.size).toBe(0);
  });

  it('SELECT_ALL selects all artifacts', () => {
    const next = reducer(baseState, { type: 'SELECT_ALL' });
    expect(next.selectedPaths.size).toBe(2);
  });

  it('SELECT_ALL deselects when all are selected', () => {
    const allSelected = {
      ...baseState,
      selectedPaths: new Set(['/a/node_modules', '/b/dist']),
    };
    const next = reducer(allSelected, { type: 'SELECT_ALL' });
    expect(next.selectedPaths.size).toBe(0);
  });

  it('CLEAR_SELECTION empties selection', () => {
    const withSelection = {
      ...baseState,
      selectedPaths: new Set(['/a/node_modules', '/b/dist']),
    };
    const next = reducer(withSelection, { type: 'CLEAR_SELECTION' });
    expect(next.selectedPaths.size).toBe(0);
  });

  it('DELETE_COMPLETE removes deleted artifacts and clears selection', () => {
    const withSelection = {
      ...baseState,
      selectedPaths: new Set(['/a/node_modules']),
      viewMode: 'deleting' as const,
    };
    const next = reducer(withSelection, {
      type: 'DELETE_COMPLETE',
      deletedPaths: ['/a/node_modules'],
    });
    expect(next.artifacts).toHaveLength(1);
    expect(next.artifacts[0]!.path).toBe('/b/dist');
    expect(next.selectedPaths.size).toBe(0);
    expect(next.viewMode).toBe('browse');
  });
});

// ─── ShortcutBar tests ──────────────────────────────────────────────────────

describe('ShortcutBar', () => {
  it('shows navigate hint', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={false} />);
    expect(lastFrame()).toContain('navigate');
  });

  it('shows select hint', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={false} />);
    expect(lastFrame()).toContain('select');
  });

  it('shows delete hint when items are selected', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={true} />);
    expect(lastFrame()).toContain('delete');
  });

  it('shows quit hint', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={false} />);
    expect(lastFrame()).toContain('quit');
  });
});

// ─── ArtifactRow selection display ───────────────────────────────────────────

describe('ArtifactRow — selection', () => {
  const artifact = {
    path: '/home/user/project/node_modules',
    type: 'node_modules',
    sizeBytes: 500000000,
    mtimeMs: Date.now() - 30 * 24 * 60 * 60 * 1000,
  };

  it('shows [ ] when not selected', () => {
    const { lastFrame } = render(
      <ArtifactRow artifact={artifact} isCursor={false} isSelected={false} rootPath="/home/user" />
    );
    expect(lastFrame()).toContain('[ ]');
  });

  it('shows [x] when selected', () => {
    const { lastFrame } = render(
      <ArtifactRow artifact={artifact} isCursor={false} isSelected={true} rootPath="/home/user" />
    );
    expect(lastFrame()).toContain('[x]');
  });
});
