# Releases

## How Claude Code detects updates

Claude Code updates a plugin only when its **computed version** changes. It takes the version from `plugin.json` `version` first. If that is missing, it uses the marketplace entry `version`, and then the git commit SHA.

We set `version` in `plugin.json` only. **If you push changes without bumping it, users never receive them.** Never also set `version` in the marketplace entry: `plugin.json` silently wins, and validation warns.

## Versioning

Plugins follow [semver](https://semver.org):

| Bump | When |
|---|---|
| Major `2.0.0` | Removed or renamed skills, agents or commands; changed hook behaviour; new required configuration |
| Minor `1.3.0` | New skills, agents, commands or options, all backwards compatible |
| Patch `1.2.1` | Fixes and wording changes |

## Changelog

Each plugin keeps a `CHANGELOG.md` in [Keep a Changelog](https://keepachangelog.com) format. The site's What's New page uses the matching version section as the release note:

```markdown
## [1.3.0] - 2026-10-16
- Added `invoice-parser` skill
- Fixed table detection in scanned PDFs
```

Without a matching section, What's New falls back to the commit subject.

## Release checklist

1. Bump `version` in `plugins/<plugin>/.claude-plugin/plugin.json`.
2. Add a section to `plugins/<plugin>/CHANGELOG.md`.
3. Open a PR; CI must pass.
4. After merge, tag the release from `main`:
   ```bash
   claude plugin tag plugins/<plugin> --push      # creates <plugin>--v<version>
   ```
5. The marketplace site rebuilds on the merge, and the change appears under What's New.

## Deprecating and removing

- **Deprecate:** set `"metadata": { "status": "deprecated" }` on the marketplace entry and say what replaces the plugin in its README and changelog. It stays installable.
- **Remove:** delete the entry and the plugin folder, and add `"<plugin>": null` to `renames` in `marketplace.json`.
- **Rename:** avoid it. If it is unavoidable, add `"<old>": "<new>"` to `renames`. Entries in `renames` are append-only.

## Getting updates as a user

Auto-update is off by default for third-party marketplaces. Users either update manually:

```bash
/plugin marketplace update dev-digest-ai-marketplace
```

or enable auto-update in `/plugin` → Marketplaces. Run `/reload-plugins` to load updates into a running session.
