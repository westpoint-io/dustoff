import { describe, test, expect } from 'bun:test';
import { parseCli } from './cli-args.js';

describe('parseCli()', () => {
  const argv = (...args: string[]) => ['node', 'dustoff', ...args];

  test('returns defaults with no arguments', () => {
    const config = parseCli(argv());
    expect(config.directory).toBe(process.cwd());
    expect(config.exclude).toBeNull();
    expect(config.targets).toBeNull();
    expect(config.help).toBe(false);
    expect(config.version).toBe(false);
  });

  test('parses -d / --directory', () => {
    const config = parseCli(argv('-d', '/tmp/projects'));
    expect(config.directory).toBe('/tmp/projects');
  });

  test('parses --directory=value', () => {
    const config = parseCli(argv('--directory=/tmp/projects'));
    expect(config.directory).toBe('/tmp/projects');
  });

  test('parses -E / --exclude with comma-separated values', () => {
    const config = parseCli(argv('-E', 'dist,build'));
    expect(config.exclude).toEqual(new Set(['dist', 'build']));
  });

  test('trims whitespace in exclude values', () => {
    const config = parseCli(argv('--exclude', ' dist , build '));
    expect(config.exclude).toEqual(new Set(['dist', 'build']));
  });

  test('parses -t / --target with comma-separated values', () => {
    const config = parseCli(argv('-t', 'node_modules,.next'));
    expect(config.targets).toEqual(new Set(['node_modules', '.next']));
  });

  test('parses -h / --help', () => {
    const config = parseCli(argv('-h'));
    expect(config.help).toBe(true);
  });

  test('parses -v / --version', () => {
    const config = parseCli(argv('--version'));
    expect(config.version).toBe(true);
  });

  test('parses multiple flags together', () => {
    const config = parseCli(argv('-d', '/tmp', '-E', 'dist', '-t', 'node_modules'));
    expect(config.directory).toBe('/tmp');
    expect(config.exclude).toEqual(new Set(['dist']));
    expect(config.targets).toEqual(new Set(['node_modules']));
  });
});
