import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { isSensitive } from './sensitive.js';

// Mock os.homedir — bun:test mock.module approach
let mockHome = '/home/testuser';

mock.module('node:os', () => ({
  homedir: () => mockHome,
}));

describe('isSensitive', () => {
  it('returns false for normal project paths', () => {
    const result = isSensitive('/home/testuser/projects/webapp/node_modules');
    expect(result.sensitive).toBe(false);
  });

  it('returns true for ~/.config paths', () => {
    const result = isSensitive('/home/testuser/.config/some-app/node_modules');
    expect(result.sensitive).toBe(true);
    expect(result.reason).toContain('~/.config');
  });

  it('returns true for ~/.local/share paths', () => {
    const result = isSensitive('/home/testuser/.local/share/some-app/node_modules');
    expect(result.sensitive).toBe(true);
    expect(result.reason).toContain('~/.local/share');
  });

  it('returns true for ~/.cache paths', () => {
    const result = isSensitive('/home/testuser/.cache/some-tool/node_modules');
    expect(result.sensitive).toBe(true);
    expect(result.reason).toContain('~/.cache');
  });

  it('returns false for .npm whitelist', () => {
    const result = isSensitive('/home/testuser/.npm/_cacache/node_modules');
    expect(result.sensitive).toBe(false);
  });

  it('returns false for .pnpm whitelist', () => {
    const result = isSensitive('/home/testuser/.pnpm/store/node_modules');
    expect(result.sensitive).toBe(false);
  });

  it('returns true for hidden home directories (nested)', () => {
    const result = isSensitive('/home/testuser/.some-tool/lib/node_modules');
    expect(result.sensitive).toBe(true);
    expect(result.reason).toContain('hidden home directory');
  });

  it('returns false for artifact that IS the hidden dir itself', () => {
    // ~/.some-tool/node_modules — only one slash after hidden dir, not nested
    const result = isSensitive('/home/testuser/.some-tool/node_modules');
    expect(result.sensitive).toBe(false);
  });

  it('returns true for macOS .app bundles', () => {
    const result = isSensitive('/Applications/MyApp.app/Contents/Resources/node_modules');
    expect(result.sensitive).toBe(true);
    expect(result.reason).toContain('macOS application bundle');
  });

  it('returns false for paths outside home directory', () => {
    const result = isSensitive('/opt/projects/webapp/node_modules');
    expect(result.sensitive).toBe(false);
  });

  it('returns true for Windows AppData', () => {
    const result = isSensitive('C:\\Users\\test\\AppData\\Local\\node_modules');
    expect(result.sensitive).toBe(true);
    expect(result.reason).toContain('AppData');
  });

  it('returns true for Windows Program Files', () => {
    const result = isSensitive('C:\\Program Files\\app\\node_modules');
    expect(result.sensitive).toBe(true);
    expect(result.reason).toContain('Program Files');
  });
});
