/**
 * Finds the longest common directory prefix among paths.
 * Returns prefix ending with '/' or '' if no common dir.
 */
export function findCommonDirPrefix(paths: string[]): string {
  if (paths.length === 0) return '';
  if (paths.length === 1) {
    const lastSlash = paths[0]!.lastIndexOf('/');
    return lastSlash >= 0 ? paths[0]!.slice(0, lastSlash + 1) : '';
  }
  const first = paths[0]!;
  let prefixLen = first.length;
  for (let i = 1; i < paths.length; i++) {
    const p = paths[i]!;
    let j = 0;
    const limit = Math.min(prefixLen, p.length);
    while (j < limit && first[j] === p[j]) j++;
    prefixLen = j;
  }
  const prefix = first.slice(0, prefixLen);
  const lastSlash = prefix.lastIndexOf('/');
  return lastSlash >= 0 ? prefix.slice(0, lastSlash + 1) : '';
}
