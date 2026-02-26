#!/usr/bin/env node

// src/cli.tsx
import { render } from "ink";

// src/app/App.tsx
import React3, { useEffect as useEffect3, useState, useMemo } from "react";
import { Box as Box8, Text as Text8, useInput, useApp, useStdout as useStdout2 } from "ink";

// src/features/scanning/useScan.ts
import { useEffect, useTransition } from "react";

// src/features/scanning/scanner.ts
import { opendir, stat } from "node:fs/promises";
import { join } from "node:path";

// src/features/scanning/constants.ts
var TARGET_DIRS = new Set([
  "node_modules",
  ".npm",
  ".pnpm-store",
  ".next",
  ".nuxt",
  ".angular",
  ".svelte-kit",
  ".vite",
  ".turbo",
  ".nx",
  ".parcel-cache",
  ".rpt2_cache",
  ".esbuild",
  ".rollup.cache",
  ".cache",
  ".eslintcache",
  ".stylelintcache",
  ".swc",
  "coverage",
  ".nyc_output",
  ".jest",
  "storybook-static",
  "gatsby_cache",
  ".docusaurus",
  "deno_cache",
  "dist",
  "build",
  ".output"
]);
var IGNORE_DIRS = new Set([
  ".git",
  ".svn",
  ".hg",
  ".nvm",
  ".vscode",
  ".idea",
  "proc",
  "sys",
  "dev"
]);

// src/features/scanning/scanner.ts
function isPermissionError(err) {
  return err instanceof Error && "code" in err && (err.code === "EACCES" || err.code === "EPERM");
}
async function* scan(rootPath, options) {
  const queue = [rootPath];
  let directoriesVisited = 0;
  while (queue.length > 0) {
    if (options?.signal?.aborted) {
      return;
    }
    const currentDir = queue.shift();
    directoriesVisited++;
    options?.onProgress?.({ directoriesVisited });
    let dir;
    try {
      dir = await opendir(currentDir);
    } catch (err) {
      if (isPermissionError(err)) {
        continue;
      }
      throw err;
    }
    try {
      for await (const entry of dir) {
        if (entry.isSymbolicLink()) {
          continue;
        }
        if (!entry.isDirectory()) {
          continue;
        }
        const entryPath = join(currentDir, entry.name);
        if (IGNORE_DIRS.has(entry.name)) {
          continue;
        }
        if (TARGET_DIRS.has(entry.name)) {
          let mtimeMs;
          try {
            const s = await stat(entryPath);
            mtimeMs = s.mtimeMs;
          } catch {}
          yield {
            path: entryPath,
            type: entry.name,
            sizeBytes: null,
            mtimeMs
          };
          continue;
        }
        queue.push(entryPath);
      }
    } finally {
      try {
        await dir.close();
      } catch {}
    }
  }
}

// src/features/scanning/size.ts
import { opendir as opendir2, stat as stat2 } from "node:fs/promises";
import { join as join2 } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
var TIMEOUT_SENTINEL = Symbol("timeout");
async function sumDir(dirPath, seenInodes) {
  let dir;
  try {
    dir = await opendir2(dirPath);
  } catch {
    return 0;
  }
  let total = 0;
  try {
    for await (const entry of dir) {
      if (entry.isSymbolicLink()) {
        continue;
      }
      const entryPath = join2(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += await sumDir(entryPath, seenInodes);
      } else if (entry.isFile()) {
        try {
          const s = await stat2(entryPath);
          const inodeKey = `${s.dev}:${s.ino}`;
          if (seenInodes.has(inodeKey)) {
            continue;
          }
          seenInodes.add(inodeKey);
          if (s.blocks != null && s.blocks > 0) {
            total += s.blocks * 512;
          } else {
            total += s.size;
          }
        } catch {}
      }
    }
  } finally {
    try {
      await dir.close();
    } catch {}
  }
  return total;
}
async function calculateSize(dirPath) {
  const seenInodes = new Set;
  return sumDir(dirPath, seenInodes);
}
async function calculateSizeWithTimeout(dirPath, timeoutMs = 1e4) {
  const timeoutPromise = delay(timeoutMs, TIMEOUT_SENTINEL);
  const result = await Promise.race([calculateSize(dirPath), timeoutPromise]);
  if (result === TIMEOUT_SENTINEL) {
    return null;
  }
  return result;
}

