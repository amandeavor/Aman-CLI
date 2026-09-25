# Publishing Aman CLI

The package identity is **`@amandeavor/aman-cli`**. Both `aman` and `aman-cli` are command aliases for the same entry point. Neither alias installs another package when opened.

Public installation documentation currently uses source builds. Do not advertise registry installation until the scoped package and intended version have actually been published and tested.

## Verify a release

```sh
npm ci
npm run typecheck
npm test
npm run pack:check
```

Tests build the CLI and exercise isolated setup, diagnostics, and local registry workflows. CI runs on Linux, Windows, and macOS with Node.js 22 and 24.

Review package contents, release notes, and the version before publishing. The package should contain compiled code, the README, its banner, and the license; it must not contain local environments or credentials.

Before the first publish, run `npm pkg fix` (or confirm `package.json` `bin` paths have no leading `./`) so npm does not warn that bin script names need cleaning.

## Maintainer publication

After release review and with the correct npm account authenticated:

```sh
npm publish --access public
```

npm accounts with 2FA require either an interactive one-time password (OTP) at publish time or an automation-scoped access token configured for CI/publish. Do not commit tokens, OTP codes, or `.npmrc` auth lines to this repository.

This is an explicit maintainer action. Repository changes and tagged GitHub releases do not automatically publish to npm.

After publication, test the exact scoped version in a clean directory before documenting an `npm install --global @amandeavor/aman-cli@VERSION` command. Never substitute the unrelated unscoped name.
