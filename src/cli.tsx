#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './ui/app.js';

// Enter alternate screen buffer and hide cursor
process.stdout.write('\x1b[?1049h\x1b[?25l');

// Restore cursor and exit alternate screen buffer on process exit
process.on('exit', () => {
  process.stdout.write('\x1b[?25h\x1b[?1049l');
});

// Handle SIGINT (Ctrl+C) to ensure terminal is restored
process.on('SIGINT', () => {
  process.stdout.write('\x1b[?25h\x1b[?1049l');
  process.exit(0);
});

render(<App rootPath={process.cwd()} />, {
  incrementalRendering: true,
  exitOnCtrlC: true,
});
