# Tract

Turns your git commits into ready-to-post content — blog, X, LinkedIn (YouTube script deferred to post-v1) — in your own voice.

CLI tool ships as `postdiff`. All slices implemented: context, generate, voice, review, reference, preferences, publish.

## Install & setup

```bash
npm i -g postdiff
```

First `postdiff generate` (or `review`) walks you through setup: your name, a [Jev/TypeSafe key](https://console.typesafe.ai/keys), a [Groq key](https://console.groq.com/keys) — both validated live — and optional voice/reference markdown. Or run `postdiff setup` explicitly (also for updates).

Where things live: name → `~/.postdiff/config.json`; API keys → `~/.postdiff/.env` (precedence: real env > `cwd/.env` > `~/.postdiff/.env`); voice/reference/preferences → `~/.postdiff/`. Keys are never written to `config.json`.

```mermaid
flowchart LR
    GITREPO[(Local Git Repo)]

    subgraph LOCAL["Local Machine"]
        direction LR

        CLIENTS["User-facing surface\n(CLI first, editor integration later)"]

        subgraph ENGINE["Content Engine (UI-agnostic)"]
            direction TB
            GITMOD["Diff + Commit Extraction"]
            FILTER{"Significance Filter\nStage 1: whole-commit Jev gate\nStage 2: per-file inclusion\n(--force bypasses)"}
            CTX["Context Builder\ncommit msg + parent + shaped diff\n+ changed file contents"]
            GEN["Generation\nGroq transport · openai/gpt-oss-20b\n+ browser search tool"]
            VOICE["Voice Profile\nvoice.md + platform .md"]
            REF["Reference + Preferences\nper-platform examples & rules"]
            REVIEW["Review State\naccept / reject / edit → preference rules"]
            STORE[("Global Store ~/.postdiff\nvoice + reference + preferences\n+ drafts per repo/commit")]
        end
    end

    LLM["Groq API\n(@ai-sdk/groq)"]

    subgraph PUBLISH["Publish (copy-only)"]
        COPY["Clipboard — copy approved draft\n(user pastes anywhere)"]
    end

    GITREPO --> GITMOD
    CLIENTS --> ENGINE
    ENGINE --> CLIENTS
    GITMOD --> FILTER
    FILTER -- "not significant" --> SKIP["Skip, log, wait for next trigger"]
    FILTER -- "significant" --> CTX
    CTX --> GEN
    VOICE --> GEN
    REF --> GEN
    GEN <--> LLM
    GEN --> CLIENTS

    CLIENTS -- "user reviews draft" --> REVIEW
    REVIEW -- "accept-with-edit distills rule" --> REF
    REVIEW --> STORE
    VOICE --> STORE
    REF --> STORE

    CLIENTS --> COPY
```

See `PRD.md` for full context.
