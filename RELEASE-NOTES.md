# Release notes

## Unreleased — predictable setup and diagnostics

### Fixed

- `init --project` creates an environment in the current project rather than silently selecting personal storage.
- `registry publish --version` now reaches the publishing command instead of printing the CLI version; registry flags retain their values.
- Doctor no longer migrates flat assets, quarantines corrupt files, or silently normalizes invalid lockfile entries during inspection.
- Reading help, theme settings, and diagnostics no longer eagerly creates configuration files.
- Corrupt configuration is preserved and reported by doctor rather than renamed during startup.
- Missing content, unreadable metadata, and invalid required MCP local JSON are reported.
- Project and global scope flags cannot be combined.
- Typing `q` in the GitHub repository input no longer quits setup.

### Improved

- Local storage is the first setup choice. Missing GitHub CLI produces installation guidance rather than an automatic system-package installation.
- Doctor supports `--project` and `--json`, prints next steps, and uses consistent exit codes in terminals and scripts.
- Help and the README explain storage versus scope and include a working local example.
- Removed the implicit global installer and its incorrect unscoped npm package reference.
- Refreshed the Aman CLI identity with an amber terminal mark and the promise “Your AI workflows, in one place.”
- End-to-end CLI regression tests and a Linux, Windows, and macOS CI matrix cover the supported Node.js versions.

### Compatibility

- Node.js 22+ is now required, matching the runtime needs of the dependency tree. Previously the package advertised Node.js 18.
- Automated workflows should treat doctor exit 1 as a failure. Warnings alone still exit 0.
- Existing interactive dashboards remain available by running `aman` in a terminal.
- This update does not add automatic editor activation or generic diagnostics for every AI tool.
