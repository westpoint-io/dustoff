import { homedir } from 'node:os';
import { sep } from 'node:path';

interface SensitiveResult {
  sensitive: boolean;
  reason?: string;
}

const NOT_SENSITIVE: SensitiveResult = { sensitive: false };

/**
 * Detect whether an artifact path is in a sensitive location.
 * Whitelist entries (e.g. .npm, .pnpm) are checked first.
 */
export function isSensitive(artifactPath: string): SensitiveResult {
  const home = homedir();
  if (!home) return NOT_SENSITIVE;

  const normalizedPath = artifactPath.replace(/\\/g, '/');
  const normalizedHome = home.replace(/\\/g, '/');

  // Whitelist: package manager store dirs are always safe
  if (normalizedPath.includes('/.npm/') || normalizedPath.includes('/.pnpm/')) {
    return NOT_SENSITIVE;
  }

  // macOS .app bundles
  if (normalizedPath.includes('.app/Contents/')) {
    return { sensitive: true, reason: 'Inside a macOS application bundle' };
  }

  // Windows special directories
  if (/[/\\]AppData[/\\]/i.test(artifactPath)) {
    return { sensitive: true, reason: 'Inside Windows AppData directory' };
  }
  if (/[/\\]Program Files/i.test(artifactPath)) {
    return { sensitive: true, reason: 'Inside Windows Program Files directory' };
  }

  // Home directory checks
  if (!normalizedPath.startsWith(normalizedHome + '/')) return NOT_SENSITIVE;

  const relPath = normalizedPath.slice(normalizedHome.length + 1);

  // ~/.config/...
  if (relPath.startsWith('.config/')) {
    return { sensitive: true, reason: 'Inside ~/.config \u2014 may break installed applications' };
  }

  // ~/.local/share/...
  if (relPath.startsWith('.local/share/')) {
    return { sensitive: true, reason: 'Inside ~/.local/share \u2014 may contain application data' };
  }

  // ~/.cache/...
  if (relPath.startsWith('.cache/')) {
    return { sensitive: true, reason: 'Inside ~/.cache \u2014 application cache directory' };
  }

  // Hidden home dirs: ~/.<anything>/... (artifact must be NESTED inside, not BE the hidden dir)
  if (relPath.startsWith('.')) {
    const firstSlash = relPath.indexOf('/');
    if (firstSlash !== -1 && relPath.indexOf('/', firstSlash + 1) !== -1) {
      return { sensitive: true, reason: 'Inside a hidden home directory \u2014 may break installed applications' };
    }
  }

  return NOT_SENSITIVE;
}
