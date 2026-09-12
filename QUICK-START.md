# Start with one useful skill

Use Node.js 22 or newer. No AI API key or GitHub account is needed for this local workflow.

## Build from source

```sh
git clone https://github.com/amandeavor/Aman-CLI.git
cd Aman-CLI
npm ci
npm run build
node dist/bin/aman.js --help
```

All following commands run from the cloned repository. You can optionally run `npm link` and replace `node dist/bin/aman.js` with `aman`.

## Initialize, publish, install, inspect

```sh
node dist/bin/aman.js init --project
node dist/bin/aman.js registry publish ./examples/review-checklist --slug @demo/review-checklist --version 1.0.0 --type skill
node dist/bin/aman.js install @demo/review-checklist@1.0.0 --project
node dist/bin/aman.js doctor --project
```

The example is a code-review checklist. Publishing stores it locally under `~/.aman/registry/`; installation copies it into the project's `.aman/skills/` and records it in `.aman/aman.lock`. It does not execute the instructions or configure an editor automatically.

The registry rejects a second publication of the same version. If you already published the example, skip publishing and run the install command. When editing the skill, publish a new version.

## Choose where assets live

| Intent | Setup | Subsequent scope |
| --- | --- | --- |
| This project only | `aman init --project` | `--project` |
| Personal local collection | `aman init --local` | `--global` |
| Personal GitHub-backed collection | `aman init --github --repo owner/name` | `--global` |

GitHub storage requires you to install [GitHub CLI](https://cli.github.com/) and authenticate first. Add `--existing` to use an existing repository. Creating or connecting GitHub storage can commit and push changes; use local storage to try Aman without remote changes.

## Import what you already have

```sh
aman import cursor --global
aman import ./path-to-assets --project
```

Initialize the chosen scope first. See the [import guide](docs/IMPORT-GUIDE.md) for formats and supported sources. Review assets before using them in an AI tool.

## Troubleshooting

| Message or situation | Next step |
| --- | --- |
| `aman` is not found | Use `node dist/bin/aman.js` from the clone, or run `npm link` |
| Missing project directory | Run `aman init --project` from the intended project |
| Missing global directory | Run `aman init --local` |
| No lockfile yet | Install or import the first asset; this is normal after setup |
| Corrupt lockfile | Back it up, repair JSON or restore a known-good copy; doctor leaves it untouched |
| GitHub CLI warning | Local use still works; install GitHub CLI only if you need those workflows |
| Invalid or empty MCP local config | Repair `mcp.local.json`; do not paste secret values into issues |
| Script needs a report | Use `aman doctor --project --json`; exit 1 indicates failed checks |

Doctor does not verify server connectivity or credential validity. Reports include local paths, so review them before sharing.
