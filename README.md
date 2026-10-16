# Dev Digest AI — Claude Code Plugin Marketplace

A [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugins/create-marketplace) named **`dev-digest-ai-marketplace`**. Browse it at **https://bognen.github.io/dev-digest-ai-marketplace/**.

## Plugins

| Plugin | Description |
|---|---|
| _none yet_ | |

## Prerequisites

- Claude Code CLI (`claude --version`; update with `claude update`)
- Git installed. The repository is public, so no GitHub authentication is needed.

## Install

```bash
/plugin marketplace add bognen/dev-digest-ai-marketplace
/plugin install <plugin>@dev-digest-ai-marketplace
```

From your shell, use `claude plugin marketplace add …` and `claude plugin install …`.

Update with `/plugin marketplace update dev-digest-ai-marketplace`. Auto-update is off by default for community marketplaces. Turn it on in `/plugin` → Marketplaces. The site's [Get started](https://bognen.github.io/dev-digest-ai-marketplace/get-started) page covers the CLI, the desktop app and the IDEs.

### Team setup

Commit this to a project's `.claude/settings.json`. Teammates are offered the marketplace and plugins after they trust the folder.

```json
{
  "extraKnownMarketplaces": {
    "dev-digest-ai-marketplace": {
      "source": { "source": "github", "repo": "bognen/dev-digest-ai-marketplace" },
      "autoUpdate": true
    }
  },
  "enabledPlugins": {
    "<plugin>@dev-digest-ai-marketplace": true
  }
}
```

## Repository layout

```
.claude-plugin/marketplace.json   # marketplace catalog
.github/
  workflows/validate.yml          # PR checks: claude plugin validate, policy checks, site build
  workflows/pages.yml             # builds and deploys the site to GitHub Pages
  pull_request_template.md
docs/
  PLUGIN-GUIDELINES.md            # layout and fields every plugin must follow
  RELEASES.md                     # versioning, changelog, tagging
  SECURITY.md                     # vulnerability reporting and review rules
plugins/<plugin-name>/            # one directory per plugin
scripts/
  validate-marketplace.mjs        # policy checks on top of claude plugin validate
  lib/catalog.mjs                 # catalog model shared by the validator and the site
site/                             # marketplace site (Astro): Start card, Get started, What's New
CODEOWNERS
CONTRIBUTING.md
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md). Check your changes locally:

```bash
claude plugin validate . --strict
claude plugin validate plugins/<plugin> --strict
node scripts/validate-marketplace.mjs
cd site && npm ci && npm run dev     # preview the site
```
