import { CLI_VERSION } from './version.js';
import { MARKETPLACE_ENABLED } from '../config/features.js';

export function printHelpText(): void {
  const cacheSection = MARKETPLACE_ENABLED
    ? `  cache <cmd>         Marketplace cache status or clear

Cache:
  cache status        Show marketplace cache size and age
  cache clear         Clear marketplace discovery cache`
    : `  cache <cmd>         Discovery cache (coming in a future release)`;

  console.log(`Aman CLI ${CLI_VERSION} — Your AI workflows, in one place.

Start here:
  aman init --local        Set up local storage; no account needed
  aman init --project      Set up .aman in the current project
  aman doctor --project    Inspect project health without changing files

Usage:
  aman <command> [options]

Commands:
  (none)              Open dashboard (interactive terminal required)
  init                Set up local or GitHub-backed storage
  browse              Browse skills, prompts, and MCPs
  search <query>      Search across asset types
  info <name>         View asset details
  install [ref]       Install asset or @scope/name@version from registry
  remove <name>       Remove an installed asset
  update [name]       Update installed assets
  import <source>     Import from GitHub URL, repo, local folder, or AI tool
                    Sources: claude-code, cursor, windsurf, continue,
                      vscode, github-copilot, codex, local-folder,
                      custom-path, aman-environment, antigravity
  export [name]       Export assets (--all, --type skill|prompt|mcp)
  pack <cmd>          Create, inspect, or install packs
  stack <cmd>         Manage workflow stacks
  sync <push|pull>    Sync environment with GitHub
  backup <cmd>        Save, list, restore, or delete backups
  doctor              Read-only health checks with actionable next steps
  config <cmd>        Manage CLI settings
  registry <cmd>      Publish and query the canonical asset registry
  ${cacheSection}
  help                Show this help

Registry:
  registry publish    Publish an immutable asset version
  registry deprecate  Mark a version deprecated (still installable)
  registry list       List published versions for a slug
  registry search     Search published assets
  registry resolve    Show metadata for slug@version

Options:
  --global, -g        Target global scope (~/.aman)
  --project, -p       Target project scope (.aman/)
  --type              Asset type: skill, prompt, or mcp
  --json              Machine-readable diagnostics (doctor) or browse output
  --version, -v       Print CLI version

Doctor:
  aman doctor                 Check your active global environment
  aman doctor --project       Check this project's .aman directory
  aman doctor --project --json Emit a JSON report for scripts
  Exit codes: 0 = no failures (warnings allowed), 1 = failures

Environment:
  AMAN_REGISTRY_BACKEND   Registry adapter: local (default) or github

Documentation:
  https://github.com/amandeavor/aman-cli#readme
`);
}
