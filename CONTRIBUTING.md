# Contributing

Thanks for adding to the `dev-digest-ai-marketplace` marketplace. Read these before you start:

- [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md): the layout and fields every plugin must follow
- [docs/RELEASES.md](docs/RELEASES.md): versioning, changelog and tagging
- [docs/SECURITY.md](docs/SECURITY.md): review rules for hooks, MCP servers and scripts

## Workflow

1. **Open an issue first** for a new plugin, so we can agree on scope and name before you build it. Small fixes can go straight to a PR.
2. Create a branch: `plugin/<plugin-name>` or `fix/<plugin-name>-<topic>`.
3. Add or change the plugin under `plugins/<plugin-name>/` and its entry in `.claude-plugin/marketplace.json`, keeping entries sorted by name.
4. Run the checks locally:
   ```bash
   claude plugin validate . --strict
   claude plugin validate plugins/<plugin-name> --strict
   node scripts/validate-marketplace.mjs
   claude --plugin-dir ./plugins/<plugin-name>   # try it
   ```
5. Bump `version` and update `CHANGELOG.md` for any change users should receive.
6. Open a PR and fill in the template. CI must pass, and a CODEOWNER must approve.

## Changing the site

The marketplace site lives in `site/` (Astro). Run it locally:

```bash
cd site
npm ci
npm run dev
```

## Commit messages

Use a short imperative subject that names the plugin, for example `pdf-tools: add invoice-parser skill`. The subject is the fallback release note on What's New.
