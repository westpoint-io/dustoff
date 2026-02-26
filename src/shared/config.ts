import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { DEFAULT_THEME_NAME } from './themes.js';

function configPath(): string {
  const xdg = process.env.XDG_CONFIG_HOME || join(homedir(), '.config');
  return join(xdg, 'dustoff', 'config.json');
}

export function loadThemeName(): string {
  try {
    const raw = readFileSync(configPath(), 'utf-8');
    const config: unknown = JSON.parse(raw);
    if (config && typeof config === 'object' && 'themeName' in config && typeof (config as Record<string, unknown>).themeName === 'string') {
      return (config as Record<string, string>).themeName;
    }
  } catch {
    // File missing or invalid — fall back to default
  }
  return DEFAULT_THEME_NAME;
}

export function saveThemeName(name: string): void {
  try {
    const filePath = configPath();
    mkdirSync(dirname(filePath), { recursive: true });
    let config: Record<string, unknown> = {};
    try {
      const raw = readFileSync(filePath, 'utf-8');
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        config = parsed as Record<string, unknown>;
      }
    } catch {
      // No existing config — start fresh
    }
    config.themeName = name;
    writeFileSync(filePath, JSON.stringify(config, null, 2) + '\n');
  } catch {
    // Silently fail — config persistence is best-effort
  }
}
