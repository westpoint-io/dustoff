<p align="center">
  <img src="assets/logo.svg" alt="DUSTOFF" width="500" />
  <br />
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
  <img src="assets/demo.gif" alt="dustoff in action" width="800" />
  <br />
  <em>Demo recorded with the Catppuccin Mocha theme. See <a href="#themes">Theme Gallery</a> for all 10 themes.</em>
</p>

---

## 🧹 What It Does

Scan your filesystem for JavaScript/TypeScript build artifacts — `node_modules`, `.next`, `dist`, `.cache`, `coverage`, `.turbo`, and [30+ more](#detected-artifacts) — then interactively browse, sort, select, and safely delete them to reclaim disk space.

## 🚀 Quick Start

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

### CLI Options

```
dustoff [options]

  -d, --directory <path>    Set scan root directory (default: current directory)
  -E, --exclude <names>     Exclude directories by name, comma-separated
  -t, --target <names>      Override default targets, comma-separated
  -V, --verbose             Write debug log to dustoff-debug.log
  -h, --help                Show this help message
  -v, --version             Show version number
```

Examples:

```bash
dustoff -d ~/projects                        # scan a specific directory
dustoff --exclude "dist,build"               # skip dist and build directories
dustoff --target "node_modules,.next"         # only scan for specific artifacts
```

## ✨ Features

### Smart Sorting

Sort by size, path, or age with `s` to find the biggest space hogs.

<p align="center">
  <img src="assets/features/sorting.gif" alt="Sorting artifacts by size and age" width="800" />
</p>

### Search & Filter

Press `/` to search — instantly filter artifacts by path. Press `f` to open the type filter and show only specific artifact types (e.g. just `node_modules` or `.next`).

<p align="center">
  <img src="assets/features/search_filter.gif" alt="Searching and filtering artifacts" width="800" />
</p>

### Directory Grouping

Press `x` to group artifacts by parent directory. Collapse and expand groups with `Enter` or arrow keys. Select an entire group at once with `Space` on the group header.

<p align="center">
  <img src="assets/features/grouping.gif" alt="Directory grouping" width="800" />
</p>

### Range Multi-Select

Hold `Shift` + arrow keys (or use `J`/`K`) to select a contiguous range of artifacts. `Shift+Space` extends selection from an anchor point.

<p align="center">
  <img src="assets/features/multi_select.gif" alt="Range multi-select" width="800" />
</p>

### Safe Deletion

Select artifacts with `Space`, delete with `d`. Confirmation dialog and live progress tracking.

<p align="center">
  <img src="assets/features/deletion.gif" alt="Selecting and deleting artifacts" width="800" />
</p>

### 10 Built-in Themes

Cycle with `t`. Your choice is saved across sessions.

<p align="center">
  <img src="assets/features/themes.gif" alt="Cycling through themes" width="800" />
</p>

## ⌨️ Keybindings

| Key | Action |
|-----|--------|
| `↑` `k` | Move cursor up |
| `↓` `j` | Move cursor down |
| `Shift+↑` `K` | Range select up |
| `Shift+↓` `J` | Range select down |
| `g` / `G` | Jump to top / bottom |
| `PgUp` `PgDn` | Page up / down |
| `Space` | Toggle selection |
| `Shift+Space` | Extend selection from anchor |
| `a` | Select all |
| `d` | Delete selected |
| `s` | Cycle sort mode |
| `/` | Search / filter |
| `f` | Type filter |
| `x` | Toggle directory grouping |
| `Tab` | Toggle detail panel |
| `+` / `-` | Scroll detail panel |
| `t` | Cycle theme |
| `Esc` | Clear selection |
| `q` | Quit |

## 🎨 Themes

Cycle through themes with `t` during a session. Your preference is persisted automatically.

<table>
  <tr>
    <td align="center"><img src="assets/themes/tokyo-night.png" width="400" /><br /><strong>Tokyo Night</strong></td>
    <td align="center"><img src="assets/themes/nord-frost.png" width="400" /><br /><strong>Nord Frost</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/themes/dracula.png" width="400" /><br /><strong>Dracula</strong></td>
    <td align="center"><img src="assets/themes/gruvbox-dark.png" width="400" /><br /><strong>Gruvbox Dark</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/themes/rose-pine.png" width="400" /><br /><strong>Ros&eacute; Pine</strong></td>
    <td align="center"><img src="assets/themes/kanagawa.png" width="400" /><br /><strong>Kanagawa</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/themes/everforest.png" width="400" /><br /><strong>Everforest</strong></td>
    <td align="center"><img src="assets/themes/solarized-dark.png" width="400" /><br /><strong>Solarized Dark</strong></td>
  </tr>
  <tr>
    <td align="center"><img src="assets/themes/cyberpunk-neon.png" width="400" /><br /><strong>Cyberpunk Neon</strong></td>
    <td align="center"><img src="assets/themes/catppuccin-mocha.png" width="400" /><br /><strong>Catppuccin Mocha</strong></td>
  </tr>
</table>

## 🔍 Detected Artifacts

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

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
