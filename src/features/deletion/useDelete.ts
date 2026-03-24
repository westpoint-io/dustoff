import { useCallback } from 'react';
import type { Dispatch } from 'react';
import { rm } from 'node:fs/promises';
import type { ScanResult } from '../scanning/types.js';
import type { AppAction } from '../../app/reducer.js';

export function useDelete(
  artifacts: ScanResult[],
  selectedPaths: Set<string>,
  dispatch: Dispatch<AppAction>,
): () => Promise<void> {
  return useCallback(async () => {
    const toDelete = artifacts.filter((a) => selectedPaths.has(a.path));
    if (toDelete.length === 0) return;

    dispatch({ type: 'SET_VIEW_MODE', mode: 'deleting' });

    let freedBytes = 0;
    const deletedPaths: string[] = [];

    for (let i = 0; i < toDelete.length; i++) {
      const artifact = toDelete[i]!;
      dispatch({
        type: 'DELETE_PROGRESS',
        done: i,
        total: toDelete.length,
        freedBytes,
      });

      try {
        await rm(artifact.path, artifact.kind === 'directory'
          ? { recursive: true, force: true }
          : { force: true });
        freedBytes += artifact.sizeBytes ?? 0;
        deletedPaths.push(artifact.path);
      } catch {
        // Skip failed deletions silently
      }
    }

    dispatch({
      type: 'DELETE_PROGRESS',
      done: toDelete.length,
      total: toDelete.length,
      freedBytes,
    });

    await new Promise((r) => setTimeout(r, 500));

    dispatch({ type: 'DELETE_COMPLETE', deletedPaths });
  }, [artifacts, selectedPaths, dispatch]);
}