// src/features/scanning/useScan.ts
function useScan(rootPath, dispatch) {
  const [, startTransition] = useTransition();
  useEffect(() => {
    const controller = new AbortController;
    async function run() {
      const startMs = Date.now();
      const sizePromises = [];
      const generator = scan(rootPath, {
        signal: controller.signal,
        onProgress: (evt) => {
          dispatch({ type: "DIRS_SCANNED", count: evt.directoriesVisited });
        }
      });
      for await (const artifact of generator) {
        startTransition(() => {
          dispatch({ type: "ARTIFACT_FOUND", artifact });
        });
        const p = calculateSizeWithTimeout(artifact.path, 30000).then((sizeBytes) => {
          if (!controller.signal.aborted) {
            startTransition(() => {
              dispatch({ type: "SIZE_RESOLVED", path: artifact.path, sizeBytes: sizeBytes ?? 0 });
            });
          }
        }).catch(() => {
          if (!controller.signal.aborted) {
            startTransition(() => {
              dispatch({ type: "SIZE_RESOLVED", path: artifact.path, sizeBytes: 0 });
            });
          }
        });
        sizePromises.push(p);
      }
      await Promise.all(sizePromises);
      dispatch({ type: "SCAN_COMPLETE", durationMs: Date.now() - startMs });
    }
    run().catch(() => {});
    return () => {
      controller.abort();
    };
  }, [rootPath, startTransition]);
}

// src/features/browse/ArtifactTable.tsx
import { useEffect as useEffect2 } from "react";
import { Box as Box2, Text as Text2 } from "ink";

// src/app/reducer.ts
var SORT_CYCLE_ORDER = ["size", "path", "age"];
function naturalDir(key) {
  if (key === "path")
    return "asc";
  return "desc";
}
var initialState = {
  artifacts: [],
  scanStatus: "scanning",
  scanDurationMs: null,
  directoriesScanned: 0,
  cursorIndex: 0,
  sortKey: "size",
  sortDir: "desc",
  detailVisible: false,
  maxSizeBytes: 0,
  selectedPaths: new Set,
  viewMode: "browse",
  deleteProgress: null
};
function reducer(state, action) {
  switch (action.type) {
    case "ARTIFACT_FOUND": {
      return {
        ...state,
        artifacts: [...state.artifacts, action.artifact]
      };
    }
    case "SIZE_RESOLVED": {
      const artifacts = state.artifacts.map((a) => a.path === action.path ? { ...a, sizeBytes: action.sizeBytes } : a);
      const maxSizeBytes = artifacts.reduce((max, a) => a.sizeBytes !== null && a.sizeBytes > max ? a.sizeBytes : max, 0);
      return { ...state, artifacts, maxSizeBytes };
    }
    case "SCAN_COMPLETE": {
      return {
        ...state,
        scanStatus: "complete",
        scanDurationMs: action.durationMs
      };
    }
    case "DIRS_SCANNED": {
      return { ...state, directoriesScanned: action.count };
    }
    case "CURSOR_UP": {
      return {
        ...state,
        cursorIndex: Math.max(0, state.cursorIndex - 1)
      };
    }
    case "CURSOR_DOWN": {
      return {
        ...state,
        cursorIndex: Math.min(state.artifacts.length - 1, state.cursorIndex + 1)
      };
    }
    case "CURSOR_PAGE_UP": {
      return {
        ...state,
        cursorIndex: Math.max(0, state.cursorIndex - action.visibleCount)
      };
    }
    case "CURSOR_PAGE_DOWN": {
      return {
        ...state,
        cursorIndex: Math.min(state.artifacts.length - 1, state.cursorIndex + action.visibleCount)
      };
    }
    case "SORT_CYCLE": {
      const currentIdx = SORT_CYCLE_ORDER.indexOf(state.sortKey);
      const nextKey = SORT_CYCLE_ORDER[(currentIdx + 1) % SORT_CYCLE_ORDER.length];
      return {
        ...state,
        sortKey: nextKey,
        sortDir: naturalDir(nextKey),
        cursorIndex: 0
      };
    }
    case "SORT_TO": {
      if (state.sortKey === action.key) {
        return {
          ...state,
          sortDir: state.sortDir === "asc" ? "desc" : "asc",
          cursorIndex: 0
        };
      }
      return {
        ...state,
        sortKey: action.key,
        sortDir: action.dir,
        cursorIndex: 0
      };
    }
    case "DETAIL_TOGGLE": {
      return { ...state, detailVisible: !state.detailVisible };
    }
    case "TOGGLE_SELECT": {
      const next = new Set(state.selectedPaths);
      if (next.has(action.path)) {
        next.delete(action.path);
      } else {
        next.add(action.path);
      }
      return { ...state, selectedPaths: next };
    }
    case "SELECT_ALL": {
      const allSelected = state.selectedPaths.size === state.artifacts.length;
      if (allSelected) {
        return { ...state, selectedPaths: new Set };
      }
      return {
        ...state,
        selectedPaths: new Set(state.artifacts.map((a) => a.path))
      };
    }
    case "CLEAR_SELECTION": {
      return { ...state, selectedPaths: new Set };
    }
    case "SET_VIEW_MODE": {
      return { ...state, viewMode: action.mode };
    }
    case "DELETE_PROGRESS": {
      return {
        ...state,
        deleteProgress: { done: action.done, total: action.total, freedBytes: action.freedBytes }
      };
    }
    case "DELETE_COMPLETE": {
      const remaining = state.artifacts.filter((a) => !action.deletedPaths.includes(a.path));
      return {
        ...state,
        artifacts: remaining,
        selectedPaths: new Set,
        viewMode: "browse",
        deleteProgress: null,
        cursorIndex: Math.min(state.cursorIndex, Math.max(0, remaining.length - 1))
      };
    }
    default: {
      return state;
    }
  }
}
function getSortedArtifacts(state) {
  const sorted = [...state.artifacts];
  sorted.sort((a, b) => {
    if (state.sortKey === "size") {
      const aSize = a.sizeBytes ?? -1;
      const bSize = b.sizeBytes ?? -1;
      return state.sortDir === "desc" ? bSize - aSize : aSize - bSize;
    }
    if (state.sortKey === "path") {
      const cmp = a.path.localeCompare(b.path);
      return state.sortDir === "asc" ? cmp : -cmp;
    }
    if (state.sortKey === "age") {
      const aMtime = a.mtimeMs ?? 0;
      const bMtime = b.mtimeMs ?? 0;
      return state.sortDir === "desc" ? aMtime - bMtime : bMtime - aMtime;
    }
    return 0;
  });
  return sorted;
}

