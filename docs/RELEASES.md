# Releases

## How Claude Code detects updates

Claude Code updates a plugin only when its **computed version** changes. It takes the version from `plugin.json` `version` first. If that is missing, it uses the marketplace entry `version`, and then the git commit SHA.

We set `version` in `plugin.json` only. **If you push changes without bumping it, users never receive them.** Never also set `version` in the marketplace entry: `plugin.json` silently wins, and validation warns.

Updates come from the version on `main`. Git tags (`<plugin>--v<version>`) do not trigger them; tags only choose which version of a plugin to install when another plugin depends on it (see [Plugins with dependencies](#plugins-with-dependencies)).

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
6. Users with auto-update on get the new version in their next interactive session, within about ten minutes of their first message (see [Getting updates as a user](#getting-updates-as-a-user)).

## Plugins with dependencies

A plugin can list other plugins from this marketplace in `plugin.json` → `dependencies`, with a semver range:

```json
"dependencies": [{ "name": "engineering-paved-path", "version": "^1.0.0" }]
```

Claude Code installs each dependency at the highest git tag `<plugin>--v<version>` that satisfies the range. A dependency with no matching tag cannot be installed, so:

1. Tag dependencies before the plugins that depend on them. The current order is `engineering-paved-path`, then `research-tools` and `architecture-review`, then `sdd-engineering`.
2. A major bump of a dependency (`2.0.0`) is outside `^1.0.0`. Release it, then update and release every dependent plugin's range in the same change set.
3. When two plugins depend on the same plugin, their ranges must overlap. `architecture-review` and `sdd-engineering` both require `engineering-paved-path`.

After tagging, check a test install with `claude plugin list --json`. It must show no `dependency-unsatisfied` or `dependency-version-unsatisfied` errors.

## Deprecating and removing

- **Deprecate:** set `"metadata": { "status": "deprecated" }` on the marketplace entry and say what replaces the plugin in its README and changelog. It stays installable.
- **Remove:** delete the entry and the plugin folder, and add `"<plugin>": null` to `renames` in `marketplace.json`.
- **Rename:** avoid it. If it is unavoidable, add `"<old>": "<new>"` to `renames`. Entries in `renames` are append-only.

## Getting updates as a user

Auto-update is off by default for third-party marketplaces. Turn it on in `/plugin` → **Marketplaces** → `dev-digest-ai-marketplace` → **Enable auto-update**, or set `"autoUpdate": true` on the marketplace's `extraKnownMarketplaces` entry in a project's `.claude/settings.json` (see the [README](../README.md#team-setup)).

**When it runs.** Auto-update does not run at startup. In an interactive session, after the user's first message, Claude Code waits a random delay of up to ten minutes. It then refreshes every marketplace with auto-update on and updates plugins whose version changed. The running session keeps the old version and shows `Plugin updated: <plugin> · Run /reload-plugins to apply`. Only interactive sessions run it. Sessions with `DISABLE_UPDATES`, `DISABLE_AUTOUPDATER` or `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` set skip it unless `FORCE_AUTOUPDATE_PLUGINS=1` is set. Details: [When auto-update runs](https://code.claude.com/docs/en/plugins/loading.md#when-auto-update-runs).

**Updating by hand**, from the shell:

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update <plugin>@dev-digest-ai-marketplace
```

Then restart, or run `/reload-plugins` in an open session.

**Checking a release.** In a project that uses the plugin, send a message, wait up to ten minutes, run `/reload-plugins`, then `claude plugin list`. If it still shows the old version, run the two commands above. If they update it, the release is fine and the problem is the auto-update setting.
