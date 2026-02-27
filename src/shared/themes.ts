// Theme palette definitions — 10 built-in themes for Dustoff TUI.
// Each theme provides a complete color set; components access colors via useTheme().

// ---------------------------------------------------------------------------
// ThemePalette interface
// ---------------------------------------------------------------------------

export interface ThemePalette {
  name: string;
  // Text tiers
  text: string;
  subtext0: string;
  overlay0: string;
  // Accent colors
  red: string;
  green: string;
  yellow: string;
  blue: string;
  cyan: string;
  magenta: string;
  white: string;
  // Mapped aliases (Catppuccin-inspired names used throughout codebase)
  peach: string;
  sky: string;
  pink: string;
  flamingo: string;
  rosewater: string;
  maroon: string;
  teal: string;
  mauve: string;
  sapphire: string;
  lavender: string;
  // Accent system
  accent: string;
  cursorBg: string;
  cursorFg: string;
  headerColor: string;
  selectedBg: string;
  // Logo
  logoColors: string[];
  // Type badges
  typeBadgeColor: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Size / Age color helpers — take theme as param for reactivity
// ---------------------------------------------------------------------------

export function sizeColor(t: ThemePalette, bytes: number | null): string {
  if (bytes === null) return t.overlay0;
  if (bytes < 100 * 1024 * 1024) return t.yellow;
  if (bytes < 1024 * 1024 * 1024) return t.peach;
  return t.red;
}

export function ageColor(t: ThemePalette, days: number): string {
  if (days < 7) return t.overlay0;
  if (days < 30) return t.yellow;
  if (days < 90) return t.peach;
  return t.red;
}

// ---------------------------------------------------------------------------
// Column widths — constant across all themes
// ---------------------------------------------------------------------------

export const TYPE_W = 17;
export const SIZE_W = 10;
export const AGE_W = 6;

// ---------------------------------------------------------------------------
// FIGlet "standard" logo
// ---------------------------------------------------------------------------

export const LOGO = [
  ' ____  _   _ ____ _____ ___  _____ _____ ',
  '|  _ \\| | | / ___|_   _/ _ \\|  ___|  ___|',
  '| | | | | | \\___ \\ | || | | | |_  | |_   ',
  '| |_| | |_| |___) || || |_| |  _| |  _|  ',
  '|____/ \\___/|____/ |_| \\___/|_|   |_|    ',
];

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

const cyberpunkNeon: ThemePalette = {
  name: 'Cyberpunk Neon',
  text: '#e2e8f0', subtext0: '#718096', overlay0: '#4a5568',
  red: '#ff0055', green: '#39ff14', yellow: '#ffe600', blue: '#00fff5',
  cyan: '#00fff5', magenta: '#b537f2', white: '#e2e8f0',
  peach: '#ff6b35', sky: '#00fff5', pink: '#ff2e97', flamingo: '#ff2e97',
  rosewater: '#e2e8f0', maroon: '#ff0055', teal: '#00fff5',
  mauve: '#b537f2', sapphire: '#00fff5', lavender: '#00fff5',
  accent: '#00fff5', cursorBg: '#00fff5', cursorFg: '#000000', headerColor: '#ff2e97', selectedBg: '#2d3748',
  logoColors: ['#00fff5', '#00fff5', '#ff2e97', '#ff2e97', '#b537f2'],
  typeBadgeColor: {
    'node_modules': '#39ff14', '.next': '#ff6b35', '.nuxt': '#ff6b35',
    'dist': '#ffe600', 'build': '#ff6b35', '.turbo': '#b537f2',
    '.cache': '#ff2e97', 'coverage': '#ff0055', '.parcel-cache': '#ff2e97',
    '.svelte-kit': '#ff6b35', '.output': '#ff6b35', '.vite': '#00fff5',
  },
};

const tokyoNight: ThemePalette = {
  name: 'Tokyo Night',
  text: '#a9b1d6', subtext0: '#737aa2', overlay0: '#565f89',
  red: '#f7768e', green: '#9ece6a', yellow: '#e0af68', blue: '#7aa2f7',
  cyan: '#7dcfff', magenta: '#bb9af7', white: '#c0caf5',
  peach: '#ff9e64', sky: '#7dcfff', pink: '#bb9af7', flamingo: '#bb9af7',
  rosewater: '#c0caf5', maroon: '#f7768e', teal: '#7dcfff',
  mauve: '#bb9af7', sapphire: '#7aa2f7', lavender: '#7aa2f7',
  accent: '#7aa2f7', cursorBg: '#7aa2f7', cursorFg: '#1a1b26', headerColor: '#bb9af7', selectedBg: '#292e42',
  logoColors: ['#7dcfff', '#7aa2f7', '#7aa2f7', '#bb9af7', '#bb9af7'],
  typeBadgeColor: {
    'node_modules': '#9ece6a', '.next': '#ff9e64', '.nuxt': '#ff9e64',
    'dist': '#e0af68', 'build': '#ff9e64', '.turbo': '#bb9af7',
    '.cache': '#bb9af7', 'coverage': '#f7768e', '.parcel-cache': '#bb9af7',
    '.svelte-kit': '#ff9e64', '.output': '#ff9e64', '.vite': '#7dcfff',
  },
};

const nordFrost: ThemePalette = {
  name: 'Nord Frost',
  text: '#d8dee9', subtext0: '#616e88', overlay0: '#4c566a',
  red: '#bf616a', green: '#a3be8c', yellow: '#ebcb8b', blue: '#81a1c1',
  cyan: '#8fbcbb', magenta: '#b48ead', white: '#eceff4',
  peach: '#d08770', sky: '#8fbcbb', pink: '#b48ead', flamingo: '#b48ead',
  rosewater: '#eceff4', maroon: '#bf616a', teal: '#8fbcbb',
  mauve: '#b48ead', sapphire: '#81a1c1', lavender: '#81a1c1',
  accent: '#88c0d0', cursorBg: '#88c0d0', cursorFg: '#2e3440', headerColor: '#81a1c1', selectedBg: '#3b4252',
  logoColors: ['#eceff4', '#8fbcbb', '#88c0d0', '#81a1c1', '#5e81ac'],
  typeBadgeColor: {
    'node_modules': '#a3be8c', '.next': '#d08770', '.nuxt': '#d08770',
    'dist': '#ebcb8b', 'build': '#d08770', '.turbo': '#b48ead',
    '.cache': '#b48ead', 'coverage': '#bf616a', '.parcel-cache': '#b48ead',
    '.svelte-kit': '#d08770', '.output': '#d08770', '.vite': '#8fbcbb',
  },
};

const dracula: ThemePalette = {
  name: 'Dracula',
  text: '#f8f8f2', subtext0: '#6272a4', overlay0: '#6272a4',
  red: '#ff5555', green: '#50fa7b', yellow: '#f1fa8c', blue: '#bd93f9',
  cyan: '#8be9fd', magenta: '#ff79c6', white: '#f8f8f2',
  peach: '#ffb86c', sky: '#8be9fd', pink: '#ff79c6', flamingo: '#ff79c6',
  rosewater: '#f8f8f2', maroon: '#ff5555', teal: '#8be9fd',
  mauve: '#bd93f9', sapphire: '#bd93f9', lavender: '#bd93f9',
  accent: '#bd93f9', cursorBg: '#bd93f9', cursorFg: '#282a36', headerColor: '#ff79c6', selectedBg: '#44475a',
  logoColors: ['#50fa7b', '#8be9fd', '#bd93f9', '#ff79c6', '#ff5555'],
  typeBadgeColor: {
    'node_modules': '#50fa7b', '.next': '#ffb86c', '.nuxt': '#ffb86c',
    'dist': '#f1fa8c', 'build': '#ffb86c', '.turbo': '#bd93f9',
    '.cache': '#ff79c6', 'coverage': '#ff5555', '.parcel-cache': '#ff79c6',
    '.svelte-kit': '#ffb86c', '.output': '#ffb86c', '.vite': '#8be9fd',
  },
};

const gruvboxDark: ThemePalette = {
  name: 'Gruvbox Dark',
  text: '#ebdbb2', subtext0: '#928374', overlay0: '#665c54',
  red: '#fb4934', green: '#b8bb26', yellow: '#fabd2f', blue: '#83a598',
  cyan: '#8ec07c', magenta: '#d3869b', white: '#fbf1c7',
  peach: '#fe8019', sky: '#8ec07c', pink: '#d3869b', flamingo: '#d3869b',
  rosewater: '#fbf1c7', maroon: '#fb4934', teal: '#8ec07c',
  mauve: '#d3869b', sapphire: '#83a598', lavender: '#83a598',
  accent: '#fe8019', cursorBg: '#fe8019', cursorFg: '#282828', headerColor: '#fabd2f', selectedBg: '#3c3836',
  logoColors: ['#fbf1c7', '#fabd2f', '#fe8019', '#fb4934', '#fb4934'],
  typeBadgeColor: {
    'node_modules': '#b8bb26', '.next': '#fe8019', '.nuxt': '#fe8019',
    'dist': '#fabd2f', 'build': '#fe8019', '.turbo': '#d3869b',
    '.cache': '#d3869b', 'coverage': '#fb4934', '.parcel-cache': '#d3869b',
    '.svelte-kit': '#fe8019', '.output': '#fe8019', '.vite': '#8ec07c',
  },
};

const rosePine: ThemePalette = {
  name: 'Rosé Pine',
  text: '#e0def4', subtext0: '#908caa', overlay0: '#6e6a86',
  red: '#eb6f92', green: '#9ccfd8', yellow: '#f6c177', blue: '#c4a7e7',
  cyan: '#9ccfd8', magenta: '#c4a7e7', white: '#e0def4',
  peach: '#f6c177', sky: '#9ccfd8', pink: '#ebbcba', flamingo: '#ebbcba',
  rosewater: '#e0def4', maroon: '#eb6f92', teal: '#9ccfd8',
  mauve: '#c4a7e7', sapphire: '#c4a7e7', lavender: '#c4a7e7',
  accent: '#c4a7e7', cursorBg: '#c4a7e7', cursorFg: '#191724', headerColor: '#f6c177', selectedBg: '#26233a',
  logoColors: ['#9ccfd8', '#9ccfd8', '#c4a7e7', '#ebbcba', '#eb6f92'],
  typeBadgeColor: {
    'node_modules': '#9ccfd8', '.next': '#f6c177', '.nuxt': '#f6c177',
    'dist': '#f6c177', 'build': '#f6c177', '.turbo': '#c4a7e7',
    '.cache': '#ebbcba', 'coverage': '#eb6f92', '.parcel-cache': '#ebbcba',
    '.svelte-kit': '#f6c177', '.output': '#f6c177', '.vite': '#9ccfd8',
  },
};

const kanagawa: ThemePalette = {
  name: 'Kanagawa',
  text: '#dcd7ba', subtext0: '#727169', overlay0: '#54546d',
  red: '#e82424', green: '#98bb6c', yellow: '#e6c384', blue: '#7e9cd8',
  cyan: '#7fb4ca', magenta: '#957fb8', white: '#c8c093',
  peach: '#ffa066', sky: '#7fb4ca', pink: '#d27e99', flamingo: '#d27e99',
  rosewater: '#c8c093', maroon: '#e82424', teal: '#7fb4ca',
  mauve: '#957fb8', sapphire: '#7e9cd8', lavender: '#7e9cd8',
  accent: '#7e9cd8', cursorBg: '#7e9cd8', cursorFg: '#1f1f28', headerColor: '#957fb8', selectedBg: '#2a2a37',
  logoColors: ['#7fb4ca', '#7e9cd8', '#7e9cd8', '#d27e99', '#d27e99'],
  typeBadgeColor: {
    'node_modules': '#98bb6c', '.next': '#ffa066', '.nuxt': '#ffa066',
    'dist': '#e6c384', 'build': '#ffa066', '.turbo': '#d27e99',
    '.cache': '#d27e99', 'coverage': '#e82424', '.parcel-cache': '#d27e99',
    '.svelte-kit': '#ffa066', '.output': '#ffa066', '.vite': '#7fb4ca',
  },
};

const everforest: ThemePalette = {
  name: 'Everforest',
  text: '#d3c6aa', subtext0: '#9da9a0', overlay0: '#859289',
  red: '#e67e80', green: '#a7c080', yellow: '#dbbc7f', blue: '#7fbbb3',
  cyan: '#83c092', magenta: '#d699b6', white: '#d3c6aa',
  peach: '#e69875', sky: '#83c092', pink: '#d699b6', flamingo: '#d699b6',
  rosewater: '#d3c6aa', maroon: '#e67e80', teal: '#83c092',
  mauve: '#d699b6', sapphire: '#7fbbb3', lavender: '#7fbbb3',
  accent: '#a7c080', cursorBg: '#a7c080', cursorFg: '#2d353b', headerColor: '#a7c080', selectedBg: '#374145',
  logoColors: ['#83c092', '#a7c080', '#a7c080', '#dbbc7f', '#e69875'],
  typeBadgeColor: {
    'node_modules': '#a7c080', '.next': '#e69875', '.nuxt': '#e69875',
    'dist': '#dbbc7f', 'build': '#e69875', '.turbo': '#d699b6',
    '.cache': '#d699b6', 'coverage': '#e67e80', '.parcel-cache': '#d699b6',
    '.svelte-kit': '#e69875', '.output': '#e69875', '.vite': '#83c092',
  },
};

const solarizedDark: ThemePalette = {
  name: 'Solarized Dark',
  text: '#839496', subtext0: '#657b83', overlay0: '#586e75',
  red: '#dc322f', green: '#859900', yellow: '#b58900', blue: '#268bd2',
  cyan: '#2aa198', magenta: '#d33682', white: '#93a1a1',
  peach: '#cb4b16', sky: '#2aa198', pink: '#d33682', flamingo: '#d33682',
  rosewater: '#93a1a1', maroon: '#dc322f', teal: '#2aa198',
  mauve: '#6c71c4', sapphire: '#268bd2', lavender: '#268bd2',
  accent: '#268bd2', cursorBg: '#268bd2', cursorFg: '#002b36', headerColor: '#2aa198', selectedBg: '#073642',
  logoColors: ['#2aa198', '#268bd2', '#268bd2', '#6c71c4', '#6c71c4'],
  typeBadgeColor: {
    'node_modules': '#859900', '.next': '#cb4b16', '.nuxt': '#cb4b16',
    'dist': '#b58900', 'build': '#cb4b16', '.turbo': '#6c71c4',
    '.cache': '#d33682', 'coverage': '#dc322f', '.parcel-cache': '#d33682',
    '.svelte-kit': '#cb4b16', '.output': '#cb4b16', '.vite': '#2aa198',
  },
};

const ansiPure: ThemePalette = {
  name: 'ANSI Pure',
  text: 'white', subtext0: 'gray', overlay0: 'gray',
  red: 'red', green: 'green', yellow: 'yellow', blue: 'blue',
  cyan: 'cyan', magenta: 'magenta', white: 'white',
  peach: 'yellow', sky: 'cyan', pink: 'magenta', flamingo: 'magenta',
  rosewater: 'white', maroon: 'red', teal: 'cyan',
  mauve: 'magenta', sapphire: 'blue', lavender: 'blue',
  accent: 'cyan', cursorBg: 'cyan', cursorFg: 'black', headerColor: 'cyan', selectedBg: 'gray',
  logoColors: ['white', 'white', 'cyan', 'cyan', 'blue'],
  typeBadgeColor: {
    'node_modules': 'green', '.next': 'yellow', '.nuxt': 'yellow',
    'dist': 'yellow', 'build': 'yellow', '.turbo': 'magenta',
    '.cache': 'magenta', 'coverage': 'red', '.parcel-cache': 'magenta',
    '.svelte-kit': 'yellow', '.output': 'yellow', '.vite': 'cyan',
  },
};

// ---------------------------------------------------------------------------
// Exported theme list — order determines cycling
// ---------------------------------------------------------------------------

export const THEMES: readonly ThemePalette[] = [
  ansiPure,
  tokyoNight,
  nordFrost,
  dracula,
  gruvboxDark,
  rosePine,
  kanagawa,
  everforest,
  solarizedDark,
  cyberpunkNeon,
];

export const DEFAULT_THEME_NAME = 'ANSI Pure';

export function getThemeByName(name: string): ThemePalette {
  return THEMES.find((t) => t.name === name) ?? THEMES[0]!;
}
