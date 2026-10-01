import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

// This file is a Pages API payload, not a Workers cloudflare.config.ts.
const config = JSON.parse(await readFile(new URL('../cloudflare/pages-project.json', import.meta.url), 'utf8'));
const args = process.argv.slice(2);
if (args.some((arg) => !['--apply', '--status'].includes(arg)) || args.length > 1) {
  console.error('Usage: npm run cloudflare:setup -- [--apply | --status] (default: dry run)');
  process.exit(1);
}
const cli = path.resolve(import.meta.dirname, '../node_modules/cf/bin/cf');
const command = args.includes('--status')
  ? ['pages', 'get', config.name]
  : ['pages', 'create', '--body', JSON.stringify(config), ...(args.includes('--apply') ? [] : ['--dry-run'])];
const result = spawnSync(process.execPath, [cli, ...command], { stdio: 'inherit', env: { ...process.env, CF_SEND_TELEMETRY: 'false' } });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
