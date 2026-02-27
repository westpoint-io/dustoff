import { parseArgs } from 'node:util';
import { resolve } from 'node:path';

export interface CliConfig {
  directory: string;
  exclude: Set<string> | null;
  targets: Set<string> | null;
  help: boolean;
  version: boolean;
  verbose: boolean;
}

function parseCommaSeparated(value: string): Set<string> {
  return new Set(
    value.split(',').map((s) => s.trim()).filter((s) => s.length > 0),
  );
}

export function parseCli(argv: string[] = process.argv): CliConfig {
  // Strip leading '--' that runners like `npx tsx` pass through
  const rawArgs = argv.slice(2);
  const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;

  const { values } = parseArgs({
    args,
    options: {
      directory: { type: 'string', short: 'd' },
      exclude: { type: 'string', short: 'E' },
      target: { type: 'string', short: 't' },
      help: { type: 'boolean', short: 'h', default: false },
      version: { type: 'boolean', short: 'v', default: false },
      verbose: { type: 'boolean', short: 'V', default: false },
    },
    strict: true,
  });

  return {
    directory: values.directory ? resolve(values.directory) : process.cwd(),
    exclude: values.exclude ? parseCommaSeparated(values.exclude) : null,
    targets: values.target ? parseCommaSeparated(values.target) : null,
    help: values.help ?? false,
    version: values.version ?? false,
    verbose: values.verbose ?? false,
  };
}
