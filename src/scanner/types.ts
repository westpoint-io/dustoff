export interface ScanResult {
  path: string;
  type: string;           // basename of the matched dir (e.g. "node_modules", ".next")
  sizeBytes: number | null; // null = not yet calculated
}

export interface ScanOptions {
  signal?: AbortSignal;   // allow cancellation
}

export interface ScanStats {
  directoriesScanned: number;
  artifactsFound: number;
  errorsSkipped: number;
}
