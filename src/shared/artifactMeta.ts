/**
 * Static metadata for artifact types — description and regeneration command.
 * Covers all TARGET_DIRS from constants.ts.
 */

interface ArtifactMeta {
  description: string;
  regenerate: string;
}

const META_MAP: Record<string, ArtifactMeta> = {
  // Package manager cache/store directories
  'node_modules': { description: 'Package dependencies', regenerate: 'npm install' },
  '.npm': { description: 'npm download cache', regenerate: 'npm install' },
  '.pnpm-store': { description: 'pnpm content-addressable store', regenerate: 'pnpm install' },

  // Framework build outputs
  '.next': { description: 'Next.js build cache', regenerate: 'next build' },
  '.nuxt': { description: 'Nuxt.js build cache', regenerate: 'nuxt build' },
  '.angular': { description: 'Angular build cache', regenerate: 'ng build' },
  '.svelte-kit': { description: 'SvelteKit build output', regenerate: 'svelte-kit build' },
  '.vite': { description: 'Vite dependency cache', regenerate: 'vite build' },
  '.turbo': { description: 'Turborepo build cache', regenerate: 'turbo run build' },
  '.nx': { description: 'Nx computation cache', regenerate: 'nx run build' },

  // Bundler caches
  '.parcel-cache': { description: 'Parcel bundler cache', regenerate: 'parcel build' },
  '.rpt2_cache': { description: 'Rollup TypeScript cache', regenerate: 'Auto-regenerated on build' },
  '.esbuild': { description: 'esbuild cache', regenerate: 'Auto-regenerated on build' },
  '.rollup.cache': { description: 'Rollup bundle cache', regenerate: 'Auto-regenerated on build' },
  '.cache': { description: 'Build cache', regenerate: 'Auto-regenerated on build' },

  // Linter/formatter caches
  '.eslintcache': { description: 'ESLint result cache', regenerate: 'Auto-regenerated on lint' },
  '.stylelintcache': { description: 'Stylelint result cache', regenerate: 'Auto-regenerated on lint' },

  // Transpiler caches
  '.swc': { description: 'SWC transpiler cache', regenerate: 'Auto-regenerated on build' },

  // Coverage and test outputs
  'coverage': { description: 'Test coverage reports', regenerate: 'npm test -- --coverage' },
  '.nyc_output': { description: 'NYC coverage data', regenerate: 'npm test' },
  '.jest': { description: 'Jest cache', regenerate: 'Auto-regenerated on test' },

  // Documentation/storybook outputs
  'storybook-static': { description: 'Storybook static build', regenerate: 'storybook build' },
  'gatsby_cache': { description: 'Gatsby build cache', regenerate: 'gatsby build' },
  '.docusaurus': { description: 'Docusaurus build cache', regenerate: 'docusaurus build' },

  // Serverless Framework outputs
  '.serverless': { description: 'Serverless Framework deployment artifacts', regenerate: 'serverless package' },

  // Runtime caches
  'deno_cache': { description: 'Deno module cache', regenerate: 'Auto-regenerated on run' },

  // Generic build outputs
  'dist': { description: 'Build output', regenerate: 'npm run build' },
  'build': { description: 'Build output', regenerate: 'npm run build' },
  '.output': { description: 'Build output', regenerate: 'npm run build' },

  // File-based artifacts — build/compiler output
  '.tsbuildinfo': { description: 'TypeScript incremental build info', regenerate: 'tsc --build' },

  // File-based artifacts — Yarn PnP
  '.pnp.cjs': { description: 'Yarn PnP runtime', regenerate: 'yarn install' },
  '.pnp.loader.mjs': { description: 'Yarn PnP ESM loader', regenerate: 'yarn install' },

  // File-based artifacts — package manager logs
  'npm-debug.log': { description: 'npm debug log', regenerate: 'Not regenerated' },
  'yarn-error.log': { description: 'Yarn error log', regenerate: 'Not regenerated' },
  'yarn-debug.log': { description: 'Yarn debug log', regenerate: 'Not regenerated' },
  'pnpm-debug.log': { description: 'pnpm debug log', regenerate: 'Not regenerated' },
  '.pnpm-debug.log': { description: 'pnpm debug log', regenerate: 'Not regenerated' },
  'lerna-debug.log': { description: 'Lerna debug log', regenerate: 'Not regenerated' },

  // File-based artifacts — profiling/diagnostics
  '.heapsnapshot': { description: 'V8 heap snapshot', regenerate: 'Not regenerated' },
  '.cpuprofile': { description: 'V8 CPU profile', regenerate: 'Not regenerated' },
  '.heapprofile': { description: 'V8 heap profile', regenerate: 'Not regenerated' },

  // File-based artifacts — package archives
  '.tgz': { description: 'Package archive', regenerate: 'npm pack' },
};

export function getArtifactMeta(type: string): ArtifactMeta | undefined {
  const direct = META_MAP[type];
  if (direct) return direct;

  // Check prefix matches (rotated logs: "npm-debug.log.0" → "npm-debug.log")
  for (const key of Object.keys(META_MAP)) {
    if (type.startsWith(key) && type !== key) return META_MAP[key];
  }

  // Check suffix matches (profiling: "Heap.20240101.heapsnapshot" → ".heapsnapshot")
  for (const key of Object.keys(META_MAP)) {
    if (key.startsWith('.') && type.endsWith(key)) return META_MAP[key];
  }

  return undefined;
}
