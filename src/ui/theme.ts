// Catppuccin Mocha palette — verified hex values from /mockups/tui-combined.html
export const theme = {
  // Backgrounds
  crust:    '#11111b',
  mantle:   '#181825',
  base:     '#1e1e2e',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay0: '#6c7086',
  // Text
  text:     '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  // Accents
  blue:     '#89b4fa',
  green:    '#a6e3a1',
  yellow:   '#f9e2af',
  peach:    '#fab387',
  red:      '#f38ba8',
  maroon:   '#eba0ac',
  pink:     '#f5c2e7',
  flamingo: '#f2cdcd',
  mauve:    '#cba6f7',
  teal:     '#94e2d5',
} as const;

/**
 * Returns the color for a given byte count based on size tier.
 * null = still calculating (muted); < 100MB = yellow; < 1GB = peach; >= 1GB = red
 */
export function sizeColor(bytes: number | null): string {
  if (bytes === null) return theme.overlay0;           // "calculating..."
  if (bytes < 100 * 1024 * 1024) return theme.yellow; // < 100MB: yellow
  if (bytes < 1024 * 1024 * 1024) return theme.peach; // < 1GB: peach
  return theme.red;                                    // >= 1GB: red
}

/**
 * Returns the color for an age in days since last modified.
 * < 7d = dim/overlay; 7-29d = yellow; 30-89d = peach; >= 90d = red
 */
export function ageColor(days: number): string {
  if (days < 7) return theme.overlay0;  // < 7 days: dim
  if (days < 30) return theme.yellow;   // 7-29 days: yellow
  if (days < 90) return theme.peach;    // 30-89 days: peach
  return theme.red;                     // 90+ days: red
}

/**
 * Color-coded badge colors per artifact type.
 */
export const typeBadgeColor: Record<string, string> = {
  'node_modules':   theme.green,
  '.next':          theme.peach,
  '.nuxt':          theme.peach,
  'dist':           theme.yellow,
  'build':          theme.yellow,
  '.turbo':         theme.pink,
  '.cache':         theme.flamingo,
  'coverage':       theme.maroon,
  '.parcel-cache':  theme.flamingo,
  '.vite':          theme.teal,
};
