## Summary

<!-- What does this PR add or change, and why? -->

## Type

- [ ] New plugin
- [ ] Plugin update (new or changed skills, agents, commands, hooks or MCP)
- [ ] Fix
- [ ] Docs, CI or site

## Plugin checklist

- [ ] Follows [docs/PLUGIN-GUIDELINES.md](../docs/PLUGIN-GUIDELINES.md): components at the plugin root and only `plugin.json` inside `.claude-plugin/`
- [ ] The name is kebab-case and matches the folder, `plugin.json` and the marketplace entry
- [ ] The marketplace entry has `category` and `tags` from `site/data/taxonomy.json`, and entries stay sorted
- [ ] `version` bumped in `plugin.json` (not in `marketplace.json`) and `CHANGELOG.md` updated
- [ ] The plugin README covers install, contents, requirements and examples
- [ ] Tested locally with `claude --plugin-dir ./plugins/<plugin>`
- [ ] `claude plugin validate` (marketplace and plugin, `--strict`) and `node scripts/validate-marketplace.mjs` pass

## Security

- [ ] No hardcoded secrets; credentials go through `userConfig` (`sensitive: true`) or documented environment variables
- [ ] Hooks, MCP servers, scripts and network calls are listed below and in the plugin README
- [ ] External sources are pinned to a full commit `sha`

<!-- List every hook, MCP server, script and external endpoint this PR adds or changes. -->