// src/features/browse/ArtifactRow.tsx
import { memo } from "react";
import { Box, Text } from "ink";

// src/shared/theme.ts
var theme = {
  text: "white",
  subtext1: "white",
  subtext0: "gray",
  overlay0: "gray",
  overlay1: "gray",
  overlay2: "gray",
  surface0: "gray",
  surface1: "gray",
  surface2: "gray",
  red: "red",
  green: "green",
  yellow: "yellow",
  blue: "blue",
  cyan: "cyan",
  magenta: "magenta",
  white: "white",
  peach: "yellow",
  sky: "cyan",
  pink: "magenta",
  flamingo: "magenta",
  rosewater: "white",
  maroon: "red",
  teal: "cyan",
  mauve: "magenta",
  sapphire: "blue",
  lavender: "blue",
  base: "",
  crust: "",
  mantle: ""
};
var accent = theme.yellow;
var cursorBg = theme.yellow;
var headerColor = theme.yellow;
var LOGO = [
  " ____  _   _ ____ _____ ___  _____ _____ ",
  "|  _ \\| | | / ___|_   _/ _ \\|  ___|  ___|",
  "| | | | | | \\___ \\ | || | | | |_  | |_   ",
  "| |_| | |_| |___) || || |_| |  _| |  _|  ",
  "|____/ \\___/|____/ |_| \\___/|_|   |_|    "
];
var logoColors = [theme.white, theme.white, theme.yellow, theme.yellow, theme.red];
var TYPE_W = 14;
var SIZE_W = 10;
var AGE_W = 6;
function sizeColor(bytes) {
  if (bytes === null)
    return theme.overlay0;
  if (bytes < 100 * 1024 * 1024)
    return theme.yellow;
  if (bytes < 1024 * 1024 * 1024)
    return theme.yellow;
  return theme.red;
}
function ageColor(days) {
  if (days < 7)
    return theme.overlay0;
  if (days < 30)
    return theme.yellow;
  if (days < 90)
    return theme.yellow;
  return theme.red;
}
var typeBadgeColor = {
  node_modules: theme.green,
  ".next": theme.yellow,
  ".nuxt": theme.yellow,
  dist: theme.yellow,
  build: theme.yellow,
  ".turbo": theme.magenta,
  ".cache": theme.magenta,
  coverage: theme.red,
  ".parcel-cache": theme.magenta,
  ".svelte-kit": theme.yellow,
  ".output": theme.yellow,
  ".vite": theme.cyan
};

// src/shared/formatters.ts
import prettyBytes from "pretty-bytes";
import { differenceInDays, differenceInHours } from "date-fns";
function formatBytes(bytes) {
  if (bytes === null)
    return "calculating...";
  return prettyBytes(bytes, { maximumFractionDigits: 1 });
}
function formatAge(mtimeMs) {
  if (mtimeMs === undefined)
    return "—";
  const days = differenceInDays(Date.now(), new Date(mtimeMs));
  if (days >= 1)
    return `${days}d`;
  const hours = differenceInHours(Date.now(), new Date(mtimeMs));
  if (hours >= 1)
    return `${hours}h`;
  return "<1h";
}
function ageDays(mtimeMs) {
  if (mtimeMs === undefined)
    return 999;
  return differenceInDays(Date.now(), new Date(mtimeMs));
}

