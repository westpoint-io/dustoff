<p align="center">
  <br />
  <pre align="center">
 ____  _   _ ____ _____ ___  _____ _____
|  _ \| | | / ___|_   _/ _ \|  ___|  ___|
| | | | | | \___ \ | || | | | |_  | |_
| |_| | |_| |___) || || |_| |  _| |  _|
|____/ \___/|____/ |_| \___/|_|   |_|
  </pre>
  <br />
  <strong>Find and remove JS/TS build artifacts wasting disk space.</strong>
  <br />
  <br />
  <a href="https://www.npmjs.com/package/dustoff"><img src="https://img.shields.io/npm/v/dustoff.svg" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/dustoff"><img src="https://img.shields.io/npm/dm/dustoff.svg" alt="npm downloads" /></a>
  <a href="https://github.com/westpoint-io/dustoff/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/dustoff.svg" alt="license" /></a>
  <img src="https://img.shields.io/node/v/dustoff.svg" alt="node version" />
</p>

---

<p align="center">
  <img src="docs/demo.gif" alt="dustoff in action" width="800" />
  <br />
  <em>Demo recorded with the Tokyo Night theme. See <a href="#themes">Theme Gallery</a> for all 10 themes.</em>
</p>

---

## What It Does

Scan your filesystem for JavaScript/TypeScript build artifacts — `node_modules`, `.next`, `dist`, `.cache`, `coverage`, `.turbo`, and [30+ more](#detected-artifacts) — then interactively browse, sort, select, and safely delete them to reclaim disk space.

## Quick Start

```bash
npx dustoff
```

That's it. No install required.

### Global Install

```bash
npm install -g dustoff
# or
bun install -g dustoff
```

Requires Node.js >= 18.18.0.

## Features

### Scan & Browse

Real-time BFS scanning with live size calculation. Navigate with vim keys (`hjkl`) or arrow keys.

<p align="center">
  <img src="docs/features/scan-browse.gif" alt="Scanning and browsing artifacts" width="800" />
</p>

### Smart Sorting

Sort by size, path, or age with `1` `2` `3` keys to find the biggest space hogs.

<p align="center">
  <img src="docs/features/sorting.gif" alt="Sorting artifacts by size and age" width="800" />
</p>

### Search & Filter

Press `/` to search — instantly filter artifacts by path.

<p align="center">
  <img src="docs/features/search.gif" alt="Searching and filtering artifacts" width="800" />
</p>

### Detail Panel

Press `Tab` to toggle a side panel with full artifact metadata.

<p align="center">
  <img src="docs/features/detail-panel.gif" alt="Detail panel showing artifact info" width="800" />
</p>

### Safe Deletion

Select artifacts with `Space`, delete with `d`. Confirmation dialog and live progress tracking.

<p align="center">
  <img src="docs/features/deletion.gif" alt="Selecting and deleting artifacts" width="800" />
</p>

### 10 Built-in Themes

Cycle with `t`. Your choice is saved across sessions.

<p align="center">
  <img src="docs/features/themes.gif" alt="Cycling through themes" width="800" />
</p>

## Keybindings

| Key | Action |
|-----|--------|
| `↑` `k` | Move cursor up |
| `↓` `j` | Move cursor down |
| `g` / `G` | Jump to top / bottom |
| `PgUp` `PgDn` | Page up / down |
| `Space` | Toggle selection |
| `a` | Select all |
| `d` | Delete selected |
| `s` | Cycle sort mode |
| `1` `2` `3` | Sort by size / path / age |
| `/` | Search / filter |
| `Tab` | Toggle detail panel |
| `t` | Cycle theme |
| `Esc` | Clear selection |
| `q` | Quit |

## Themes

Cycle through themes with `t` during a session. Your preference is persisted automatically.

<table>
  <tr>
    <td align="center"><img src="docs/themes/ansi-pure.png" width="400" /><br /><strong>ANSI Pure</strong></td>
    <td align="center"><img src="docs/themes/tokyo-night.png" width="400" /><br /><strong>Tokyo Night</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/themes/nord-frost.png" width="400" /><br /><strong>Nord Frost</strong></td>
    <td align="center"><img src="docs/themes/dracula.png" width="400" /><br /><strong>Dracula</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/themes/gruvbox-dark.png" width="400" /><br /><strong>Gruvbox Dark</strong></td>
    <td align="center"><img src="docs/themes/rose-pine.png" width="400" /><br /><strong>Ros&eacute; Pine</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/themes/kanagawa.png" width="400" /><br /><strong>Kanagawa</strong></td>
    <td align="center"><img src="docs/themes/everforest.png" width="400" /><br /><strong>Everforest</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/themes/solarized-dark.png" width="400" /><br /><strong>Solarized Dark</strong></td>
    <td align="center"><img src="docs/themes/cyberpunk-neon.png" width="400" /><br /><strong>Cyberpunk Neon</strong></td>
  </tr>
</table>

## Detected Artifacts

dustoff scans for these directories:

| Category | Directories |
|----------|-------------|
| **Package managers** | `node_modules`, `.npm`, `.pnpm-store` |
| **Framework builds** | `.next`, `.nuxt`, `.angular`, `.svelte-kit`, `.vite`, `.turbo`, `.nx` |
| **Bundler caches** | `.parcel-cache`, `.rpt2_cache`, `.esbuild`, `.rollup.cache`, `.cache` |
| **Linter/formatter** | `.eslintcache`, `.stylelintcache` |
| **Transpiler** | `.swc` |
| **Test/coverage** | `coverage`, `.nyc_output`, `.jest` |
| **Docs/storybook** | `storybook-static`, `gatsby_cache`, `.docusaurus` |
| **Runtime** | `deno_cache` |
| **Build outputs** | `dist`, `build`, `.output` |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
