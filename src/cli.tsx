#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { statSync } from 'node:fs';
import { createRequire } from 'node:module';
import App from './app/App.js';
import { parseCli } from './cli-args.js';

// Parse CLI arguments before any terminal setup
const config = parseCli();

if (config.help) {
  const help = `dustoff — find and remove JS/TS build artifacts wasting disk space

Usage: dustoff [options]

Options:
  -d, --directory <path>    Set scan root directory (default: current directory)
  -E, --exclude <names>     Exclude directories by name, comma-separated
                            Example: --exclude "dist,build"
  -t, --target <names>      Override default targets, comma-separated
                            Example: --target "node_modules,.next"
  -h, --help                Show this help message
  -v, --version             Show version number`;
  console.log(help);
  process.exit(0);
}

if (config.version) {
  const require = createRequire(import.meta.url);
  const pkg = require('../package.json') as { version: string };
  console.log(pkg.version);
  process.exit(0);
}

// Validate directory exists
try {
  const s = statSync(config.directory);
  if (!s.isDirectory()) {
    console.error(`Error: not a directory: ${config.directory}`);
    process.exit(1);
  }
} catch {
  console.error(`Error: directory not found: ${config.directory}`);
  process.exit(1);
}

// Clear screen and scrollback (NOT alternate buffer)
process.stdout.write('\x1b[2J\x1b[H\x1b[3J');

// Hide cursor
process.stdout.write('\x1b[?25l');

// Restore cursor on exit
process.on('exit', () => {
  process.stdout.write('\x1b[?25h');
  // Clear screen on exit for clean terminal
  process.stdout.write('\x1b[2J\x1b[H\x1b[3J');
});

// Handle SIGINT (Ctrl+C) to ensure terminal is restored
process.on('SIGINT', () => {
  process.stdout.write('\x1b[?25h');
  process.stdout.write('\x1b[2J\x1b[H\x1b[3J');
  process.exit(0);
});

// Synchronized terminal updates — prevents flicker in modern terminals
// (iTerm2, Kitty, WezTerm, foot support DECSM 2026)
const originalWrite = process.stdout.write.bind(process.stdout);
const syncStart = '\x1b[?2026h';
const syncEnd = '\x1b[?2026l';

process.stdout.write = ((
  chunk: string | Uint8Array,
  encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
  cb?: (err?: Error | null) => void,
): boolean => {
  if (typeof chunk === 'string' && chunk.length > 0) {
    const wrapped = syncStart + chunk + syncEnd;
    if (typeof encodingOrCb === 'function') {
      return originalWrite(wrapped, encodingOrCb);
    }
    return originalWrite(wrapped, encodingOrCb, cb);
  }
  if (typeof encodingOrCb === 'function') {
    return originalWrite(chunk, encodingOrCb);
  }
  return originalWrite(chunk, encodingOrCb, cb);
}) as typeof process.stdout.write;

render(
  <App
    rootPath={config.directory}
    exclude={config.exclude ?? undefined}
    targets={config.targets ?? undefined}
  />,
  { exitOnCtrlC: true },
);
