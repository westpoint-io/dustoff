// Catppuccin Mocha palette — full palette from mockup
export const theme = {
  // Backgrounds
  crust:    '#11111b',
  mantle:   '#181825',
  base:     '#1e1e2e',
  surface0: '#313244',
  surface1: '#45475a',
  surface2: '#585b70',
  overlay0: '#6c7086',
  overlay1: '#7f849c',
  overlay2: '#9399b2',
  // Text
  text:     '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  // Accents
  rosewater:'#f5e0dc',
  flamingo: '#f2cdcd',
  pink:     '#f5c2e7',
  mauve:    '#cba6f7',
  red:      '#f38ba8',
  maroon:   '#eba0ac',
  peach:    '#fab387',
  yellow:   '#f9e2af',
  green:    '#a6e3a1',
  teal:     '#94e2d5',
  sky:      '#89dceb',
  sapphire: '#74c7ec',
  blue:     '#89b4fa',
  lavender: '#b4befe',
} as const;

/**
 * Returns the color for a given byte count based on size tier.
 * null = still calculating (muted); < 100MB = yellow; < 1GB = peach; >= 1GB = red
 */
export function sizeColor(bytes: number | null): string {
  if (bytes === null) return theme.overlay0;
  if (bytes < 100 * 1024 * 1024) return theme.yellow;
  if (bytes < 1024 * 1024 * 1024) return theme.peach;
  return theme.red;
}

/**
 * Returns the color for an age in days since last modified.
 * < 7d = dim/overlay; 7-29d = yellow; 30-89d = peach; >= 90d = red
 */
export function ageColor(days: number): string {
  if (days < 7) return theme.overlay0;
  if (days < 30) return theme.yellow;
  if (days < 90) return theme.peach;
  return theme.red;
}

/**
 * Color-coded badge colors per artifact type.
 */
export const typeBadgeColor: Record<string, string> = {
  'node_modules':   theme.green,
  '.next':          theme.peach,
  '.nuxt':          theme.peach,
  'dist':           theme.yellow,
  'build':          theme.peach,
  '.turbo':         theme.pink,
  '.cache':         theme.flamingo,
  'coverage':       theme.maroon,
  '.parcel-cache':  theme.flamingo,
  '.svelte-kit':    theme.peach,
  '.output':        theme.peach,
  '.vite':          theme.teal,
};
