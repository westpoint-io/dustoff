import { useEffect } from 'react';
import type { Dispatch } from 'react';
import { scan } from '../../scanner/scanner.js';
import { calculateSizeWithTimeout } from '../../scanner/size.js';
import type { AppAction } from '../app.js';

/**
 * Consumes the scanner AsyncGenerator and dispatches TUI state actions.
 *
 * - Runs scan() in a useEffect with AbortController for cleanup
 * - Dispatches ARTIFACT_FOUND for each yielded result
 * - Fires calculateSizeWithTimeout in background for each artifact (no await in loop)
 * - Dispatches SIZE_RESOLVED when size calculation completes
 * - Dispatches DIRS_SCANNED via onProgress callback from scanner
 * - Dispatches SCAN_COMPLETE with duration after loop ends
 * - Aborts on unmount via AbortController cleanup
 */
export function useScan(rootPath: string, dispatch: Dispatch<AppAction>): void {
  useEffect(() => {
    const controller = new AbortController();

    async function run(): Promise<void> {
      const startMs = Date.now();
      const sizePromises: Promise<void>[] = [];

      const generator = scan(rootPath, {
        signal: controller.signal,
        onProgress: (evt) => {
          dispatch({ type: 'DIRS_SCANNED', count: evt.directoriesVisited });
        },
      });

      for await (const artifact of generator) {
        dispatch({ type: 'ARTIFACT_FOUND', artifact });

        // Collect size promises — await them all before SCAN_COMPLETE
        const p = calculateSizeWithTimeout(artifact.path, 30_000).then((sizeBytes) => {
          if (!controller.signal.aborted) {
            dispatch({ type: 'SIZE_RESOLVED', path: artifact.path, sizeBytes: sizeBytes ?? 0 });
          }
        }).catch(() => {
          if (!controller.signal.aborted) {
            dispatch({ type: 'SIZE_RESOLVED', path: artifact.path, sizeBytes: 0 });
          }
        });
        sizePromises.push(p);
      }

      // Wait for all size calculations to finish before completing
      await Promise.all(sizePromises);

      dispatch({ type: 'SCAN_COMPLETE', durationMs: Date.now() - startMs });
    }

    run().catch(() => {
      // Swallow AbortError and other errors from generator cleanup
    });

    return () => {
      controller.abort();
    };
  }, [rootPath]);
}
