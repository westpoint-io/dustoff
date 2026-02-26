#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './ui/app.js';

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

render(<App rootPath={process.cwd()} />, {
  exitOnCtrlC: true,
});
