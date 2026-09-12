#!/usr/bin/env node
import meow from 'meow';
import { CLI_VERSION } from '../cli/version.js';
import { printHelpText } from '../cli/help-text.js';
import { ensureGlobalDirs } from '../config/paths.js';
import { dashboardCommand } from '../commands/dashboard.js';
import { browseCommand } from '../commands/browse.js';
import { searchCommand } from '../commands/search.js';
import { installCommand } from '../commands/install.js';
import { removeCommand } from '../commands/remove.js';
import { updateCommand } from '../commands/update.js';
import { importCommand } from '../commands/import.js';
import { exportCommand } from '../commands/export.js';
import { packCommand } from '../commands/pack.js';
import { stackCommand } from '../commands/stack.js';
import { backupCommand } from '../commands/backup.js';
import { doctorCommand } from '../commands/doctor.js';
import { configCommand } from '../commands/config.js';
import { helpCommand } from '../commands/help.js';
import { initCommand } from '../commands/init.js';
import { syncCommand } from '../commands/sync.js';
import { infoCommand } from '../commands/info.js';
import { registryCommand } from '../commands/registry.js';
import { cacheCommand } from '../commands/cache.js';

const preArgs = process.argv.slice(2);
if (preArgs.length === 1 && ['--version', '-v', 'version'].includes(preArgs[0])) {
  console.log(CLI_VERSION);
  process.exit(0);
}
if (preArgs.includes('--help') || preArgs.includes('-h')) {
  printHelpText();
  process.exit(0);
}

const cli = meow(
  `
  Usage
    $ aman <command> [options]
  
  Options
    --global, -g    Target global scope
    --project, -p   Target project scope
    --github        Initialize with GitHub storage
    --local         Initialize with local storage
    --repo          Repository name for GitHub init
    --path          Storage path for local init
    --format        Output format (json, yaml, zip)
    --all           Apply command to all installed items
    --type          Asset type: skill, prompt, or mcp
    --list, -l      List mode (browse)
    --json          JSON output (browse)
    --version, -v   Print CLI version
`,
  {
    importMeta: import.meta,
    autoVersion: false,
    flags: {
      global: { type: 'boolean', shortFlag: 'g' },
      project: { type: 'boolean', shortFlag: 'p' },
      type: { type: 'string' },
      list: { type: 'boolean', shortFlag: 'l' },
      json: { type: 'boolean' },
      github: { type: 'boolean' },
      local: { type: 'boolean' },
      existing: { type: 'boolean' },
      repo: { type: 'string' },
      repository: { type: 'string' },
      path: { type: 'string' },
      format: { type: 'string' },
      all: { type: 'boolean' },
      version: { type: 'string', shortFlag: 'v' },
      yes: { type: 'boolean', shortFlag: 'y' },
      noTty: { type: 'boolean' },
      from: { type: 'string' },
      githubDest: { type: 'boolean' },
    },
  }
);

async function main() {
  const input = cli.input;
  const cmd = input[0];
  const args = input.slice(1);
  const options = cli.flags;

  if (options.global && options.project) {
    throw new Error('Choose --global or --project, not both.');
  }
  // Inspection must not create an environment as a side effect.
  if (cmd && !['doctor', 'help'].includes(cmd)) await ensureGlobalDirs();

  switch (cmd) {
    case undefined:
      if (!process.stdin.isTTY || !process.stdout.isTTY) printHelpText();
      else await dashboardCommand();
      break;
    case 'init':
      await initCommand(args, options);
      break;
    case 'browse':
      await browseCommand(args, options);
      break;
    case 'search':
      await searchCommand(args, options);
      break;
    case 'cache':
      await cacheCommand(args);
      break;
    case 'install':
      await installCommand(args, options);
      break;
    case 'remove':
      await removeCommand(args, options);
      break;
    case 'update':
      await updateCommand(args, options);
      break;
    case 'import':
      await importCommand(args, options);
      break;
    case 'export':
      await exportCommand(args, options);
      break;
    case 'pack':
      await packCommand(args, options);
      break;
    case 'stack':
      await stackCommand(args, options);
      break;
    case 'backup':
      await backupCommand(args, options);
      break;
    case 'doctor':
      await doctorCommand(options);
      break;
    case 'config':
      await configCommand(args);
      break;
    case 'sync':
      await syncCommand(args);
      break;
    case 'info':
      await infoCommand(args);
      break;
    case 'registry':
      await registryCommand(preArgs.slice(1), options);
      break;
    case 'help':
      await helpCommand();
      break;
    default:
      if (cmd) {
        console.error(`Unknown command: ${cmd}`);
      }
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        printHelpText();
        process.exit(cmd ? 1 : 0);
      }
      await helpCommand();
      if (cmd) process.exit(1);
  }
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Error: ${message}`);
  process.exit(1);
});
