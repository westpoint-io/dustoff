import { useEffect, useRef, useTransition } from 'react';
import type { Dispatch } from 'react';
import { scan } from './scanner.js';
import { calculateSizeWithTimeout } from './size.js';
import type { AppAction } from '../../app/reducer.js';

export function useScan(
  rootPath: string,
  dispatch: Dispatch<AppAction>,
  termWidth?: number,
  exclude?: ReadonlySet<string>,
  targets?: ReadonlySet<string>,
): void {
  const [, startTransition] = useTransition();
  const termWidthRef = useRef(termWidth);
  termWidthRef.current = termWidth;

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
        exclude,
        targets,
      });

      for await (const artifact of generator) {
        startTransition(() => {
          dispatch({ type: 'ARTIFACT_FOUND', artifact });
        });

        const p = calculateSizeWithTimeout(artifact.path, 30_000).then((sizeBytes) => {
          if (!controller.signal.aborted) {
            startTransition(() => {
              dispatch({ type: 'SIZE_RESOLVED', path: artifact.path, sizeBytes: sizeBytes ?? 0 });
            });
          }
        }).catch(() => {
          if (!controller.signal.aborted) {
            startTransition(() => {
              dispatch({ type: 'SIZE_RESOLVED', path: artifact.path, sizeBytes: 0 });
            });
          }
        });
        sizePromises.push(p);
      }

      await Promise.all(sizePromises);
      dispatch({ type: 'SCAN_COMPLETE', durationMs: Date.now() - startMs, termWidth: termWidthRef.current });
    }

    run().catch(() => {
      // Swallow AbortError
    });

    return () => {
      controller.abort();
    };
  }, [rootPath, startTransition, exclude, targets]);
}
