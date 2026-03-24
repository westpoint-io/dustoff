import { useEffect, useRef, useTransition } from 'react';
import type { Dispatch } from 'react';
import { resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { scan } from './scanner.js';
import { calculateSizeWithTimeout } from './size.js';
import { createDebugLogger } from '../../shared/debug.js';
import type { DebugLogger } from '../../shared/debug.js';
import type { AppAction } from '../../app/reducer.js';

export function useScan(
  rootPath: string,
  dispatch: Dispatch<AppAction>,
  termWidth?: number,
  exclude?: ReadonlySet<string>,
  targets?: ReadonlySet<string>,
  verbose?: boolean,
): void {
  const [, startTransition] = useTransition();
  const termWidthRef = useRef(termWidth);
  termWidthRef.current = termWidth;

  useEffect(() => {
    const controller = new AbortController();
    let logger: DebugLogger | undefined;

    if (verbose) {
      const logPath = resolve('dustoff-debug.log');
      logger = createDebugLogger(logPath);
      logger.log(`startup: dustoff debug log`);
      logger.log(`startup: args=${JSON.stringify(process.argv.slice(2))}`);
      logger.log(`startup: directory=${rootPath}`);
      logger.log(`startup: node=${process.version} platform=${process.platform} arch=${process.arch}`);
      logger.log(`startup: terminal=${process.stdout.columns}x${process.stdout.rows}`);
      if (exclude) logger.log(`startup: exclude=${[...exclude].join(',')}`);
      if (targets) logger.log(`startup: targets=${[...targets].join(',')}`);
    }

    async function run(): Promise<void> {
      const startMs = Date.now();
      const sizePromises: Promise<void>[] = [];
      let artifactCount = 0;
      let errorsSkipped = 0;

      const generator = scan(rootPath, {
        signal: controller.signal,
        onProgress: (evt) => {
          dispatch({ type: 'DIRS_SCANNED', count: evt.directoriesVisited });
        },
        exclude,
        targets,
        onDebug: logger ? (msg) => logger!.log(msg) : undefined,
      });

      for await (const artifact of generator) {
        artifactCount++;
        startTransition(() => {
          dispatch({ type: 'ARTIFACT_FOUND', artifact });
        });

        const sizeStartMs = Date.now();
        const sizePromise = artifact.kind === 'file'
          ? stat(artifact.path).then((s) => s.size).catch(() => 0)
          : calculateSizeWithTimeout(artifact.path, 30_000).then((s) => s ?? 0);

        const p = sizePromise.then((sizeBytes) => {
          if (!controller.signal.aborted) {
            logger?.log(`size: ${artifact.path} → ${sizeBytes} bytes (${Date.now() - sizeStartMs}ms)`);
            startTransition(() => {
              dispatch({ type: 'SIZE_RESOLVED', path: artifact.path, sizeBytes });
            });
          }
        }).catch((err: unknown) => {
          if (!controller.signal.aborted) {
            errorsSkipped++;
            const reason = err instanceof Error ? err.message : String(err);
            logger?.log(`size: ${artifact.path} → error: ${reason} (${Date.now() - sizeStartMs}ms)`);
            startTransition(() => {
              dispatch({ type: 'SIZE_RESOLVED', path: artifact.path, sizeBytes: 0 });
            });
          }
        });
        sizePromises.push(p);
      }

      await Promise.all(sizePromises);
      const durationMs = Date.now() - startMs;
      logger?.log(`summary: artifacts=${artifactCount} errors=${errorsSkipped} duration=${durationMs}ms`);
      logger?.close();
      dispatch({ type: 'SCAN_COMPLETE', durationMs, termWidth: termWidthRef.current });
    }

    run().catch((err: unknown) => {
      if (err instanceof Error && err.name === 'AbortError') {
        logger?.log('scan: aborted');
      } else {
        const reason = err instanceof Error ? err.stack ?? err.message : String(err);
        logger?.log(`error: scan crashed: ${reason}`);
      }
      logger?.close();
    });

    return () => {
      controller.abort();
      logger?.close();
    };
  }, [rootPath, startTransition, exclude, targets, verbose]);
}
