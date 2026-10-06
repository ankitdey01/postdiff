# Postdiff — Product Requirements Document

**Status:** Pre-release. This document is the single source of truth for product, design flow, and decisions made so far. Implementation stack is TypeScript + Node (see `package.json`, `tsconfig.json`, `src/`); generation runs on the Vercel AI SDK over a 10-provider registry (`src/core/generation/providers.ts`, groq default), with provider + model swappable via config. CLI binary ships as `postdiff`.

## 1. Name & Positioning

- **Name:** Postdiff — turns meaningful git changes into posts in your voice.
- **Core value prop:** it just knows who you are, how you talk, and what you're building — no re-explaining your identity/context every time you want to post about your work.

## 2. Problem

Developers building in public need to consistently write about their work to build an audience (X, LinkedIn, blog, YouTube), but writing is time-consuming, feels like a context-switch away from actual building, and gets deprioritized. Existing "commit-to-post" tools solve the mechanical trigger (commit → post) but not the identity problem — they either produce generic changelog-style copy or market a vague "AI learns your voice" claim with no concrete mechanism.

## 3. Target User

Solo/indie developers building in public with an existing or growing social presence (example anchor case discussed: an X account with ~10k monthly engagement), who currently write posts manually and inconsistently because of the time/context-switch cost. Social presence and engagement are treated as an increasingly important asset for developers going forward.

## 4. Goals

- Generate content in 4 formats from a single trigger: Blog (word-count controlled), X Post, LinkedIn Post, YouTube video script
- Match the user's actual voice, not a generic AI tone
- Filter for significance — don't generate content for every trivial commit
- Keep a human in the loop before anything is posted (draft-first, non-negotiable)
- Continuously improve voice matching from real usage signal
- Meet developers where they already work — simplest terminal-native surface first, richer editor integration later

## 5. Non-Goals (v1)

- Autonomous publishing without human review — every publish path still ends with the user taking the final action themselves on the platform
- True API-based auto-publish to any platform — no OAuth flows, no paid API tiers, no app review processes in v1. Publishing is browser-based (see Section 7.5)
- Fine-tuned models — v1 uses few-shot prompting against stored voice samples, not model fine-tuning
- Multi-repo/team accounts — v1 is single-user, local-first

## 6. Non-negotiable Product Decisions (decision log)

- **Draft-first, always.** A "Post" button is allowed, but only ever appears after the user has seen and can edit the draft. No silent/autonomous posting, ever.
- **No direct platform APIs for publishing in v1.** Rejected in favor of copy-only after discovering the real cost/friction: X posting via API requires a paid developer tier; LinkedIn write-scopes require app review; neither is worth it when the user can paste. `postdiff publish [--blog|--x|--linkedin] [sha]` copies the accepted draft to the clipboard — identical on every platform, no tabs, no OAuth.
- **Simplest interface first.** The first surface is terminal-native; any editor integration comes later as a thin UI over the same engine — proving the engine works before adding UI complexity.
- **Engine is UI-agnostic.** The content engine never depends on any specific interface. This keeps it portable (future editor plugins, CI actions, etc.) and testable without spinning up an editor.

## 7. Core Features

