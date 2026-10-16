# Plugin Guidelines

This is the contract every plugin in the `dev-digest-ai-marketplace` marketplace follows. The CI checks (`claude plugin validate --strict` and `scripts/validate-marketplace.mjs`) enforce it, and the marketplace site (`site/`) reads its catalog from the same files.

## Layout

```
plugins/<plugin>/
  .claude-plugin/plugin.json         # manifest — the ONLY file inside .claude-plugin/
  README.md                          # required
  CHANGELOG.md                       # recommended; feeds the site's What's New page
  skills/<skill>/SKILL.md
  agents/<agent>.md
  commands/<command>.md
  hooks/hooks.json
  .mcp.json
  scripts/                           # helper executables (not a top-level bin/)
```

Every component lives at the plugin root. Anything placed inside `.claude-plugin/` other than `plugin.json` is silently ignored by Claude Code.

## Manifest — `plugin.json`

```json
{
  "name": "pdf-tools",
  "version": "1.0.0",
  "description": "Extract text, tables and line items from PDF files",
  "author": { "name": "Your Name" },
  "license": "MIT",
  "keywords": ["pdf", "documents"]
}
```

- `name`: kebab-case, identical to the marketplace entry name and the folder name. It is **immutable** once published. Change `displayName` instead, or use `renames` in `marketplace.json`.
- Never start a name with `claude-`, `anthropic-` or `cc-plugin-`. Those names are reserved, and validation rejects them.
- `version`: semver, set **only here**, never in the marketplace entry. See [RELEASES.md](RELEASES.md).

## Marketplace entry

Add the plugin to `.claude-plugin/marketplace.json` and keep `plugins` sorted by `name`:

```json
{
  "name": "pdf-tools",
  "source": "./plugins/pdf-tools",
  "description": "Extract text, tables and line items from PDF files",
  "category": "documents",
  "tags": ["pdf", "ocr"],
  "metadata": { "status": "stable" }
}
```

| Field | Rule |
|---|---|
| `category` | Required. One value from `site/data/taxonomy.json` → `categories`. |
| `tags` | 1–6 values from `site/data/taxonomy.json` → `tags`. Propose new tags in the same PR. |
| `metadata.status` | `stable` (default), `beta` or `deprecated`. |
| `description` | 20–300 characters. Shown on the site's cards. |

## Component frontmatter

Skills, agents and commands carry YAML frontmatter. `category`, `tags` and `status` are optional and fall back to the plugin's values. `examples` are prompts that trigger the artifact and appear on its detail page.

| Type | Required | Optional |
|---|---|---|
| `skills/<skill>/SKILL.md` | `name`, `description` | `category`, `tags`, `status`, `examples` |
| `agents/<agent>.md` | `name`, `description` | `tools`, `model`, `category`, `tags`, `status`, `examples` |
| `commands/<command>.md` | `description` | `argument-hint`, `category`, `tags`, `status`, `examples` |

```markdown
---
name: invoice-parser
description: Extracts line items, totals and VAT from PDF invoices
tags: [pdf, finance]
examples:
  - Parse the invoices in ./inbox and give me a CSV of line items
---
```

- A skill entry points at its **directory** (`skills/invoice-parser/`), not at `SKILL.md`.
- Keep `SKILL.md` short. Move long reference material into files next to it and link to them.
- A `CLAUDE.md` inside a plugin is not loaded. Put instructions in a skill.

## Hooks, MCP servers and scripts

- Reference plugin files through `"${CLAUDE_PLUGIN_ROOT}"`, quoted, because paths can contain spaces. Never use absolute paths or paths that work only from your checkout.
- Keep persistent state in `${CLAUDE_PLUGIN_DATA}`. `${CLAUDE_PLUGIN_ROOT}` is replaced on every update.
- Use forward slashes in every path, including on Windows.
- Installed plugins are copied to a cache, so never reference files outside the plugin directory (`../shared` breaks).
- Never hardcode tokens or credentials. Declare them in `userConfig` with `"sensitive": true`.
- Executables go in `scripts/`. A top-level `bin/` blocks claude.ai org distribution.
- Document every hook, MCP server and external network call in the plugin README. See [SECURITY.md](SECURITY.md).

## Plugin README

Each plugin README must cover:

1. What it does, in one paragraph.
2. Install: `/plugin install <plugin>@dev-digest-ai-marketplace`.
3. What it contains: skills, agents, commands, hooks and MCP servers.
4. Requirements: environment variables, external tools and accounts.
5. Usage examples.

## Test locally

```bash
claude plugin validate plugins/<plugin> --strict
claude plugin validate . --strict
node scripts/validate-marketplace.mjs
claude --plugin-dir ./plugins/<plugin>      # try it for one session without installing
```

`--plugin-dir` must point at the plugin directory. Pointed at the repo root, it loads nothing and shows no error.
