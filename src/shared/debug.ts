import { createWriteStream } from 'node:fs';
import type { WriteStream } from 'node:fs';

export interface DebugLogger {
  log(msg: string): void;
  close(): void;
}

function timestamp(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const ms = String(now.getMilliseconds()).padStart(3, '0');
  return `${h}:${m}:${s}.${ms}`;
}

export function createDebugLogger(filePath: string): DebugLogger {
  const stream: WriteStream = createWriteStream(filePath, { flags: 'w' });

  return {
    log(msg: string): void {
      stream.write(`[${timestamp()}] ${msg}\n`);
    },
    close(): void {
      stream.end();
    },
  };
}
