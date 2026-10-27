# Contributing to Postdiff

Thank you for your interest in contributing to Postdiff! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)
- [Getting Help](#getting-help)

## Code of Conduct

We are committed to providing a welcoming and inclusive experience for everyone. We expect all contributors to:

- Be respectful and considerate in all interactions
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

Before you begin:

1. Read the [README.md](README.md) to understand what Postdiff does
2. Review the [PRD.md](PRD.md) for product decisions and architecture
3. Check [existing issues](https://github.com/ankitdey01/postdiff/issues) to see if your concern is already tracked
4. Join the discussion on issues you're interested in

### Good First Issues

Look for issues labeled `good-first-issue` or `help-wanted` to find beginner-friendly tasks.

## Development Setup

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: Latest version
- **TypeScript**: Installed via project dependencies

### Installation

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/postdiff.git
cd postdiff
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Link for local testing**

```bash
npm link
```

After linking, you can run `postdiff` commands globally, and they'll use your local development version.

### Environment Setup

Create a `.env` file in your working directory (or `~/.postdiff/.env`) with the required API keys:

```bash
# Required for significance filtering
TYPESAFE_API_KEY=your_typesafe_key

# Choose one provider (example with Groq, the default)
GROQ_KEY=your_groq_key

# Optional: Enable AI SDK devtools
POSTDIFF_DEVTOOLS=true
```

**Getting API Keys:**
- TypeSafe: [console.typesafe.ai/keys](https://console.typesafe.ai/keys)
- Groq: [console.groq.com/keys](https://console.groq.com/keys)
- Other providers: See [PRD.md §7.4](PRD.md#74-generation-decided) for links

## Project Structure

Postdiff is a TypeScript monorepo with the following structure:

```
postdiff/
├── packages/
│   └── core/                 # UI-agnostic engine (@postdiff/core)
│       ├── src/
│       │   ├── significance/ # Jev-based filtering
│       │   ├── generation/   # AI provider registry
│       │   ├── context/      # Commit context building
│       │   └── shared/       # Shared utilities
│       └── package.json
├── apps/
│   ├── terminal/             # CLI + TUI interface (postdiff binary)
│   │   ├── src/
│   │   │   ├── commands/     # CLI command implementations
│   │   │   ├── ui.ts         # Terminal UI helpers
│   │   │   └── main.ts       # Entry point
│   │   └── package.json
│   └── web/                  # Web interface (future)
├── docs/                     # Documentation
│   ├── agents/              # Agent-specific docs
│   └── adr/                 # Architecture decision records
├── .agents/                  # Agent skills and workflows
│   └── skills/              # Vendored skills
├── AGENTS.md                # Agent instructions
├── PRD.md                   # Product requirements
├── README.md                # User-facing documentation
└── package.json             # Root workspace config
```

### Key Principles

- **Engine is UI-agnostic**: `packages/core` never imports from `apps/*`
- **Secrets are inputs**: The engine receives keys as parameters, never reads `process.env`
- **One capability at a time**: Build, verify, then move forward (see [AGENTS.md](AGENTS.md))

## Development Workflow

### 1. Create a Branch

Create a feature branch from `main`:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Your Changes

- Write clean, readable code
- Follow the [coding standards](#coding-standards)
- Add tests for new functionality (when test infrastructure exists)
- Update documentation as needed

### 3. Build and Test

```bash
# Type check
npm run typecheck

# Build all packages
npm run build

# Test locally
postdiff --help
```

### 4. Commit Your Changes

Follow our [commit message guidelines](#commit-message-guidelines):

```bash
git add .
git commit -m "feat(generation): add support for custom prompts"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

## Coding Standards

### TypeScript

- Use TypeScript strict mode (already configured)
- Prefer explicit types over `any`
- Use interfaces for public APIs, types for internal structures
- Export types alongside implementations

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Single quotes for strings
- **Semicolons**: Required
- **Naming**:
  - `camelCase` for variables and functions
  - `PascalCase` for types, interfaces, and classes
  - `UPPER_SNAKE_CASE` for constants
  - Descriptive names over abbreviations

### Don't Over-Engineer

From [AGENTS.md](AGENTS.md):

> Don't overcomplicate, instead do smart engineering changes. Don't over engineer stuffs that require simple work.

Keep solutions simple and focused. Use existing libraries when appropriate rather than building from scratch.

### Example Code Structure

```typescript
// packages/core/src/example/feature.ts

export interface FeatureConfig {
  enabled: boolean;
  threshold: number;
}

export class FeatureService {
  private config: FeatureConfig;

  constructor(config: FeatureConfig) {
    this.config = config;
  }

  public async process(input: string): Promise<string> {
    // Implementation
    return input;
  }
}
```

## Testing Guidelines

**Note**: Test infrastructure is deferred (see PRD.md §14.9). Until formal test harness exists:

- Manually test your changes with real commands
- Test both happy path and error cases
- Document test scenarios in your PR description
- Verify behavior with different providers/configurations

**When test infrastructure is added**, follow these principles:

- Unit tests for pure logic (significance, context building)
- Integration tests for provider interactions
- Coverage should live where the logic lives
- Mock external APIs (LLM providers, TypeSafe Jev)

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvement
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Scopes

Common scopes in this project:

- `core`: Changes to packages/core
- `cli`: Changes to terminal CLI
- `significance`: Significance filter
- `generation`: Generation engine
- `voice`: Voice profile system
- `review`: Review system
- `publish`: Publishing system
- `setup`: Setup wizard

### Examples

```bash
feat(generation): add web search support for anthropic provider

Implements browser_search tool attachment for Anthropic models when
--web flag is used. Includes warning for unsupported models.

Closes #123
```

```bash
fix(significance): handle jev timeout gracefully

Previously, Jev timeout would block generation. Now falls through
with warning, allowing user to proceed.
```

```bash
docs(readme): update provider setup instructions

Clarifies which providers support web search and adds links to
provider console URLs.
```

## Pull Request Process

### Before Submitting

- [ ] Code follows the project's coding standards
- [ ] Changes have been manually tested
- [ ] Documentation has been updated
- [ ] Commit messages follow guidelines
- [ ] Branch is up to date with `main`

### PR Template

When creating a PR, include:

1. **Description**: What does this PR do?
2. **Motivation**: Why is this change needed?
3. **Test Plan**: How did you verify this works?
4. **Screenshots**: (if applicable)
5. **Breaking Changes**: (if any)
6. **Related Issues**: Closes #123

### Example PR Description

```markdown
## Description
Adds support for Mistral AI provider in the generation registry.

## Motivation
Users requested Mistral as a more affordable alternative to GPT-4.

## Test Plan
- Added Mistral to provider registry with curated models
- Tested `postdiff setup` with Mistral provider selection
- Ran `postdiff generate` with mistral-large-latest
- Verified API key validation works correctly

## Breaking Changes
None

## Related Issues
Closes #234
```

### Review Process

1. At least one maintainer review is required
2. All CI checks must pass (when CI is set up)
3. Address reviewer feedback
4. Once approved, a maintainer will merge your PR

### After Your PR is Merged

- Delete your feature branch
- Pull the latest `main`
- Your contribution is now part of Postdiff! 🎉

## Issue Reporting

### Before Creating an Issue

1. Check if the issue already exists
2. Collect relevant information (OS, Node version, command output)
3. Try to reproduce with minimal steps

### Issue Labels

Issues in this project use these labels (see [docs/agents/triage-labels.md](docs/agents/triage-labels.md)):

- `needs-triage`: New issue, not yet reviewed
- `needs-info`: Requires more information from reporter
- `ready-for-agent`: Can be handled by AI agent
- `ready-for-human`: Requires human decision/implementation
- `wontfix`: Issue won't be addressed (with explanation)
- `good-first-issue`: Good for newcomers
- `help-wanted`: Community contributions welcome
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation improvements

### Bug Report Template

```markdown
## Description
A clear description of the bug.

## Steps to Reproduce
1. Run `postdiff generate`
2. Select Blog format
3. See error

## Expected Behavior
Draft should be generated.

## Actual Behavior
Error: "Provider key not found"

## Environment
- OS: Windows 11
- Node: v20.10.0
- Postdiff: v0.0.1

## Additional Context
Using Groq provider with valid API key in ~/.postdiff/.env
```

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature you'd like.

## Use Case
Why would this feature be useful?

## Proposed Solution
How do you imagine this working?

## Alternatives Considered
Other approaches you've thought about.
```

## Documentation

### What Needs Documentation

- New commands or flags
- New configuration options
- API changes in `packages/core`
- Architecture decisions (add to `docs/adr/`)
- User-facing behavior changes

### Where to Document

- **User guide**: README.md
- **Product decisions**: PRD.md
- **Agent instructions**: AGENTS.md
- **Architecture decisions**: docs/adr/
- **API documentation**: Inline JSDoc comments

### Documentation Style

- Use clear, concise language
- Include code examples
- Explain why, not just what
- Keep it up to date with code changes

## Getting Help

### Resources

- **Product docs**: [PRD.md](PRD.md)
- **Architecture**: [AGENTS.md](AGENTS.md)
- **Issues**: [GitHub Issues](https://github.com/ankitdey01/postdiff/issues)
- **Discussions**: Use GitHub Discussions for questions

### Questions?

- Check existing documentation first
- Search closed issues for similar questions
- Open a new issue with the `question` label
- Tag it as `needs-info` if you need clarification

## Recognition

Contributors will be:
- Listed in release notes
- Credited in relevant documentation
- Added to a CONTRIBUTORS file (when created)

## License

By contributing to Postdiff, you agree that your contributions will be licensed under the MIT License.

---

## Quick Reference

```bash
# Setup
git clone https://github.com/YOUR_USERNAME/postdiff.git
cd postdiff
npm install
npm run build
npm link

# Development
npm run typecheck    # Check types
npm run build       # Build packages
npm run clean       # Clean build artifacts

# Testing locally
postdiff --help
postdiff setup
postdiff generate

# Create PR
git checkout -b feature/my-feature
# ... make changes ...
git add .
git commit -m "feat(scope): description"
git push origin feature/my-feature
# ... open PR on GitHub ...
```

---

**Thank you for contributing to Postdiff!** Every contribution, no matter how small, helps make this tool better for the developer community.
