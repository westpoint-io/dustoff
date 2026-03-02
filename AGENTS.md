# AGENTS.md

## Commands

```bash
bun test                    # bun test (all tests)
bun test src/features/      # unit + integration tests
bun run build               # bun build → dist/
bun run typecheck           # tsc --noEmit
```

## Verification

Run these before pushing when you touch logic:

- `bun run typecheck` — must pass with zero errors
- `bun test` — all tests must pass
- If dependencies are missing, run `bun install` and retry once. If it still fails, report the error.

## What This Is

Dustoff is a CLI tool (`npx dustoff`) that scans the filesystem for JavaScript/TypeScript build artifacts wasting disk space — `node_modules`, `.next`, `dist`, `.cache`, `coverage`, `.turbo`, `.parcel-cache`, and more. It presents an interactive TUI where users browse, sort, select, and safely delete artifacts to reclaim space.

**Stack:** TypeScript 5.8, Ink 6.8 (React for terminals), React 19, Bun (tooling), bun:test, memfs (test FS mocking), Node.js >= 18.18.0 (runtime)

## Project Structure

```
src/
  index.ts                       Public API entry (exports scanner)
  cli.tsx                        CLI entry — renders <App />
  cli-args.ts                    CLI argument parsing (parseArgs)
  cli-args.test.ts               CLI args tests (bun:test)
  app/
    App.tsx                      Root component: useReducer, useInput, layout
    reducer.ts                   AppState, AppAction, reducer, getSortedArtifacts
    reducer.test.ts              Reducer + pure function tests (bun:test)
    ShortcutBar.tsx              Context-sensitive keyboard shortcut hints
    StatusBar.tsx                View name, scan state, cursor position
  features/
    scanning/
      scanner.ts                 BFS AsyncGenerator scan()
      size.ts                    calculateSize(), calculateSizeWithTimeout()
      constants.ts               TARGET_DIRS and IGNORE_DIRS sets
      types.ts                   ScanResult, ScanOptions, ScanStats interfaces
      useScan.ts                 Bridges scanner AsyncGenerator to dispatch (useTransition)
      scanner.test.ts            Scanner BFS logic (memfs, bun:test)
      size.test.ts               Size calculation (memfs, bun:test)
      inode-dedup.integration.test.ts  Real-filesystem hardlink dedup (bun:test)
    browse/
      ArtifactTable.tsx          Table with column headers + windowed rows
      ArtifactRow.tsx            Memo-wrapped row: checkbox, type, path, size, age
      Header.tsx                 Scan path, count, reclaimable, logo
      DetailPanel.tsx            Right panel: type/size/age/path for cursor item
      SearchBox.tsx              Search input overlay
      TypeFilter.tsx             Type filter selection panel
      GroupRow.tsx                Collapsed/expanded group header row
      SizeBar.tsx                Braille-character size bar visualization
      grouping.ts                Group artifacts by parent directory
      grouping.test.ts           Grouping logic tests (bun:test)
      subdirSizes.ts             Subdirectory size breakdown for detail panel
      useWindow.ts               Virtual scroll viewport for Ink
      browse.test.tsx            Component render tests (ink-testing-library, bun:test)
    deletion/
      useDelete.ts               Hook: encapsulates rm loop + progress dispatch
      DeleteConfirm.tsx          Confirmation dialog component
      DeleteProgress.tsx         Progress bar during deletion
  shared/
    theme.ts                     Legacy re-export shim (use themes.ts / useTheme() instead)
    themes.ts                    Theme palettes, color helpers, LOGO, constants
    ThemeContext.tsx              React context provider for active theme
    formatters.ts                formatBytes, formatAge, ageDays, truncatePath
    artifactMeta.ts              Static metadata (description, regen command) per artifact type
    config.ts                    User config (~/.config/dustoff) read/write
    debug.ts                     File-based debug logger
    pathUtils.ts                 Path utilities (common prefix extraction)
    pathUtils.test.ts            Path utils tests (bun:test)
    sensitive.ts                 Detect sensitive paths (~/.config, AppData, etc.)
    sensitive.test.ts            Sensitive path tests (bun:test)
```

## TypeScript Rules

**Do:**
- Use `interface` for props and object shapes.
- Use `type` for unions, intersections, and utility types.
- Use `unknown` when the type is genuinely unknown, then narrow with type guards.
- Use `as const` for constant objects and literal types.
- Use `ReadonlySet` for immutable sets (see `TARGET_DIRS`, `IGNORE_DIRS`).
- All internal imports use explicit `.js` extensions (Node16 ESM requirement).
- Node built-ins use `node:` protocol: `import { rm } from 'node:fs/promises'`.

**Never:**
- Never use `any`. No exceptions.
- Never use `@ts-nocheck` or `@ts-ignore`. Fix root causes.
- Never use type assertions (`as`) to silence errors. Exception: `as const`.
- Never use `enum` — use union literal types or `as const` objects.

## Testing Rules

- Unit tests use `memfs` to mock the filesystem — never touch the real FS in unit tests.
- Integration tests use `*.integration.test.ts` suffix and may use real filesystem.
- Component tests use `ink-testing-library` with `render()`.
- Reducer tests call `reducer()` directly with crafted state and actions.
- Test files are colocated with their feature: `src/features/scanning/scanner.test.ts` tests `scanner.ts`.
- Test runner is `bun:test` — import from `bun:test` not `vitest`.
- Module mocking uses `mock.module()` from `bun:test` (not `vi.mock()`).

## File Size

- Keep files under ~500 lines. Refactor/split when it improves clarity.
- Components: ~150 lines max.

## Release Guardrails

- Never change version numbers without explicit approval.
- Never run publish or release commands without explicit approval.
- Never patch dependencies without explicit approval.

## Multi-Agent Safety

- Never create, apply, or drop `git stash` unless explicitly requested.
- Never switch branches unless explicitly requested.
- When pushing: may `git pull --rebase` but never discard other agents' work.
- When committing: scope to your changes only. Do not stage unrecognized files.

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/). Scope is optional.

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`
