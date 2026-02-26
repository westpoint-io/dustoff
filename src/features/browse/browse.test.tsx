import React from 'react';
import { describe, it, expect } from 'bun:test';
import { render } from 'ink-testing-library';
import { ArtifactRow } from './ArtifactRow.js';
import { SizeBar } from './SizeBar.js';
import { Header } from './Header.js';
import { DetailPanel } from './DetailPanel.js';
import { SearchBox } from './SearchBox.js';
import { ShortcutBar } from '../../app/ShortcutBar.js';
import { StatusBar } from '../../app/StatusBar.js';

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
        maxSizeBytes={0}
        commonPrefix=""
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
        maxSizeBytes={1073741824}
        commonPrefix=""
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
        maxSizeBytes={0}
        commonPrefix=""
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
        maxSizeBytes={0}
        commonPrefix=""
      />,
      { columns: 160 },
    );
    // Should show "project/node_modules" not the full path
    expect(lastFrame()).toContain('project/node_modules');
  });
});

// ─── SizeBar tests ──────────────────────────────────────────────────────────

describe('SizeBar', () => {
  it('full bar contains only filled blocks', () => {
    const { lastFrame } = render(
      <SizeBar sizeBytes={1000} maxSizeBytes={1000} isCursor={false} />
    );
    const output = lastFrame() ?? '';
    expect(output).toContain('████████');
    expect(output).not.toContain('░');
  });

  it('null sizeBytes renders only empty blocks', () => {
    const { lastFrame } = render(
      <SizeBar sizeBytes={null} maxSizeBytes={1000} isCursor={false} />
    );
    const output = lastFrame() ?? '';
    expect(output).toContain('░░░░░░░░');
    expect(output).not.toContain('█');
  });

  it('zero maxSizeBytes renders only empty blocks', () => {
    const { lastFrame } = render(
      <SizeBar sizeBytes={500} maxSizeBytes={0} isCursor={false} />
    );
    const output = lastFrame() ?? '';
    expect(output).toContain('░░░░░░░░');
    expect(output).not.toContain('█');
  });

  it('half size renders both filled and empty characters', () => {
    const { lastFrame } = render(
      <SizeBar sizeBytes={500} maxSizeBytes={1000} isCursor={false} />
    );
    const output = lastFrame() ?? '';
    expect(output).toContain('█');
    expect(output).toContain('░');
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

  it('shows compact header when termHeight < 30', () => {
    const { lastFrame } = render(
      <Header {...headerProps} artifactCount={22} totalBytes={3700000000} termHeight={25} />,
      { columns: 120 },
    );
    const output = lastFrame() ?? '';
    expect(output).toContain('DUSTOFF');
    expect(output).toContain('22 artifacts');
    expect(output).toContain('reclaimable');
    // Should NOT contain the logo ASCII art
    expect(output).not.toContain('____');
    // Should NOT contain full header labels
    expect(output).not.toContain('Scan:');
  });

  it('shows full header when termHeight >= 30', () => {
    const { lastFrame } = render(
      <Header {...headerProps} termHeight={30} />,
      { columns: 120 },
    );
    const output = lastFrame() ?? '';
    expect(output).toContain('Scan:');
    expect(output).toContain('____');
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

  it('shows position as 1-indexed', () => {
    const { lastFrame } = render(
      <StatusBar
        scanStatus="complete"
        scanDurationMs={100}
        directoriesScanned={10}
        cursorIndex={0}
        totalArtifacts={5}
      />
    );
    expect(lastFrame()).toContain('1/5');
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
      <DetailPanel artifact={artifact} width={32} rootPath="/home/user/projects" />
    );
    expect(lastFrame()).toContain('node_modules');
  });

  it('shows size', () => {
    const { lastFrame } = render(
      <DetailPanel artifact={artifact} width={32} rootPath="/home/user/projects" />
    );
    expect(lastFrame()).toContain('GB');
  });

  it('shows path', () => {
    const { lastFrame } = render(
      <DetailPanel artifact={artifact} width={50} rootPath="/home/user/projects" />
    );
    expect(lastFrame()).toContain('webapp');
  });

  it('shows type label', () => {
    const { lastFrame } = render(
      <DetailPanel artifact={artifact} width={32} rootPath="/home/user/projects" />
    );
    expect(lastFrame()).toContain('Type');
  });
});

// ─── ShortcutBar tests ──────────────────────────────────────────────────────

describe('ShortcutBar', () => {
  it('shows navigate hint', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={false} hasFilter={false} />);
    expect(lastFrame()).toContain('navigate');
  });

  it('shows select hint', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={false} hasFilter={false} />);
    expect(lastFrame()).toContain('select');
  });

  it('shows delete hint when items are selected', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={true} hasFilter={false} />);
    expect(lastFrame()).toContain('delete');
  });

  it('shows quit hint', () => {
    const { lastFrame } = render(<ShortcutBar hasSelection={false} hasFilter={false} />);
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
      <ArtifactRow artifact={artifact} isCursor={false} isSelected={false} rootPath="/home/user" maxSizeBytes={500000000} commonPrefix="" />
    );
    expect(lastFrame()).toContain('[ ]');
  });

  it('shows [x] when selected', () => {
    const { lastFrame } = render(
      <ArtifactRow artifact={artifact} isCursor={false} isSelected={true} rootPath="/home/user" maxSizeBytes={500000000} commonPrefix="" />
    );
    expect(lastFrame()).toContain('[x]');
  });
});

// ─── SearchBox tests ────────────────────────────────────────────────────────

describe('SearchBox', () => {
  it('does not render when query is empty and not active', () => {
    const { lastFrame } = render(<SearchBox query="" isActive={false} totalResults={0} />);
    expect(lastFrame()).toBe('');
  });

  it('renders when isActive is true', () => {
    const { lastFrame } = render(<SearchBox query="" isActive={true} totalResults={0} />);
    const output = lastFrame();
    expect(output).toContain('_');
  });

  it('renders when query has content', () => {
    const { lastFrame } = render(<SearchBox query="node" isActive={false} totalResults={2} />);
    const output = lastFrame();
    expect(output).toContain('node');
    expect(output).toContain('2 results');
  });

  it('displays result count when query matches artifacts', () => {
    const { lastFrame } = render(<SearchBox query="dist" isActive={false} totalResults={5} />);
    const output = lastFrame();
    expect(output).toContain('5 results');
  });
});
