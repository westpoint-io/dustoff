export interface ScanResult {
  path: string;
  type: string;           // basename of the matched dir (e.g. "node_modules", ".next")
  sizeBytes: number | null; // null = not yet calculated
  mtimeMs?: number;       // last-modified time in milliseconds; undefined if stat failed
}

export interface ScanOptions {
  signal?: AbortSignal;   // allow cancellation
  onProgress?: (event: { directoriesVisited: number }) => void; // called on each directory visited
  exclude?: ReadonlySet<string>;  // artifact types to skip (e.g. new Set(['dist']))
  targets?: ReadonlySet<string>;  // override TARGET_DIRS with custom set
  onDebug?: (msg: string) => void; // optional debug logging callback
}

export interface ScanStats {
  directoriesScanned: number;
  artifactsFound: number;
  errorsSkipped: number;
}
