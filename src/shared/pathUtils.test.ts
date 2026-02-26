import { describe, it, expect } from 'bun:test';
import { findCommonDirPrefix } from './pathUtils.js';

describe('findCommonDirPrefix', () => {
  it('returns empty string for empty array', () => {
    expect(findCommonDirPrefix([])).toBe('');
  });

  it('returns parent dir + "/" for single path', () => {
    expect(findCommonDirPrefix(['/home/user/project/node_modules'])).toBe('/home/user/project/');
  });

  it('returns common prefix for multiple paths with common dir', () => {
    expect(
      findCommonDirPrefix([
        '/home/user/projects/app1/node_modules',
        '/home/user/projects/app2/dist',
        '/home/user/projects/app3/.next',
      ]),
    ).toBe('/home/user/projects/');
  });

  it('returns empty string when no common prefix', () => {
    expect(
      findCommonDirPrefix([
        '/home/user/project/node_modules',
        '/var/lib/something',
      ]),
    ).toBe('/');
  });

  it('returns empty string for paths with no slashes', () => {
    expect(findCommonDirPrefix(['abc', 'def'])).toBe('');
  });

  it('handles paths with identical directories', () => {
    expect(
      findCommonDirPrefix([
        '/home/user/project/node_modules',
        '/home/user/project/dist',
      ]),
    ).toBe('/home/user/project/');
  });
});
