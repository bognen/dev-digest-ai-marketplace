# Security

Plugins run with the user's privileges. Hooks, MCP servers, LSP servers and scripts execute **outside Claude Code's sandbox and permission rules**. Skills, agents and commands inject instructions into Claude's context. Every contribution is reviewed with that in mind.

## Reporting a vulnerability

Do **not** open a public issue. Report it privately through [GitHub Security Advisories](../../../security/advisories/new) for this repository, or contact the maintainers listed in [CODEOWNERS](../CODEOWNERS). Include the plugin, the version and steps to reproduce. We aim to respond within 5 working days.

## Review rules for contributions

A PR that adds or changes any of the following needs a CODEOWNER review and a short justification in the PR description:

| Component | What reviewers check |
|---|---|
| `hooks/hooks.json` | Every command it runs; no network calls or file writes outside the project unless documented; paths quoted |
| `.mcp.json` / `.lsp.json` | Server origin, pinned versions, the network endpoints it talks to |
| `scripts/` | Every executable line; no downloads that run code (`curl \| sh`) |
| Skills, agents and commands | No instructions to bypass permissions, edit settings, exfiltrate data or disable safety checks |
| External sources (`github`, `url`, `git-subdir`) | Pinned to a full 40-character `sha`; the upstream repo has been reviewed |

## Rules for plugin authors

- No hardcoded secrets. Use `userConfig` with `"sensitive": true` or environment variables, and document them.
- No telemetry or network calls unless they are documented in the plugin README.
- Hooks and plugins must never modify Claude Code settings or permission rules.
- Pin dependency versions. Commit an npm lockfile when shipping `package.json`.
- Mark experimental plugins `"metadata": { "status": "beta" }` and consider `defaultEnabled: false`.

## Advice for users

Before installing, read the plugin's `hooks/hooks.json`, `.mcp.json` and `scripts/`, or inspect it with:

```bash
claude plugin details <plugin>@dev-digest-ai-marketplace
```

Organisations can restrict sources with `strictKnownMarketplaces` in managed settings. See the [Claude Code plugin security docs](https://code.claude.com/docs/en/plugins/security).