// src/features/browse/ArtifactRow.tsx
import { jsxDEV } from "react/jsx-dev-runtime";
var ArtifactRow = memo(function ArtifactRow2({
  artifact,
  isCursor,
  isSelected,
  rootPath
}) {
  const bg = isCursor ? cursorBg : undefined;
  const cursorFg = "black";
  const fg = isCursor ? cursorFg : theme.text;
  const typeFg = isCursor ? cursorFg : typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeFg = isCursor ? cursorFg : sizeColor(artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageFg = isCursor ? cursorFg : ageColor(days);
  const checkFg = isCursor ? cursorFg : isSelected ? theme.green : theme.overlay0;
  const prefix = rootPath.endsWith("/") ? rootPath : rootPath + "/";
  const displayPath = artifact.path.startsWith(prefix) ? artifact.path.slice(prefix.length) : artifact.path;
  const checkbox = isSelected ? "[x]" : "[ ]";
  return /* @__PURE__ */ jsxDEV(Box, {
    children: [
      /* @__PURE__ */ jsxDEV(Text, {
        backgroundColor: bg,
        color: checkFg,
        children: ` ${checkbox} `
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        backgroundColor: bg,
        color: typeFg,
        children: artifact.type.padEnd(TYPE_W)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        backgroundColor: bg,
        color: fg,
        wrap: "truncate-end",
        children: displayPath
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Box, {
        flexGrow: 1,
        children: /* @__PURE__ */ jsxDEV(Text, {
          backgroundColor: bg,
          children: " "
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        backgroundColor: bg,
        color: sizeFg,
        bold: !isCursor,
        children: formatBytes(artifact.sizeBytes).padStart(SIZE_W)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        backgroundColor: bg,
        color: ageFg,
        children: formatAge(artifact.mtimeMs).padStart(AGE_W)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV(Text, {
        backgroundColor: bg,
        children: " "
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
});

// src/features/browse/useWindow.ts
import { useStdout } from "ink";
function useWindow(items, cursorIndex, reservedRows = 7) {
  const { stdout } = useStdout();
  const rows = stdout?.rows ?? 24;
  const visibleCount = Math.max(1, rows - reservedRows);
  const scrollOffset = Math.max(0, Math.min(cursorIndex - Math.floor(visibleCount / 2), Math.max(0, items.length - visibleCount)));
  return {
    visibleItems: items.slice(scrollOffset, scrollOffset + visibleCount),
    scrollOffset,
    visibleCount
  };
}

// src/features/browse/ArtifactTable.tsx
import { jsxDEV as jsxDEV2 } from "react/jsx-dev-runtime";
var RESERVED_ROWS = 11;
function ArtifactTable({
  state,
  dispatch,
  rootPath,
  onVisibleCountChange
}) {
  const sortedArtifacts = getSortedArtifacts(state);
  const { visibleItems, scrollOffset, visibleCount } = useWindow(sortedArtifacts, state.cursorIndex, RESERVED_ROWS);
  useEffect2(() => {
    onVisibleCountChange?.(visibleCount);
  }, [visibleCount, onVisibleCountChange]);
  const arrow = state.sortDir === "desc" ? "↓" : "↑";
  const sizeLabel = state.sortKey === "size" ? `SIZE ${arrow}` : "SIZE";
  const ageLabel = state.sortKey === "age" ? `AGE ${arrow}` : "AGE";
  return /* @__PURE__ */ jsxDEV2(Box2, {
    flexDirection: "column",
    flexGrow: 1,
    borderStyle: "round",
    borderColor: accent,
    children: [
      /* @__PURE__ */ jsxDEV2(Box2, {
        children: [
          /* @__PURE__ */ jsxDEV2(Text2, {
            color: headerColor,
            bold: true,
            children: [
              "     ",
              "TYPE".padEnd(TYPE_W),
              "PATH"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV2(Box2, {
            flexGrow: 1
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV2(Text2, {
            color: headerColor,
            bold: true,
            children: [
              sizeLabel.padStart(SIZE_W),
              ageLabel.padStart(AGE_W),
              " "
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      visibleItems.map((artifact, i) => {
        const absoluteIndex = scrollOffset + i;
        return /* @__PURE__ */ jsxDEV2(ArtifactRow, {
          artifact,
          isCursor: absoluteIndex === state.cursorIndex,
          isSelected: state.selectedPaths.has(artifact.path),
          rootPath
        }, artifact.path, false, undefined, this);
      }),
      /* @__PURE__ */ jsxDEV2(Box2, {
        flexGrow: 1
      }, undefined, false, undefined, this),
      state.artifacts.length === 0 && /* @__PURE__ */ jsxDEV2(Text2, {
        dimColor: true,
        children: "  No artifacts found."
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/features/browse/Header.tsx
import { Box as Box3, Text as Text3 } from "ink";
import { jsxDEV as jsxDEV3 } from "react/jsx-dev-runtime";
var LABEL_W = 13;
var SORT_LABELS = {
  size: "Size",
  path: "Path",
  age: "Age"
};
function Header({
  rootPath,
  totalBytes,
  artifactCount,
  oldestMtimeMs,
  scanStatus,
  sortKey,
  sortDir
}) {
  const reclaimable = totalBytes > 0 ? formatBytes(totalBytes) : "—";
  const oldest = oldestMtimeMs !== undefined ? formatAge(oldestMtimeMs) : "—";
  const displayPath = rootPath.replace(process.env.HOME || "", "~");
  const sortLabel = `${SORT_LABELS[sortKey]} ${sortDir === "desc" ? "↓" : "↑"}`;
  return /* @__PURE__ */ jsxDEV3(Box3, {
    alignItems: "flex-end",
    marginLeft: 1,
    children: [
      /* @__PURE__ */ jsxDEV3(Box3, {
        flexDirection: "column",
        children: [
          /* @__PURE__ */ jsxDEV3(Box3, {
            children: [
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.text,
                bold: true,
                children: "Scan:".padEnd(LABEL_W)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.sky,
                children: displayPath
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3(Box3, {
            children: [
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.text,
                bold: true,
                children: "Artifacts:".padEnd(LABEL_W)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.text,
                children: String(artifactCount)
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3(Box3, {
            children: [
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.text,
                bold: true,
                children: "Reclaimable:".padEnd(LABEL_W)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.yellow,
                bold: true,
                children: reclaimable
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3(Box3, {
            children: [
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.text,
                bold: true,
                children: "Oldest:".padEnd(LABEL_W)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.red,
                children: oldest
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV3(Box3, {
            children: [
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.text,
                bold: true,
                children: "Sort:".padEnd(LABEL_W)
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV3(Text3, {
                color: theme.yellow,
                children: sortLabel
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV3(Box3, {
        flexGrow: 1
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV3(Box3, {
        flexDirection: "column",
        alignItems: "flex-end",
        children: LOGO.map((line, i) => /* @__PURE__ */ jsxDEV3(Text3, {
          color: logoColors[i],
          children: line
        }, `logo-${i}`, false, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/features/browse/DetailPanel.tsx
import { Box as Box4, Text as Text4 } from "ink";
import { basename } from "node:path";
import { jsxDEV as jsxDEV4 } from "react/jsx-dev-runtime";
function DetailPanel({ artifact, width }) {
  const name = basename(artifact.path);
  const innerW = Math.max(1, width - 4);
  const sep = "─".repeat(innerW);
  const typeColor = typeBadgeColor[artifact.type] ?? theme.subtext0;
  const sizeClr = sizeColor(artifact.sizeBytes);
  const days = ageDays(artifact.mtimeMs);
  const ageClr = ageColor(days);
  return /* @__PURE__ */ jsxDEV4(Box4, {
    flexDirection: "column",
    width,
    borderStyle: "round",
    borderColor: theme.surface2,
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: accent,
        bold: true,
        children: name
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: theme.surface0,
        children: sep
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Box4, {
        children: [
          /* @__PURE__ */ jsxDEV4(Text4, {
            color: theme.overlay0,
            children: "Type"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Box4, {
            flexGrow: 1
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Text4, {
            color: typeColor,
            children: artifact.type
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV4(Box4, {
        children: [
          /* @__PURE__ */ jsxDEV4(Text4, {
            color: theme.overlay0,
            children: "Size"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Box4, {
            flexGrow: 1
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Text4, {
            color: sizeClr,
            bold: true,
            children: formatBytes(artifact.sizeBytes)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV4(Box4, {
        children: [
          /* @__PURE__ */ jsxDEV4(Text4, {
            color: theme.overlay0,
            children: "Age"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Box4, {
            flexGrow: 1
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV4(Text4, {
            color: ageClr,
            children: formatAge(artifact.mtimeMs)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: theme.surface0,
        children: sep
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: theme.overlay0,
        children: "Path"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV4(Text4, {
        color: theme.blue,
        wrap: "truncate-end",
        children: artifact.path
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/features/deletion/useDelete.ts
import { useCallback } from "react";
import { rm } from "node:fs/promises";
function useDelete(artifacts, selectedPaths, dispatch) {
  return useCallback(async () => {
    const toDelete = artifacts.filter((a) => selectedPaths.has(a.path));
    if (toDelete.length === 0)
      return;
    dispatch({ type: "SET_VIEW_MODE", mode: "deleting" });
    let freedBytes = 0;
    const deletedPaths = [];
    for (let i = 0;i < toDelete.length; i++) {
      const artifact = toDelete[i];
      dispatch({
        type: "DELETE_PROGRESS",
        done: i,
        total: toDelete.length,
        freedBytes
      });
      try {
        await rm(artifact.path, { recursive: true, force: true });
        freedBytes += artifact.sizeBytes ?? 0;
        deletedPaths.push(artifact.path);
      } catch {}
    }
    dispatch({
      type: "DELETE_PROGRESS",
      done: toDelete.length,
      total: toDelete.length,
      freedBytes
    });
    await new Promise((r) => setTimeout(r, 500));
    dispatch({ type: "DELETE_COMPLETE", deletedPaths });
  }, [artifacts, selectedPaths, dispatch]);
}

// src/features/deletion/DeleteConfirm.tsx
import { Box as Box5, Text as Text5 } from "ink";
import { jsxDEV as jsxDEV5 } from "react/jsx-dev-runtime";
function DeleteConfirm({ selectedCount, selectedBytes }) {
  return /* @__PURE__ */ jsxDEV5(Box5, {
    borderStyle: "single",
    borderColor: theme.red,
    justifyContent: "center",
    paddingX: 2,
    children: [
      /* @__PURE__ */ jsxDEV5(Text5, {
        color: theme.red,
        bold: true,
        children: `  Delete ${selectedCount} artifact${selectedCount > 1 ? "s" : ""}?  `
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(Text5, {
        color: theme.yellow,
        bold: true,
        children: `(${formatBytes(selectedBytes)} will be freed)  `
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(Text5, {
        backgroundColor: "green",
        color: "black",
        children: " Yes "
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(Text5, {
        children: " "
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV5(Text5, {
        backgroundColor: "gray",
        color: "white",
        children: " Cancel "
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/features/deletion/DeleteProgress.tsx
import { Box as Box6, Text as Text6 } from "ink";
import Spinner from "ink-spinner";
import { jsxDEV as jsxDEV6 } from "react/jsx-dev-runtime";
function DeleteProgress({ done, total, freedBytes }) {
  return /* @__PURE__ */ jsxDEV6(Box6, {
    borderStyle: "single",
    borderColor: theme.yellow,
    justifyContent: "center",
    paddingX: 2,
    children: [
      /* @__PURE__ */ jsxDEV6(Spinner, {
        type: "dots"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(Text6, {
        color: theme.red,
        bold: true,
        children: `  Deleting... ${done}/${total}  `
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV6(Text6, {
        color: theme.overlay0,
        children: `${formatBytes(freedBytes)} freed`
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/app/ShortcutBar.tsx
import { Box as Box7, Text as Text7 } from "ink";
import { jsxDEV as jsxDEV7 } from "react/jsx-dev-runtime";
var BASE_SHORTCUTS = [
  { key: "▲▼", desc: "navigate" },
  { key: "␣", desc: "select" },
  { key: "⇥", desc: "detail" },
  { key: "s", desc: "sort" },
  { key: "q", desc: "quit" }
];
var SELECTION_SHORTCUTS = [
  { key: "▲▼", desc: "navigate" },
  { key: "␣", desc: "select" },
  { key: "d", desc: "delete" },
  { key: "a", desc: "select all" },
  { key: "esc", desc: "clear" },
  { key: "q", desc: "quit" }
];
function ShortcutBar({ hasSelection }) {
  const shortcuts = hasSelection ? SELECTION_SHORTCUTS : BASE_SHORTCUTS;
  return /* @__PURE__ */ jsxDEV7(Box7, {
    gap: 1,
    marginLeft: 1,
    children: shortcuts.map(({ key, desc }) => /* @__PURE__ */ jsxDEV7(Box7, {
      children: [
        /* @__PURE__ */ jsxDEV7(Text7, {
          backgroundColor: theme.yellow,
          color: "black",
          bold: true,
          children: ` ${key} `
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV7(Text7, {
          color: theme.text,
          children: ` ${desc}`
        }, undefined, false, undefined, this)
      ]
    }, key, true, undefined, this))
  }, undefined, false, undefined, this);
}

// src/app/App.tsx
import { jsxDEV as jsxDEV8, Fragment } from "react/jsx-dev-runtime";
function App({ rootPath = process.cwd() }) {
  const [state, dispatch] = React3.useReducer(reducer, initialState);
  const { exit } = useApp();
  const { stdout } = useStdout2();
  const [visibleCount, setVisibleCount] = useState(10);
  const [termSize, setTermSize] = useState(() => ({
    width: stdout?.columns ?? 80,
    height: stdout?.rows ?? 24
  }));
  useEffect3(() => {
    if (!stdout)
      return;
    const handleResize = () => {
      setTermSize({
        width: stdout.columns ?? 80,
        height: stdout.rows ?? 24
      });
    };
    stdout.on("resize", handleResize);
    return () => {
      stdout.removeListener("resize", handleResize);
    };
  }, [stdout]);
  useScan(rootPath, dispatch);
  const executeDelete = useDelete(state.artifacts, state.selectedPaths, dispatch);
  const sortedArtifacts = useMemo(() => getSortedArtifacts(state), [state.artifacts, state.sortKey, state.sortDir]);
  useInput((input, key) => {
    if (state.viewMode === "confirm-delete") {
      if (key.return) {
        executeDelete();
      } else if (key.escape || input === "n") {
        dispatch({ type: "SET_VIEW_MODE", mode: "browse" });
      }
      return;
    }
    if (state.viewMode === "deleting")
      return;
    if (key.upArrow) {
      dispatch({ type: "CURSOR_UP" });
    } else if (key.downArrow) {
      dispatch({ type: "CURSOR_DOWN" });
    } else if (key.pageUp) {
      dispatch({ type: "CURSOR_PAGE_UP", visibleCount });
    } else if (key.pageDown) {
      dispatch({ type: "CURSOR_PAGE_DOWN", visibleCount });
    } else if (key.tab) {
      dispatch({ type: "DETAIL_TOGGLE" });
    } else if (input === " ") {
      const artifact = sortedArtifacts[state.cursorIndex];
      if (artifact) {
        dispatch({ type: "TOGGLE_SELECT", path: artifact.path });
      }
    } else if (input === "a") {
      dispatch({ type: "SELECT_ALL" });
    } else if (input === "d") {
      if (state.selectedPaths.size > 0) {
        dispatch({ type: "SET_VIEW_MODE", mode: "confirm-delete" });
      }
    } else if (key.escape) {
      dispatch({ type: "CLEAR_SELECTION" });
    } else if (input === "s") {
      dispatch({ type: "SORT_CYCLE" });
    } else if (input === "1") {
      dispatch({ type: "SORT_TO", key: "size", dir: "desc" });
    } else if (input === "2") {
      dispatch({ type: "SORT_TO", key: "path", dir: "asc" });
    } else if (input === "3") {
      dispatch({ type: "SORT_TO", key: "age", dir: "desc" });
    } else if (input === "q") {
      process.exit(0);
    }
  });
  const totalBytes = state.artifacts.reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);
  const sizedCount = state.artifacts.filter((a) => a.sizeBytes !== null).length;
  let oldestMtimeMs;
  for (const a of state.artifacts) {
    if (a.mtimeMs !== undefined) {
      if (oldestMtimeMs === undefined || a.mtimeMs < oldestMtimeMs) {
        oldestMtimeMs = a.mtimeMs;
      }
    }
  }
  const selectedBytes = state.artifacts.filter((a) => state.selectedPaths.has(a.path)).reduce((sum, a) => sum + (a.sizeBytes ?? 0), 0);
  const detailWidth = state.detailVisible ? Math.max(28, Math.floor(termSize.width * 0.22)) : 0;
  const cursorArtifact = sortedArtifacts[state.cursorIndex];
  const [barTick, setBarTick] = useState(0);
  useEffect3(() => {
    if (state.scanStatus !== "scanning")
      return;
    const id = setInterval(() => setBarTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [state.scanStatus]);
  if (state.scanStatus === "scanning") {
    const BAR_W = 40;
    const BLOCK_W = 8;
    const cycle = (BAR_W - BLOCK_W) * 2;
    const pos = barTick % cycle;
    const offset = pos < BAR_W - BLOCK_W ? pos : cycle - pos;
    const bar = "░".repeat(offset) + "█".repeat(BLOCK_W) + "░".repeat(BAR_W - BLOCK_W - offset);
    return /* @__PURE__ */ jsxDEV8(Box8, {
      flexDirection: "column",
      height: termSize.height,
      paddingX: 1,
      alignItems: "center",
      justifyContent: "center",
      children: [
        /* @__PURE__ */ jsxDEV8(Box8, {
          flexDirection: "column",
          alignItems: "center",
          children: LOGO.map((line, i) => /* @__PURE__ */ jsxDEV8(Text8, {
            color: logoColors[i],
            children: line
          }, `logo-${i}`, false, undefined, this))
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginTop: 1,
          children: /* @__PURE__ */ jsxDEV8(Text8, {
            color: theme.yellow,
            children: bar
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV8(Box8, {
          marginTop: 1,
          flexDirection: "column",
          alignItems: "center",
          children: state.artifacts.length === 0 ? /* @__PURE__ */ jsxDEV8(Text8, {
            color: theme.overlay0,
            children: "Scanning..."
          }, undefined, false, undefined, this) : /* @__PURE__ */ jsxDEV8(Fragment, {
            children: [
              /* @__PURE__ */ jsxDEV8(Text8, {
                color: theme.text,
                children: [
                  `Found `,
                  /* @__PURE__ */ jsxDEV8(Text8, {
                    color: theme.yellow,
                    bold: true,
                    children: String(state.artifacts.length)
                  }, undefined, false, undefined, this),
                  ` artifact${state.artifacts.length > 1 ? "s" : ""}`
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsxDEV8(Text8, {
                color: theme.overlay0,
                children: [
                  `Calculating sizes... ${sizedCount}/${state.artifacts.length} · `,
                  /* @__PURE__ */ jsxDEV8(Text8, {
                    color: theme.yellow,
                    bold: true,
                    children: formatBytes(totalBytes)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV8(Box8, {
    flexDirection: "column",
    height: termSize.height,
    paddingX: 1,
    children: [
      /* @__PURE__ */ jsxDEV8(Header, {
        rootPath,
        totalBytes,
        artifactCount: state.artifacts.length,
        oldestMtimeMs,
        scanStatus: state.scanStatus,
        sortKey: state.sortKey,
        sortDir: state.sortDir
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV8(Box8, {
        flexGrow: 1,
        children: [
          /* @__PURE__ */ jsxDEV8(ArtifactTable, {
            state,
            dispatch,
            rootPath,
            onVisibleCountChange: setVisibleCount
          }, undefined, false, undefined, this),
          state.detailVisible && cursorArtifact !== undefined && /* @__PURE__ */ jsxDEV8(DetailPanel, {
            artifact: cursorArtifact,
            width: detailWidth
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      state.selectedPaths.size > 0 && state.viewMode === "browse" && /* @__PURE__ */ jsxDEV8(Box8, {
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsxDEV8(Box8, {
            children: [
              /* @__PURE__ */ jsxDEV8(Text8, {
                color: theme.blue,
                bold: true,
                children: `${state.selectedPaths.size} selected`
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV8(Text8, {
                color: theme.blue,
                children: ` — ${formatBytes(selectedBytes)} total`
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ jsxDEV8(Box8, {
            children: /* @__PURE__ */ jsxDEV8(Text8, {
              color: theme.overlay0,
              children: [
                /* @__PURE__ */ jsxDEV8(Text8, {
                  color: theme.blue,
                  bold: true,
                  children: " d "
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV8(Text8, {
                  color: theme.overlay0,
                  children: " delete selected "
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV8(Text8, {
                  color: theme.white,
                  bold: true,
                  children: " Esc "
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsxDEV8(Text8, {
                  color: theme.overlay0,
                  children: " clear"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      state.viewMode === "confirm-delete" && /* @__PURE__ */ jsxDEV8(DeleteConfirm, {
        selectedCount: state.selectedPaths.size,
        selectedBytes
      }, undefined, false, undefined, this),
      state.viewMode === "deleting" && state.deleteProgress && /* @__PURE__ */ jsxDEV8(DeleteProgress, {
        done: state.deleteProgress.done,
        total: state.deleteProgress.total,
        freedBytes: state.deleteProgress.freedBytes
      }, undefined, false, undefined, this),
      /* @__PURE__ */ jsxDEV8(ShortcutBar, {
        hasSelection: state.selectedPaths.size > 0
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/cli.tsx
import { jsxDEV as jsxDEV9 } from "react/jsx-dev-runtime";
process.stdout.write("\x1B[2J\x1B[H\x1B[3J");
process.stdout.write("\x1B[?25l");
process.on("exit", () => {
  process.stdout.write("\x1B[?25h");
  process.stdout.write("\x1B[2J\x1B[H\x1B[3J");
});
process.on("SIGINT", () => {
  process.stdout.write("\x1B[?25h");
  process.stdout.write("\x1B[2J\x1B[H\x1B[3J");
  process.exit(0);
});
var originalWrite = process.stdout.write.bind(process.stdout);
var syncStart = "\x1B[?2026h";
var syncEnd = "\x1B[?2026l";
process.stdout.write = (chunk, encodingOrCb, cb) => {
  if (typeof chunk === "string" && chunk.length > 0) {
    const wrapped = syncStart + chunk + syncEnd;
    if (typeof encodingOrCb === "function") {
      return originalWrite(wrapped, encodingOrCb);
    }
    return originalWrite(wrapped, encodingOrCb, cb);
  }
  if (typeof encodingOrCb === "function") {
    return originalWrite(chunk, encodingOrCb);
  }
  return originalWrite(chunk, encodingOrCb, cb);
};
render(/* @__PURE__ */ jsxDEV9(App, {
  rootPath: process.cwd()
}, undefined, false, undefined, this), {
  exitOnCtrlC: true
});
