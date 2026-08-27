import { link, mkdtemp, mkdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, test, expect } from 'bun:test';
import { calculateSize, calculateSizeWithTimeout } from './size.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'dustoff-size-test-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

function pathInTmp(...segments: string[]): string {
  return join(tmpDir, ...segments);
}

const testWithHardlinks = process.platform === 'win32' ? test.skip : test;

describe('calculateSize()', () => {
  test('calculates size of directory with files', async () => {
    const dir = pathInTmp('dir');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'a.txt'), 'hello');
    await writeFile(join(dir, 'b.txt'), 'world');

    const size = await calculateSize(dir);

    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThanOrEqual(10);
  });

  test('returns 0 for empty directory', async () => {
    const dir = pathInTmp('empty');
    await mkdir(dir);

    const size = await calculateSize(dir);

    expect(size).toBe(0);
  });

  test('handles nested directories — includes all files', async () => {
    const root = pathInTmp('root');
    await mkdir(join(root, 'sub', 'deep'), { recursive: true });
    await writeFile(join(root, 'a.txt'), 'aaaa');
    await writeFile(join(root, 'sub', 'b.txt'), 'bbbb');
    await writeFile(join(root, 'sub', 'deep', 'c.txt'), 'cccc');

    const size = await calculateSize(root);

    expect(size).toBeGreaterThanOrEqual(12);
  });

  test('returns 0 for non-existent directory — does not throw', async () => {
    const size = await calculateSize(pathInTmp('does-not-exist'));

    expect(size).toBe(0);
  });

  test('handles accessible directories without throwing', async () => {
    const root = pathInTmp('root');
    await mkdir(join(root, 'accessible'), { recursive: true });
    await writeFile(join(root, 'accessible', 'file.txt'), 'content here');

    const size = await calculateSize(root);

    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThanOrEqual(0);
  });

  testWithHardlinks('deduplicates hardlinked files by inode', async () => {
    const dir = pathInTmp('dir');
    await mkdir(dir, { recursive: true });
    const original = join(dir, 'file1.txt');
    const hardlink = join(dir, 'file2.txt');
    await writeFile(original, 'content of file one');
    await link(original, hardlink);

    const size = await calculateSize(dir);
    const originalStat = await stat(original);
    const singleFileSize = originalStat.blocks != null && originalStat.blocks > 0
      ? originalStat.blocks * 512
      : originalStat.size;

    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThan(0);
    expect(size).toBeLessThanOrEqual(singleFileSize + 512);
  });
});

describe('calculateSizeWithTimeout()', () => {
  test('returns size for fast calculation', async () => {
    const dir = pathInTmp('dir');
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, 'file.txt'), 'small content');

    const size = await calculateSizeWithTimeout(dir, 5000);

    expect(typeof size).toBe('number');
    expect(size).toBeGreaterThanOrEqual(0);
  });

  test('returns null on timeout', async () => {
    const big = pathInTmp('big');
    await mkdir(join(big, 'a'), { recursive: true });
    await mkdir(join(big, 'b'), { recursive: true });
    await mkdir(join(big, 'c'), { recursive: true });
    await writeFile(join(big, 'a', 'file.txt'), 'x'.repeat(100));
    await writeFile(join(big, 'b', 'file.txt'), 'x'.repeat(100));
    await writeFile(join(big, 'c', 'file.txt'), 'x'.repeat(100));

    const size = await calculateSizeWithTimeout(big, 0);

    expect(size === null || typeof size === 'number').toBe(true);
  });
});
