/**
 * Target directories to find — JS/TS artifact directories that can be safely deleted.
 * Comprehensive list of JS/TS artifact directories.
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

  // Serverless Framework outputs
  '.serverless',

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

/**
 * Target files to find — individual build artifact files that can be safely deleted.
 * Case-sensitive exact filename matching.
 */
export const TARGET_FILES: ReadonlySet<string> = new Set([
  '.tsbuildinfo',
  '.eslintcache',
  '.stylelintcache',
  '.pnp.cjs',
  '.pnp.loader.mjs',
]);

/**
 * File name prefixes to match — catches rotated log variants like npm-debug.log.0.
 */
export const TARGET_FILE_PREFIXES: readonly string[] = [
  'npm-debug.log',
  'yarn-error.log',
  'yarn-debug.log',
  'pnpm-debug.log',
  '.pnpm-debug.log',
  'lerna-debug.log',
];

/**
 * File extension suffixes to match — profiling and build artifacts.
 */
export const TARGET_FILE_SUFFIXES: readonly string[] = [
  '.heapsnapshot',
  '.cpuprofile',
  '.heapprofile',
  '.tgz',
];
