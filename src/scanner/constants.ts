/**
 * Target directories to find — JS/TS artifact directories that can be safely deleted.
 * Matches comprehensive JS/TS artifact directories.
 * Case-sensitive exact basename matching.
 */
export const TARGET_DIRS: ReadonlySet<string> = new Set([
  // Package manager cache/store directories
  'node_modules',
  '.npm',
  '.pnpm-store',

  // Framework build outputs
  '.next',
  '.nuxt',
  '.angular',
  '.svelte-kit',
  '.vite',
  '.turbo',
  '.nx',

  // Bundler caches
  '.parcel-cache',
  '.rpt2_cache',
  '.esbuild',
  '.rollup.cache',
  '.cache',

  // Linter/formatter caches
  '.eslintcache',
  '.stylelintcache',

  // Transpiler caches
  '.swc',

  // Coverage and test outputs
  'coverage',
  '.nyc_output',
  '.jest',

  // Documentation/storybook outputs
  'storybook-static',
  'gatsby_cache',
  '.docusaurus',

  // Runtime caches
  'deno_cache',

  // Generic build outputs
  'dist',
  'build',
  '.output',
]);

/**
 * Directories to skip entirely during traversal — system directories and SCM metadata.
 * These are never artifact directories and should not be recursed into.
 */
export const IGNORE_DIRS: ReadonlySet<string> = new Set([
  '.git',
  '.svn',
  '.hg',
  '.nvm',
  '.vscode',
  '.idea',
  'proc',
  'sys',
  'dev',
]);
