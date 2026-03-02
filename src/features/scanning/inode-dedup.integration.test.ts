/**
 * Real-filesystem integration tests for calculateSize inode dedup.
 *
 * These tests MUST use the real filesystem — memfs cannot simulate:
 * - Hardlinks (shared inodes between paths)
 * - Accurate stat.blocks values (actual disk allocation)
 *
 * Why this matters: dustoff counts hardlinked packages once (not once per
 * hardlink). These tests prove that dedup works on actual filesystems.
 */

import { mkdtemp, rm, writeFile, link, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { calculateSize } from './size.js';

// Hardlinks require elevated permissions on Windows (developer mode or admin).
// Skip all tests on Windows to avoid platform-specific failures in CI.
const describeUnix = process.platform === 'win32' ? describe.skip : describe;

describeUnix('calculateSize — real filesystem integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    // Create a fresh temp directory for each test to ensure full isolation
    tmpDir = await mkdtemp(join(tmpdir(), 'dustoff-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  /**
   * Helper: get the real disk usage of a single file (stat.blocks * 512).
   * Falls back to stat.size if blocks is not available.
   */
  async function realFileSize(filePath: string): Promise<number> {
    const s = await stat(filePath);
    if (s.blocks != null && s.blocks > 0) {
      return s.blocks * 512;
    }
    return s.size;
  }

  test('hardlinked file is counted only once', async () => {
    const pkgDir = join(tmpDir, 'pkg');
    await mkdir(pkgDir);

    const originalPath = join(pkgDir, 'original.js');
    const hardlinkPath = join(pkgDir, 'hardlink.js');

    // Write ~1KB content to ensure non-trivial block allocation
    const content = 'x'.repeat(1024);
    await writeFile(originalPath, content);

    // Create hardlink — both paths share the same inode
    await link(originalPath, hardlinkPath);

    const calculatedSize = await calculateSize(pkgDir);
    const singleFileSize = await realFileSize(originalPath);

    // The calculated size should be approximately the size of ONE file, not two.
    // We allow 2x as an upper bound to account for any filesystem metadata overhead
    // that might be included in the directory walk (none expected, but defensive).
    expect(calculatedSize).toBeGreaterThan(0);
    expect(calculatedSize).toBeLessThanOrEqual(singleFileSize * 2);

    // The primary assertion: result is much closer to 1x than 2x
    // (exact match may vary by filesystem block alignment)
    expect(calculatedSize).toBeLessThanOrEqual(singleFileSize + 512); // allow 1 block overhead
  });

  test('multiple hardlinks to the same inode are counted once', async () => {
    const pkgDir = join(tmpDir, 'pkg');
    await mkdir(pkgDir);

    const srcPath = join(pkgDir, 'src.js');
    const content = 'const x = ' + '1'.repeat(512) + ';';
    await writeFile(srcPath, content);

    // Create 5 hardlinks — all share the same inode as src.js
    for (let i = 1; i <= 5; i++) {
      await link(srcPath, join(pkgDir, `link${i}.js`));
    }

    const calculatedSize = await calculateSize(pkgDir);
    const singleFileSize = await realFileSize(srcPath);

    // Calculated size should be approximately 1x file size, NOT 6x
    expect(calculatedSize).toBeGreaterThan(0);
    expect(calculatedSize).toBeLessThanOrEqual(singleFileSize + 512); // allow 1 block overhead

    // Sanity: 6x would be a clear dedup failure
    expect(calculatedSize).toBeLessThan(singleFileSize * 3);
  });

  test('different inodes are counted separately', async () => {
    const pkgDir = join(tmpDir, 'pkg');
    await mkdir(pkgDir);

    const file1 = join(pkgDir, 'file1.js');
    const file2 = join(pkgDir, 'file2.js');

    // Write two DIFFERENT files (not hardlinks) — they have different inodes
    await writeFile(file1, 'a'.repeat(1024));
    await writeFile(file2, 'b'.repeat(1024));

    const calculatedSize = await calculateSize(pkgDir);
    const size1 = await realFileSize(file1);
    const size2 = await realFileSize(file2);

    const expectedTotal = size1 + size2;

    // Both files should be counted — result should be close to the sum
    expect(calculatedSize).toBeGreaterThanOrEqual(expectedTotal * 0.8);
    expect(calculatedSize).toBeLessThanOrEqual(expectedTotal * 1.2);
  });

  test('per-directory inode scope — Set is not leaked between calls', async () => {
    // Create two separate directories where dirB contains a hardlink to a file in dirA.
    // Calling calculateSize on each separately should return the same result for each,
    // proving the seenInodes Set is NOT shared between calls.
    const dirA = join(tmpDir, 'dirA');
    const dirB = join(tmpDir, 'dirB');
    await mkdir(dirA);
    await mkdir(dirB);

    const fileA = join(dirA, 'file.js');
    const fileB = join(dirB, 'file.js');
    const content = 'module.exports = {};\n' + 'x'.repeat(512);
    await writeFile(fileA, content);

    // fileB is a hardlink to fileA — same inode, different directory
    await link(fileA, fileB);

    const sizeA = await calculateSize(dirA);
    const sizeB = await calculateSize(dirB);

    // Both directories should report approximately the same size
    // because each call creates its own seenInodes Set
    expect(sizeA).toBeGreaterThan(0);
    expect(sizeB).toBeGreaterThan(0);

    // The sizes should be within the same order of magnitude
    // (exact equality depends on filesystem block alignment)
    const ratio = sizeA / sizeB;
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(2.0);
  });

  test('stat.blocks * 512 is consistent with du -sb output', async () => {
    // du -sb is Linux/macOS specific — skip on platforms that don't support it
    let duAvailable = true;
    try {
      execSync('du --version', { stdio: 'ignore' });
    } catch {
      // du may not be installed or may not support -b flag
      duAvailable = false;
    }

    if (!duAvailable) {
      // Skip this subtest if du is not available
      return;
    }

    const pkgDir = join(tmpDir, 'pkg');
    await mkdir(pkgDir);

    // Write a known-size file to get a predictable measurement
    await writeFile(join(pkgDir, 'a.js'), 'a'.repeat(4096));
    await writeFile(join(pkgDir, 'b.js'), 'b'.repeat(4096));

    const calculatedSize = await calculateSize(pkgDir);

    let duOutput: string;
    try {
      // -s: summarize (total only), -b: apparent bytes (GNU du)
      // We use --block-size=1 for byte-level output on systems without -b
      duOutput = execSync(`du -sb "${pkgDir}"`, { encoding: 'utf8' });
    } catch {
      // du -sb may not be available on this platform — skip comparison
      return;
    }

    const duBytes = parseInt(duOutput.trim().split('\t')[0] ?? '0', 10);

    // Allow 10% tolerance for filesystem metadata differences
    // (du may include directory entry overhead that stat.blocks doesn't)
    const tolerance = 0.10;
    const lower = duBytes * (1 - tolerance);
    const upper = duBytes * (1 + tolerance);

    expect(calculatedSize).toBeGreaterThanOrEqual(lower);
    expect(calculatedSize).toBeLessThanOrEqual(upper);
  });
});

/**
 * Tiny helper wrapping fs.promises.mkdir with { recursive: true }.
 * Avoids importing mkdir directly to keep the import block clean.
 */
async function mkdir(dirPath: string): Promise<void> {
  const { mkdir: fsMkdir } = await import('node:fs/promises');
  await fsMkdir(dirPath, { recursive: true });
}
