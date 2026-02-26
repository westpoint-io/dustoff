// Terminal-native theme — uses ANSI color names so the tool
// adapts automatically to whatever terminal theme is active.
export const theme = {
  // Text tiers (uses terminal's default palette)
  text:     'white',
  subtext1: 'white',
  subtext0: 'gray',
  // Dim/muted
  overlay0: 'gray',
  overlay1: 'gray',
  overlay2: 'gray',
  // Surfaces — no hardcoded backgrounds, let the terminal decide
  surface0: 'gray',
  surface1: 'gray',
  surface2: 'gray',
  // Accents
  red:      'red',
  green:    'green',
  yellow:   'yellow',
  blue:     'blue',
  cyan:     'cyan',
  magenta:  'magenta',
  white:    'white',
  // Mapped from Catppuccin names used throughout codebase
  peach:     'yellow',
  sky:       'cyan',
  pink:      'magenta',
  flamingo:  'magenta',
  rosewater: 'white',
  maroon:    'red',
  teal:      'cyan',
  mauve:     'magenta',
  sapphire:  'blue',
  lavender:  'blue',
  // base/crust/mantle — not used as backgroundColor anymore
  base:     '',
  crust:    '',
  mantle:   '',
} as const;

// Accent colors — defined once, used everywhere
export const accent = theme.yellow;
export const cursorBg = theme.yellow;
export const headerColor = theme.yellow;

// FIGlet "standard" logo — approved design
export const LOGO = [
  ' ____  _   _ ____ _____ ___  _____ _____ ',
  '|  _ \\| | | / ___|_   _/ _ \\|  ___|  ___|',
  '| | | | | | \\___ \\ | || | | | |_  | |_   ',
  '| |_| | |_| |___) || || |_| |  _| |  _|  ',
  '|____/ \\___/|____/ |_| \\___/|_|   |_|    ',
];
export const logoColors = [theme.white, theme.white, theme.yellow, theme.yellow, theme.red];

// Column widths — consistent across table header and rows
export const TYPE_W = 14;
export const SIZE_W = 10;
export const AGE_W = 6;

/**
 * Returns the color for a given byte count based on size tier.
 * null = still calculating (muted); < 100MB = yellow; < 1GB = peach; >= 1GB = red
 */
export function sizeColor(bytes: number | null): string {
  if (bytes === null) return theme.overlay0;
  if (bytes < 100 * 1024 * 1024) return theme.yellow;
  if (bytes < 1024 * 1024 * 1024) return theme.yellow;
  return theme.red;
}

/**
 * Returns the color for an age in days since last modified.
 * < 7d = dim/overlay; 7-29d = yellow; 30-89d = peach; >= 90d = red
 */
export function ageColor(days: number): string {
  if (days < 7) return theme.overlay0;
  if (days < 30) return theme.yellow;
  if (days < 90) return theme.yellow;
  return theme.red;
}

/**
 * Color-coded badge colors per artifact type.
 */
export const typeBadgeColor: Record<string, string> = {
  'node_modules':   theme.green,
  '.next':          theme.yellow,
  '.nuxt':          theme.yellow,
  'dist':           theme.yellow,
  'build':          theme.yellow,
  '.turbo':         theme.magenta,
  '.cache':         theme.magenta,
  'coverage':       theme.red,
  '.parcel-cache':  theme.magenta,
  '.svelte-kit':    theme.yellow,
  '.output':        theme.yellow,
  '.vite':          theme.cyan,
};
