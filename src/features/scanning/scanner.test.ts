import { vol } from 'memfs';
import { mock, beforeEach, describe, test, expect } from 'bun:test';
import { scan } from './scanner.js';

mock.module('node:fs', () => {
  const memfs = require('memfs');
  return { default: memfs.fs, ...memfs.fs };
});
mock.module('node:fs/promises', () => {
  const memfs = require('memfs');
  return { default: memfs.fs.promises, ...memfs.fs.promises };
});

beforeEach(() => {
  vol.reset();
});

describe('scan()', () => {
  test('finds single node_modules directory', async () => {
    vol.fromJSON({
      '/project/node_modules/lodash/index.js': 'module.exports = {};',
      '/project/src/index.ts': 'export {};',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    expect(results).toHaveLength(1);
    expect(results[0]!.path).toBe('/project/node_modules');
    expect(results[0]!.type).toBe('node_modules');
  });

  test('finds multiple artifact types', async () => {
    vol.fromJSON({
      // 12 different artifact types
      '/project/node_modules/pkg/index.js': '',
      '/project/.next/server/index.js': '',
      '/project/dist/index.js': '',
      '/project/.cache/webpack/bundle.js': '',
      '/project/coverage/lcov.info': '',
      '/project/build/index.js': '',
      '/project/.turbo/cache/hash.json': '',
      '/project/.svelte-kit/output/index.js': '',
      '/project/.output/server/index.js': '',
      '/project/.vite/deps/react.js': '',
      '/project/.nuxt/dist/client/index.js': '',
      '/project/.parcel-cache/v2/1234.blob': '',
      // Regular source files
      '/project/src/index.ts': 'export {};',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    const foundTypes = new Set(results.map((r) => r.type));
    expect(foundTypes).toContain('node_modules');
    expect(foundTypes).toContain('.next');
    expect(foundTypes).toContain('dist');
    expect(foundTypes).toContain('.cache');
    expect(foundTypes).toContain('coverage');
    expect(foundTypes).toContain('build');
    expect(foundTypes).toContain('.turbo');
    expect(foundTypes).toContain('.svelte-kit');
    expect(foundTypes).toContain('.output');
    expect(foundTypes).toContain('.vite');
    expect(foundTypes).toContain('.nuxt');
    expect(foundTypes).toContain('.parcel-cache');
    expect(results).toHaveLength(12);
  });

  test('skips children of matched directories', async () => {
    vol.fromJSON({
      '/project/node_modules/pkg/node_modules/nested/index.js': '',
      '/project/node_modules/pkg/index.js': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    // Only the top-level node_modules should be found, not the nested one
    expect(results).toHaveLength(1);
    expect(results[0]!.path).toBe('/project/node_modules');
    expect(results[0]!.type).toBe('node_modules');
  });

  test('skips ignored directories', async () => {
    vol.fromJSON({
      '/project/.git/objects/pack/data': '',
      '/project/.git/config': '',
      '/project/.vscode/settings.json': '',
      '/project/node_modules/x/index.js': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    // Only node_modules should be found; .git and .vscode should be skipped
    expect(results).toHaveLength(1);
    expect(results[0]!.path).toBe('/project/node_modules');

    const foundTypes = results.map((r) => r.type);
    expect(foundTypes).not.toContain('.git');
    expect(foundTypes).not.toContain('.vscode');
  });

  test('streams results — yields one at a time', async () => {
    vol.fromJSON({
      '/project/packages/app/node_modules/react/index.js': '',
      '/project/packages/lib/node_modules/lodash/index.js': '',
    });

    const generator = scan('/project');

    // Consume first result
    const first = await generator.next();
    expect(first.done).toBe(false);
    expect(first.value).toBeDefined();
    expect(first.value.type).toBe('node_modules');

    // Consume second result
    const second = await generator.next();
    expect(second.done).toBe(false);
    expect(second.value).toBeDefined();
    expect(second.value.type).toBe('node_modules');

    // Generator should be done
    const third = await generator.next();
    expect(third.done).toBe(true);
  });

  test('yields sizeBytes as null', async () => {
    vol.fromJSON({
      '/project/node_modules/pkg/index.js': '',
      '/project/dist/bundle.js': '',
      '/project/.next/server/index.js': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    expect(results).toHaveLength(3);
    for (const result of results) {
      expect(result.sizeBytes).toBeNull();
    }
  });

  test('handles empty directory — yields no results', async () => {
    vol.fromJSON({
      '/empty/.keep': '',
    });

    // Create truly empty dir by resetting and only creating the dir
    vol.reset();
    vol.mkdirSync('/empty');

    const results = [];
    for await (const result of scan('/empty')) {
      results.push(result);
    }

    expect(results).toHaveLength(0);
  });

  test('finds deeply nested artifact directories', async () => {
    vol.fromJSON({
      '/a/b/c/d/e/node_modules/package/index.js': '',
      '/a/b/c/d/e/src/index.ts': '',
    });

    const results = [];
    for await (const result of scan('/a')) {
      results.push(result);
    }

    expect(results).toHaveLength(1);
    expect(results[0]!.path).toBe('/a/b/c/d/e/node_modules');
    expect(results[0]!.type).toBe('node_modules');
  });

  test('respects AbortSignal cancellation', async () => {
    vol.fromJSON({
      '/project/packages/a/node_modules/x/index.js': '',
      '/project/packages/b/node_modules/y/index.js': '',
      '/project/packages/c/node_modules/z/index.js': '',
      '/project/packages/d/node_modules/w/index.js': '',
    });

    const controller = new AbortController();
    const results = [];

    for await (const result of scan('/project', { signal: controller.signal })) {
      results.push(result);
      // Abort after first result
      controller.abort();
    }

    // Should have stopped after first result due to abort
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.length).toBeLessThan(4);
  });

  test('excludes artifact types when exclude option is set', async () => {
    vol.fromJSON({
      '/project/node_modules/pkg/index.js': '',
      '/project/dist/bundle.js': '',
      '/project/.next/server/index.js': '',
    });

    const results = [];
    for await (const result of scan('/project', { exclude: new Set(['dist']) })) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    const types = results.map((r) => r.type);
    expect(types).not.toContain('dist');
    expect(types).toContain('node_modules');
    expect(types).toContain('.next');
  });

  test('uses custom targets when targets option is set', async () => {
    vol.fromJSON({
      '/project/node_modules/pkg/index.js': '',
      '/project/dist/bundle.js': '',
      '/project/.next/server/index.js': '',
      '/project/custom_out/bundle.js': '',
    });

    const results = [];
    for await (const result of scan('/project', { targets: new Set(['custom_out', 'dist']) })) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    const types = new Set(results.map((r) => r.type));
    expect(types).toContain('custom_out');
    expect(types).toContain('dist');
    expect(types).not.toContain('node_modules');
    expect(types).not.toContain('.next');
  });

  test('exclude and targets can be combined', async () => {
    vol.fromJSON({
      '/project/dist/bundle.js': '',
      '/project/build/output.js': '',
      '/project/coverage/lcov.info': '',
    });

    const results = [];
    for await (const result of scan('/project', {
      targets: new Set(['dist', 'build', 'coverage']),
      exclude: new Set(['coverage']),
    })) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    const types = new Set(results.map((r) => r.type));
    expect(types).toContain('dist');
    expect(types).toContain('build');
    expect(types).not.toContain('coverage');
  });

  test('returns ScanResult with correct shape', async () => {
    vol.fromJSON({
      '/project/node_modules/react/index.js': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    expect(results).toHaveLength(1);
    const result = results[0]!;

    // Verify shape
    expect(typeof result.path).toBe('string');
    expect(typeof result.type).toBe('string');
    expect(result.sizeBytes).toBeNull();
    expect(result.path).toBe('/project/node_modules');
    expect(result.type).toBe('node_modules');
  });

  test('finds target files with kind: file', async () => {
    vol.fromJSON({
      '/project/.tsbuildinfo': '{}',
      '/project/.eslintcache': '',
      '/project/src/index.ts': 'export {};',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    const fileResults = results.filter((r) => r.kind === 'file');
    expect(fileResults).toHaveLength(2);
    const types = new Set(fileResults.map((r) => r.type));
    expect(types).toContain('.tsbuildinfo');
    expect(types).toContain('.eslintcache');
  });

  test('matches file prefixes for rotated logs', async () => {
    vol.fromJSON({
      '/project/npm-debug.log': 'error log',
      '/project/npm-debug.log.0': 'old log',
      '/project/yarn-error.log': 'yarn error',
      '/project/src/index.ts': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    const fileResults = results.filter((r) => r.kind === 'file');
    expect(fileResults).toHaveLength(3);
    expect(fileResults.every((r) => r.kind === 'file')).toBe(true);
  });

  test('matches file suffixes for profiling artifacts', async () => {
    vol.fromJSON({
      '/project/Heap.20240101.heapsnapshot': 'snapshot data',
      '/project/CPU.20240101.cpuprofile': 'profile data',
      '/project/package.tgz': 'archive',
      '/project/src/index.ts': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    const fileResults = results.filter((r) => r.kind === 'file');
    expect(fileResults).toHaveLength(3);
  });

  test('directory results have kind: directory', async () => {
    vol.fromJSON({
      '/project/node_modules/pkg/index.js': '',
      '/project/dist/bundle.js': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.kind === 'directory')).toBe(true);
  });

  test('finds files inside subdirectories during traversal', async () => {
    vol.fromJSON({
      '/project/packages/a/.tsbuildinfo': '{}',
      '/project/packages/b/.tsbuildinfo': '{}',
      '/project/packages/b/node_modules/pkg/index.js': '',
      '/project/src/index.ts': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    const files = results.filter((r) => r.kind === 'file');
    const dirs = results.filter((r) => r.kind === 'directory');
    expect(files).toHaveLength(2);
    expect(dirs).toHaveLength(1);
    expect(dirs[0]!.type).toBe('node_modules');
  });

  test('file results have sizeBytes as null', async () => {
    vol.fromJSON({
      '/project/.tsbuildinfo': '{}',
      '/project/.eslintcache': '',
    });

    const results = [];
    for await (const result of scan('/project')) {
      results.push(result);
    }

    for (const result of results) {
      expect(result.sizeBytes).toBeNull();
    }
  });
});
