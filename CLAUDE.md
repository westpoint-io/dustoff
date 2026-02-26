# AGENTS.md

## Commands

```bash
bun test                    # bun test (all tests)
bun test src/features/      # unit tests only
bun test test/integration/  # integration tests only
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
  features/
    scanning/
      scanner.ts                 BFS AsyncGenerator scan()
      size.ts                    calculateSize(), calculateSizeWithTimeout()
      constants.ts               TARGET_DIRS and IGNORE_DIRS sets
      types.ts                   ScanResult, ScanOptions, ScanStats interfaces
      useScan.ts                 Bridges scanner AsyncGenerator to dispatch (useTransition)
      scanner.test.ts            Scanner BFS logic (memfs, bun:test)
      size.test.ts               Size calculation (memfs, bun:test)
    browse/
      ArtifactTable.tsx          Table with column headers + windowed rows
      ArtifactRow.tsx            Memo-wrapped row: checkbox, type, path, size, age
      Header.tsx                 Scan path, count, reclaimable, logo
      DetailPanel.tsx            Right panel: type/size/age/path for cursor item
      useWindow.ts               Virtual scroll viewport for Ink
      browse.test.tsx            Component render tests (ink-testing-library, bun:test)
    deletion/
      useDelete.ts               Hook: encapsulates rm loop + progress dispatch
      DeleteConfirm.tsx          Confirmation dialog component
      DeleteProgress.tsx         Progress bar during deletion
  shared/
    theme.ts                     Color constants, LOGO, color helper fns
    formatters.ts                formatBytes, formatAge, ageDays, truncatePath
  app/
    App.tsx                      Root component: useReducer, useInput, layout
    reducer.ts                   AppState, AppAction, reducer, getSortedArtifacts
    reducer.test.ts              Reducer + pure function tests (bun:test)
    ShortcutBar.tsx              Context-sensitive keyboard shortcut hints
    StatusBar.tsx                View name, scan state, cursor position
test/
  integration/
    inode-dedup.test.ts          Real-filesystem hardlink dedup (bun:test)
```

## Architecture

Unidirectional data flow with a single `useReducer` at root:

```
cli.tsx
  └── <App rootPath>
        ├── useReducer(reducer, initialState)     (reducer in app/reducer.ts)
        ├── useScan(rootPath, dispatch)            → async scanner → startTransition → dispatch
        ├── useDelete(artifacts, selected, dispatch) → rm loop → dispatch
        ├── useInput(...)                          → keyboard → dispatch
        ├── <Header />                             → display-only
        ├── <ArtifactTable state dispatch />        → useWindow for virtual scroll
        │     └── <ArtifactRow /> × N              → memo(), display-only
        ├── <DetailPanel artifact />               → display-only
        ├── <DeleteConfirm />                      → confirm dialog
        ├── <DeleteProgress />                     → progress bar
        └── <ShortcutBar />                        → display-only
```

Key decisions:
- Reducer extracted to `app/reducer.ts` — state types, actions, reducer, and `getSortedArtifacts` all in one module
- `getSortedArtifacts(state)` memoized with `useMemo` in App, shared with `ArtifactTable`
- `ArtifactRow` is `memo()`-wrapped to avoid re-render on every cursor move
- `useWindow` provides virtual scrolling (Ink has no built-in scroll)
- `useScan` uses `useTransition` to batch scan results without blocking keyboard input
- `useDelete` encapsulates the `rm` loop with progress dispatching
- Three view modes: `'browse'`, `'confirm-delete'`, `'deleting'`

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

## Component Rules

**Components:**
- Use function declarations: `export function MyComponent(props: Props) {}`.
- `memo()` only where measured — currently only `ArtifactRow`.
- One component per file. Name the file the same as the component.
- Named exports exclusively — `export default` only for root `App`.

**State:**
- All app state in the root `useReducer`. No `useState` in leaf components.
- Discriminated union for `AppAction` — exhaustive `switch` in reducer.
- Pure functions for derived state (`getSortedArtifacts`). Never store derived values in state.

**Hooks:**
- Custom hooks must use other hooks internally — otherwise it's just a function.
- Always include cleanup in `useEffect` for subscriptions, timers, AbortControllers.
- Never use `useEffect` to derive state from props/state.

## Testing Rules

- Unit tests use `memfs` to mock the filesystem — never touch the real FS in unit tests.
- Integration tests (`test/integration/`) may use real filesystem.
- Component tests use `ink-testing-library` with `render()`.
- Reducer tests call `reducer()` directly with crafted state and actions.
- Test files are colocated with their feature: `src/features/scanning/scanner.test.ts` tests `scanner.ts`.
- Test runner is `bun:test` — import from `bun:test` not `vitest`.
- Module mocking uses `mock.module()` from `bun:test` (not `vi.mock()`).

## Investigation Standards

- Read source code of relevant dependencies AND all related local code before concluding on bugs.
- Respond with high-confidence answers only. Verify in code — do not guess.
- When a build or test fails, understand the root cause before attempting a fix.

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

```
feat: add artifact type filter
fix: correct pnpm hardlink size counting
test: add reducer state machine tests
refactor: extract virtual scroll hook
chore: update dependencies
docs: add architecture section to README
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`

Do NOT use phase/sprint numbers in commits. Keep messages short and focused on _what changed_.
