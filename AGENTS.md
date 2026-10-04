# AGENTS.md — Postdiff

The following instrucions and PRD.md doesnt solely represent the final product. You have complete right to cross question me and suggest me better workaround if needed and valid. Remember one thing, we dont need to build everything from scratch, thats not the point, there will be better already created specific tools and libraries for specific tasks that needs to be done. You should always find and suggest those to me. 
Below is just a rough sketch of the overall product.

`PRD.md` is the single source of truth for product, design flow, and decisions. `README.md` holds the system diagram. Read them before coding. Stack is decided: TypeScript + Node (see `package.json`, `tsconfig.json`, `src/`). Do not re-litigate it; decide only what is still open during build.

## Coding Rule

Don't overcomplicate, instead do smart engineering changes. Dont over engineer stuffs that require simple work.

## Current state

All seven CLI commands implemented: `postdiff context`, `postdiff generate`, `postdiff voice`, `postdiff review`, `postdiff reference`, `postdiff preferences`, `postdiff publish`. Significance (Jev gate + per-file inclusion filter), generation (Groq via Vercel AI SDK, model `openai/gpt-oss-20b` with browser search), review (accept/reject with LLM rule distillation), publish (clipboard copy-only). Test/eval harness deferred (PRD §14.9). Do not assume test/lint/CI commands exist.

## Design flow (from PRD §8)

Capability pipeline, in order: diff/commit extraction → significance filter (Jev gate + per-file inclusion) → context building (commit message + parent + shaped diff + file contents; cached per sha) → generation (voice, reference, preferences loaded fresh per call) → human review → publish (copy-only) → feedback via preference rules.

- Engine is UI-agnostic: interfaces call it, it never depends on them. Simplest terminal-native surface ships first; editor integration later.
- LLM provider: Groq transport (`@ai-sdk/groq`) with `openai/gpt-oss-20b`; swappable via `config.json`. Secrets passed into the engine as inputs, never read inside it.
- Coverage lives where the logic lives (significance, context, generation, voice/feedback).

## Build discipline (non-negotiable workflow)

Build one capability slice at a time, then stop. Verify it live with the user before starting the next slice. Take feedback, improve the slice, then move forward. Never stack untested slices or jump ahead to generation/publish/feedback while the current slice is unverified.

## Non-negotiable product decisions

- Draft-first always: never post/publish without the user seeing and editing the draft first.
- No platform publishing APIs in v1: publish is copy-only (`postdiff publish [--blog|--x|--linkedin] [sha]` copies the accepted draft to the clipboard; the user pastes wherever they like). No intent URLs, no compose tabs, no OAuth — identical on every platform. Gate: latest version `accepted` + hash-matched to the file.
- Significance filter: Jev-only (`is_significant` Noul via `@typesafe-ai/sdk`, `jev-latest`). No heuristic pre-pass. `postdiff generate --force` bypasses. For demos, pre-test the demo diff's Jev verdict.

## Skills

- Vendored in `.agents/skills/`: `typesafe-ai`, `bulk-classify` (classifier.dev), `ai-sdk` (vercel ai sdk skills), plus engineering workflow skills.
- Before using TypeSafe, classifier.dev, or the AI SDK, read the skill's `SKILL.md` and the live docs — do not guess APIs/structures:
  - TypeSafe: https://docs.typesafe.ai/llms.txt
  - classifier.dev: https://classifier.dev/llms.txt
  - AI SDK: https://ai-sdk.dev/llms.txt (never write AI SDK code from memory; verify against installed `node_modules/ai` docs + typechecker)
- Significance uses TypeSafe Jev only — `bulk-classify` is NOT in the significance path (retired heuristic/cascade idea).
- Before using vercel ai sdk, read the skills `ai-sdk` `SKILL.md`.
  - Vercel SDK: https://ai-sdk.dev/llms.txt


## Environment variables

Loaded from `cwd/.env` if not already set. No dotenv dependency — hand-rolled loader in `src/cli/main.ts`.

- `TYPESAFE_API_KEY` — TypeSafe Jev API key for significance judgments
- `GROQ_KEY` — Groq inference API key for generation
- `TRACT_DEVTOOLS` — optional; enables Vercel AI SDK devtools telemetry

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `ankitdey01/postdiff` (uses `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five canonical labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
