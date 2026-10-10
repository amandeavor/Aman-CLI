<p align="center">
  <img src="https://raw.githubusercontent.com/amandeavor/Aman-CLI/main/docs/assets/aman-banner.svg" alt="Aman CLI — Your AI workflows, in one place. Organize. Reuse. Diagnose." width="100%">
</p>

# Aman CLI

**Your AI workflows, in one place.**

Organize reusable skills, prompts, and MCP configuration files. Import existing assets, install versioned copies, and check your Aman environment without changing it.

[![CI](https://github.com/amandeavor/Aman-CLI/actions/workflows/ci.yml/badge.svg)](https://github.com/amandeavor/Aman-CLI/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-43853d)](https://nodejs.org/)
[![MIT license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Start here](#try-it-locally) · [Commands](#everyday-commands) · [Import guide](docs/IMPORT-GUIDE.md) · [Contribute](CONTRIBUTING.md)

## Less searching. More reusing.

When useful instructions live in scattered folders, copying them into the next project becomes another chore. Aman gives those assets a consistent home and records installed versions in `aman.lock`.

| When you need to… | Use Aman to… |
| --- | --- |
| Reuse a useful skill in another project | Publish it to your local registry, then install its explicit version |
| Collect existing instructions and tool configs | Import from supported editors, repositories, or folders |
| Understand a broken Aman environment | Run read-only diagnostics with concrete next steps |
| Separate project assets from personal defaults | Choose `--project` or `--global` explicitly |
| Move your collection between machines | Use optional GitHub storage and explicit push/pull commands |

**Early release.** Install from source below. Once published, the intended global install is `npm install --global @amandeavor/aman-cli` (not live on npm yet — do not treat that command as available today). Aman manages asset files; it does not automatically activate them in every editor, start MCP servers, or replace an AI coding tool. Review imported instructions before using them. No AI subscription or API key is required for the local quickstart.

## Try it locally

Requires **Node.js 22+**, npm, and Git to clone the source. GitHub CLI is optional and only needed for GitHub-backed workflows.

```sh
git clone https://github.com/amandeavor/Aman-CLI.git
cd Aman-CLI
npm ci
npm run build
node dist/bin/aman.js --help
```

No global installation needed. Run this offline example from the cloned repository:

```sh
# Create a project environment in .aman/
node dist/bin/aman.js init --project

# Publish the included skill to your local registry
node dist/bin/aman.js registry publish ./examples/review-checklist --slug @demo/review-checklist --version 1.0.0 --type skill

# Install that exact version into the project
node dist/bin/aman.js install @demo/review-checklist@1.0.0 --project

# Check the result without modifying files
node dist/bin/aman.js doctor --project
```

This creates project files under `.aman/` and a registry under `~/.aman/registry/`. Republishing a version is rejected: use a new version when content changes. The skill is installed as a file; consult your coding tool's instructions to use it.

Want the shorter `aman` command? Run `npm link` from the source directory. This explicitly installs command aliases globally; opening the CLI itself never installs software.

## Everyday commands

| Command | What happens |
| --- | --- |
| `aman init --local` | Initialize personal local storage; no account required |
| `aman init --project` | Initialize `.aman/` in the current directory |
| `aman import cursor --global` | Import supported Cursor assets into personal storage |
| `aman install @scope/name@1.0.0 --project` | Install a known version from the configured registry |
| `aman doctor --project` | Inspect project files and print actionable findings |
| `aman doctor --project --json` | Emit a structured report for scripts or CI |
| `aman browse` | Open the interactive asset browser |
| `aman backup save` | Save a backup using the backup workflow |
| `aman sync push` / `aman sync pull` | Explicitly synchronize configured GitHub storage |
| `aman --help` | Show commands and options |

`--local` chooses a storage mode. `--project` chooses a scope: `init --local` sets up your personal environment; `init --project` sets up the current project.

## Diagnostics you can trust

Doctor reports missing environments, invalid lockfile structures, missing asset content, unreadable metadata, legacy layouts, and local MCP configuration issues. It prints suggestions without migrating files, replacing corrupt configuration, installing dependencies, or printing secret values.

- **Exit 0:** no failed checks; optional-dependency warnings are allowed.
- **Exit 1:** one or more checks failed, or diagnostics could not complete.
- **No lockfile yet:** normal for a new environment; installation creates one.
- **Missing GitHub CLI:** local workflows remain available.

Doctor checks Aman storage, not every editor's native configuration. It does not start servers or verify credentials. Reports contain local filesystem paths; review them before sharing.

## Documentation

- [Quickstart and troubleshooting](QUICK-START.md)
- [Supported import sources](docs/IMPORT-GUIDE.md)
- [Asset format](docs/ASSET-SPEC.md) · [Registry](docs/REGISTRY-SPEC.md) · [Lockfile](docs/LOCKFILE-SPEC.md)
- [Security policy](SECURITY.md) · [Roadmap](ROADMAP.md)
- [Contributing](CONTRIBUTING.md) · [Release notes](RELEASE-NOTES.md)

Found friction? [Open an issue](https://github.com/amandeavor/Aman-CLI/issues) with the command, expected result, and actual result. Remove credentials and private paths from logs. Useful reports and small, tested fixes are welcome.

If Aman helps your workflow, a star helps others discover it.

Made by [Aman Awasthi](https://github.com/amandeavor). Licensed under [MIT](LICENSE).
