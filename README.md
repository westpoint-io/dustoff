# dustoff

> Easily find and remove JavaScript/TypeScript build artifacts wasting disk space

```
   _____ __            __
  / ___// /___  ______/ /____  ____
  \__ \/ __/ / / / __  / __ \/ __ \
 ___/ / /_/ /_/ / /_/ / /_/ / / / /
/____/\__/\__,_/\__,_/\____/_/ /_/
```

Scan your filesystem for JavaScript/TypeScript build artifacts — `node_modules`, `.next`, `dist`, `.cache`, `coverage`, `.turbo`, `.parcel-cache` and more — then interactively browse, sort, select, and safely delete them to reclaim disk space.

## Features

- 🔍 **Fast BFS scanning** - Efficiently traverse your filesystem using breadth-first search
- 🎯 **Interactive TUI** - Browse and select artifacts with vim keybindings (hjkl) and arrow keys
- 📊 **Smart sorting** - Sort by size, path, or age to find the biggest space wasters
- 🗑️ **Safe deletion** - Confirmation dialogs and detailed progress tracking before cleanup
- ⚡ **Performance-first** - Minimal dependencies, built with TypeScript and React for terminals
- 🎨 **Beautiful UI** - Colorful terminal interface with real-time feedback

## Installation

### Quick start with `npx` (recommended)

```bash
npx dustoff
```

### Global installation

```bash
npm install -g dustoff
# or
bun install -g dustoff
```

Requires Node.js >= 18.18.0

## Demo

![dustoff in action](./demo.gif)

## Usage

### Basic Controls

| Key | Action |
|-----|--------|
| `↑` / `k` | Move cursor up |
| `↓` / `j` | Move cursor down |
| `Space` | Toggle selection |
| `a` | Select all |
| `d` | Delete selected artifacts |
| `/` | Search/filter artifacts |
| `q` | Quit |

### Examples

Scan the current directory:
```bash
dustoff
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [westpoint](https://github.com/westpoint)