### 7.0 First-run setup (decided)
- **Trigger:** when `~/.postdiff/config.json` does not exist and the invoked command needs API keys (`generate`, `review`), the CLI runs an interactive setup wizard first — once, before `ensurePostdiffHome()` writes the skeleton. `--help`, `-h`, and every other command never hijack; non-TTY runs skip the wizard and surface normal missing-key errors. The wizard also exists as an explicit `postdiff setup` command for new installs and updates (pre-fills name, "enter to keep current" keys).
- **Prompts (clack `@clack/prompts`):** required `name` (cannot be skipped; signs drafts) → `TYPESAFE_API_KEY` (Jev; link https://console.typesafe.ai/keys) → **generation provider** (clack `select` over the registry: groq, openai, anthropic, google, xai, mistral, deepseek, openrouter, together, fireworks; preselects the configured one) → **model** (clack `select` of that provider's curated list + "custom model id…" free-text escape hatch) → the provider's API key (label + console URL from the registry, e.g. `GROQ_KEY` at console.groq.com/keys), **masked password prompts validated live** with one minimal API call against the selected model; bad key → error + re-prompt loop → optional multi-line `voice.md` paste (clack `multiline`; empty submit skips) and one optional reference example with a platform picker (reference files are per-platform; no `reference.md` concept). Preferences are not asked — they are LLM-distilled.
- **Persistence (all-or-nothing):** nothing hits disk until every step completes; cancel mid-way writes nothing. On completion: restructured `config.json` (`{ version, user: { name }, models: { jevModel, threshold, provider, genModel } }`; legacy flat shape migrates in place), keys into `~/.postdiff/.env` (mode 0600, merge-keeps unrelated keys) — **never into config.json** (§8 rule intact) — and optional voice/reference content into the existing profile files.
- **Key resolution (single point, cli-only):** real env > `cwd/.env` > `~/.postdiff/.env`. `generate`/`review` no longer read `process.env` directly.
- **Publishing:** package ships at 0.x with `bin: postdiff`; install is `npm i -g postdiff` (plain `npm i postdiff` does not put the binary on PATH).

### 7.1 Trigger Layer
- Git post-commit hook
- Manual trigger command (exact syntax TBD)
- Scheduled digest (future, not v1)

### 7.2 Significance Filter (decided)
- **Stage 1 — whole-commit gate:** Single Jev Noul judgment (`is_significant`) over diff + commit-message state via `@typesafe-ai/sdk` (`jev-latest`). No heuristic pre-pass, no generic LLM prompt-parse step.
- State: `{ diff, commitMessage, filesChanged }`. `diff` is shaped before judging: noise paths (`.agents/`, `node_modules/`, `dist/`, lockfiles, `.env`) collapse to filename-only; full filenames still reach Jev via `filesChanged`. Shaping trims input only — it never decides significance. Question: `Is this change worth posting about?` with `true`/`false` criteria pinning "worth posting" vs. trivial/noise.
- Pass (`noul >= threshold`, default 0.5, tunable after dogfooding) → proceed. Fail → stop, log, wait for next trigger.
- `postdiff generate --force` bypasses the judge entirely.
- Timeouts/errors: SDK retry with backoff; on persistent failure log a warning + proceed as if `--force` (force-through). A Jev verdict of fail still stops — only errors force through, so a hung API never blocks real usage or a demo. Jev stays the sole significance decider.
- **Stage 2 — per-file inclusion filter:** After the whole-commit gate passes, a second Jev judgment (`should_include_in_post`) runs over each file's diff section to trim the shaped diff to only files worth including in the post. Runs in batches of 30 files per call; threshold 0.5 with relaxation to 0.1 if all files are excluded. Error force-through: on failure, files are included rather than dropped.
- Rehearsal note: for any live/demo use, test the actual diff being used ahead of time so the Jev verdict is already known, not discovered live.

### 7.3 Voice Profile (decided: global, paired)
- Global per-user, stored under user home (`~/.postdiff/voice/` — e.g. `C:\Users\<you>\.postdiff\voice\` on Windows). No repo-local voice in v1; per-repo tone scoping deferred.
- 4 files, pre-created: `voice.md` (default, always attached) + per-platform `x.md`, `linkedin.md`, `blog.md`. Generation prompt pairs `voice.md + <platform>.md`. No YouTube voice in v1 (YouTube format deferred, see §7.4).
- `voice add --<platform> "<pasted string>"` appends (validated: trim, min-length, exact-dedupe); `voice create --<platform> "<string>"` overwrites; `remove --<platform>` clears the file (never deletes); `view [--<platform>]` shows all at once or one filtered.
- Used as few-shot context in generation prompts. V1 is static files only (add/create/remove/view) — no auto-learning.
- V2 (deferred): auto-improve from three signals, all feeding the same feedback store:
  1. **Implicit** — diff between generated draft and what the user actually edited / or latest commit (if first commit)
  2. **Explicit** — accept/reject on each draft
  3. **Manual** — user re-pastes new samples to recalibrate
- **Open, resolved for v1:** voice profile is global per-user. Per-repo/project tone scoping deferred to post-v1.
- **Cold-start problem, acknowledged but not fully solved:** a brand-new user with no past posts either has to paste several samples upfront (friction) or gets generic output until enough signal accumulates (mediocre first impression). For hackathon/demo purposes, resolved by pre-seeding real posts before demo day — not yet solved for a genuine first-time user in production.

### 7.4 Generation (decided)
- Input: committed diff + commit context + changed file contents + paired voice profile (`voice.md` + platform file) + reference examples + global preference rules + target platform
- One platform per request via `postdiff generate [<sha>] [--force] [--blog|--x|--linkedin]` — no fan-out; each platform drafted separately on demand
- Provider: Vercel AI SDK behind our own `Generator` interface (`SdkGenerator`), with the transport picked from the 10-provider registry (`src/core/generation/providers.ts`; OpenRouter via `@openrouter/ai-sdk-provider`). `models.provider` + `models.genModel` pinned in `~/.postdiff/config.json` (missing `provider` backfills as `groq` — no migration ceremony). The registry declares each provider's env key, keys URL, curated models, and web-search support; heavy SDK packages load lazily so non-generation commands stay fast. Default `groq` + `openai/gpt-oss-20b`. Single-stage: code-assembled prompt carries the full raw context — no prompt-builder model call. Accept-with-edit triggers a separate LLM call to distill a global preference rule (same provider/model as generation).
- Web enrichment: strictly opt-in via `postdiff generate --web` (off by default — no tool attached, no search instruction in the prompt). Per-provider server-side search tool attached as `browser_search`, provider-executed (no extra key — billed to the same key; groq as tokens, anthropic per search). groq: browser search, gpt-oss models only; openai (Responses webSearch), anthropic (webSearch_20250305), google (googleSearch grounding), xai, openrouter (server webSearch; per underlying model): on when supported; mistral/deepseek/together/fireworks: none (their SDKs expose no server search). `--web` on an unsupported provider/model emits a visible warning and drafts without it, and a mid-call web failure retries tool-free once (warned) — never fatal, never a silent pass-through of an unsupported tool.
- Blog format includes a configurable target word count; blog output is Markdown (links as `[text](url)`)

### 7.5 Review
- First surface: drafts shown in the terminal-native interface for review, with persistence to a local file
- Later editor integration: panel with edit/approve/regenerate/reject actions

### 7.6 Publish — copy-only, identical on every platform (decided)
- `postdiff publish [--blog|--x|--linkedin] [sha]` (default HEAD) copies the accepted draft to the clipboard; the user pastes wherever they like. No intent URLs, no compose tabs, no OAuth in v1.
- Gate: the stored draft's latest version must be `accepted` and hash-match the file — edited-after-accept refuses with "review --accept first". Nothing is recorded after copying; drafts + review verdicts already are the audit trail.

## 8. Architecture

Pipeline, in order:

1. Diff/commit extraction from the local git repo
2. Significance filter — Stage 1: whole-commit Jev Noul gate (`--force` bypasses); Stage 2: per-file inclusion filter (trims diff to relevant files)
3. Context building (commit message + parent + shaped diff + file contents only — no voice, reference, or preferences) — gathered once per sha, cached as `context.json` in `~/.postdiff/repos/<slug>/<sha>/`, reused by every later `generate`/`context` call for that sha. Voice, reference, and preference files are read fresh from `~/.postdiff` on every `generate` call, never cached in `context.json`
4. Generation (Vercel AI SDK over the provider registry — default groq / `openai/gpt-oss-20b`, web search where supported)
5. Human review (edit/approve/regenerate/reject — required before publish; accept-with-edit distills a global preference rule via LLM)
6. Publish (copy-only via clipboard per §7.6)
7. Feedback: accept/reject verdicts + distilled preference rules persist learnings. Full feedback loop (edit deltas feeding voice profile) deferred to V2.

Design principles (not tech choices):

- Engine decoupled from interface: any UI calls the engine; the engine never depends on a UI
- LLM provider is swappable behind an interface (mockable in tests); no provider hardcoded
- Storage is swappable behind an interface (local-first); no backend hardcoded
- Secrets are passed into the engine as inputs, never read directly by it, and never stored in plain settings files
- Test coverage lives where the logic lives (significance, context, generation, voice/feedback)

## 9. Tech Stack

TBD — to be decided during build. Constraints only:

- Local-first, single-user
- Native git for history/diffs — no hosted-git API or webhook dependency
- Browser-free publishing — no paid platform API tiers, no OAuth, no tabs in v1

## 10. Command Surface (decided draft — refinements open)

- `postdiff context [<sha>] [--json]` — generation-ready context inspector for a commit (replaces retired `postdiff diff`; no LLM, no `--staged` pre-commit preview in v1)
- `postdiff generate [<sha>] [--force] [--blog|--x|--linkedin]` — Jev gate then drafts **one** requested platform; default `<sha>` = HEAD; `--force` skips the Jev gate
- `postdiff voice [add|create|remove|view] [--blog|--x|--linkedin] ["<pasted string>"]` — `add` appends, `create` overwrites, `remove` clears, `view` shows all (flag filters to one); `voice.md` always pairs with the platform file
- `postdiff review [<sha>] [--blog|--x|--linkedin] [--accept|--reject] [--reason "<text>"]` — displays the stored draft, records the verdict in `review-<platform>.json`. Accept stores the version; reject removes the version from history and converts the reason into a global preference rule via `rejectRuleFor()`. Accept-with-edit (content differs from generated) triggers an LLM call to distill a style preference. Verdicts bind to exact text, edits snapshot new versions.
- `postdiff reference [add|create|remove|view] [--blog|--x|--linkedin] ["<post>"]` — real-post examples per platform (`~/.postdiff/reference/`); studied as style variations, never copied
- `postdiff preferences [add|create|remove|view] [--blog|--x|--linkedin] ["<rule>"]` — global platform taste rules (`~/.postdiff/preferences/`); distilled automatically at changed-hash verdicts (dual-output preference call: commit preference + style-only global rule), curated by hand; cap 20/platform, oldest rotates; applied to every generation including first drafts
- `postdiff publish [<sha>] [--blog|--x|--linkedin]` — copies the accepted draft to the clipboard (copy-only on every platform, per §7.6); default `<sha>` = HEAD; gate: latest version `accepted` + hash-matched to the file, else refuse with "review --accept first"
- Store (decided): no repo-local `.postdiff/` — everything under user home `~/.postdiff/` (Windows: `C:\Users\<you>\.postdiff\`), namespaced per repo for drafts; YouTube deferred so no `--youtube` voice/platform in v1

## 11. Competitive Landscape

| Tool | What it does | How Postdiff differs |
|---|---|---|
| CommitLore | Reads diffs, generates Twitter/LinkedIn/blog content, manual trigger, $12/mo | Cloud/GitHub-webhook + OAuth based. No YouTube-script format. |
| CommitStream | Commit → X/LinkedIn posts, markets "AI learns your voice" | Same cloud/webhook model; "learns your voice" has no specified mechanism. Postdiff's is a named 3-signal loop. |
| Posterly (Ship & Share) | GitHub-commit-to-post as one feature of a broader scheduling platform | Built for scheduled multi-platform auto-publish, not a draft-first developer tool |
| Postgit / SideProjectBuddy | Commit → tweet/LinkedIn pipelines, GitHub-connected | Same cloud/OAuth pattern |

**Core differentiation:** every competitor found is a cloud SaaS requiring GitHub OAuth. Postdiff is local-first and terminal/editor-native — works on uncommitted or private-repo work without granting any third party repo access, and runs in the same session where the code was written. None of the competitors surfaced a live "is this worth posting" judgment step as a first-class feature, and none offer a YouTube-script format.

## 12. Business Model (draft, not finalized)

- Free tier: shared/limited LLM API budget
- Pro tier: bring-your-own API key or subscription — unlimited generation, all 4 formats, editor integration access
- Future: team/agency tier for dev-relations teams managing multiple repos' public presence
- Pricing numbers and break-even math: not yet defined — needs real cost-per-generation modeling against LLM API pricing

## 13. Success Metrics (draft, needs real targets)

- % of generated drafts posted with minimal edits (proxy for voice-match quality)
- Number of generation triggers per active user per week (proxy for habit formation)
- Retention after first week (does the tool survive the cold-start mediocrity period)

## 14. Build Phases (capability order — scaffolding choices TBD)

1. Diff/commit extraction
2. Significance filter (Jev Noul judge + `--force` bypass)
3. Voice profile loader (per-platform `.md` files: `blog.md`, `x.md`, `linkedin.md`)
4. Generation — prompt builder + provider call via Vercel AI SDK (provider registry), one platform per request (Blog, X, LinkedIn; YouTube deferred)
5. Review output (display + file persistence to global `~/.postdiff`)
6. Publish — copy-only (`clipboardy`; gate: accepted + hash-matched, per §7.6)
7. Feedback loop — V2 (deferred): persist edit/accept/reject signal, feed back into voice profile. V1 ships static voice only.
8. Editor integration — same engine, adds review UI
9. Test/eval harness — DEFERRED (unit + golden fixtures + live-Jev eval noted for future, skipped for the significance slice)

## 15. Hackathon Demo Plan

- Voice profile pre-loaded with real past posts before demo day — no live calibration, no cold-start risk on stage
- Live demo flow: real commit made live → LLM significance check → all 4 formats generated → publish copies the accepted draft, paste live, on stage
- Significance filter runs LLM-judged (not heuristic-only) for the demo, specifically because it's the more impressive path — mitigated by the timeout+fallback described in 7.2
- Dogfooding note: whether the live commit is against Postdiff's own repo (showing the tool write about itself being built) or a separate demo repo is a presentation choice, not yet locked

## 16. Open Questions

- ~~Voice profile scope: global per-user vs. per-project~~ → Resolved: global per-user (§7.3)
- Real, verified statistics for the business/impact case are not yet sourced — competitor-published engagement stats must not be used as Postdiff's own supporting facts
- Pricing model numbers not yet modeled against actual API costs
- Team name/branding beyond the product name "Postdiff" not yet finalized
- ~~Implementation stack~~ → Resolved: TypeScript + Node, Vercel AI SDK over the provider registry (groq default; provider + model in config), `@typesafe-ai/sdk` for Jev, `commander` for CLI, `clipboardy` for publish
