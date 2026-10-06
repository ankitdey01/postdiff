# Changelog

All notable changes to postdiff are recorded here. Versioning is 0.x while
the CLI surface stabilises; `postdiff` ships as a global install
(`npm i -g postdiff`).

## [0.0.1] — 2026-10-06

First pre-release. All seven CLI commands implemented against the
capability pipeline (diff extraction → significance filter → context →
generation → review → copy-only publish → preference feedback).

### Added

- `postdiff setup` — interactive first-run wizard (name, TypeSafe/Jev key,
  generation provider + model + key with live validation, optional
  voice/reference seed). Keys land in `~/.postdiff/.env`, never in config.
- `postdiff generate [<sha>] [--force] [--blog|--x|--linkedin] [--web]`
  — Jev whole-commit significance gate plus per-file inclusion filter, then
  single-platform drafting via the Vercel AI SDK over a 10-provider registry
  (groq default). `--web` opts into provider-side search where supported.
- `postdiff context [<sha>] [--json]` — generation-ready context inspector
  (no LLM call).
- `postdiff voice` / `reference` / `preferences` — manage the global
  per-platform voice profile, real-post examples, and distilled taste rules
  (cap 20/platform).
- `postdiff review [<sha>] [--accept|--reject]` — draft-first review gate;
  accept-with-edit and reject distill global preference rules via LLM.
- `postdiff publish [--blog|--x|--linkedin] [sha]` — copy-only: accepted,
  hash-matched drafts go to the clipboard; the user pastes anywhere.
- Opt-in `--devtools` run capture (local `.devtools/`, dev-only dependency,
  never published).

### Packaging

- Pre-release tarball excludes dev-only files (`.agents/`, `src/`, `docs/`)
  via `.npmignore`; `@ai-sdk/devtools` is a devDependency.
