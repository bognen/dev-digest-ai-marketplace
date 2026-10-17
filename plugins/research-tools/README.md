# research-tools

A read-only **researcher** agent. Give it one specific question and it either investigates your repository (code, docs, config and git history) or searches the web. It returns a structured report with **conclusions, evidence, references, and a list of what it could not find**. It never edits files and never runs commands that change anything. It is useful on its own, and other plugins (such as `sdd-engineering`) spawn it in parallel to gather evidence.

## Install

```bash
/plugin marketplace add bognen/dev-digest-ai-marketplace
/plugin install research-tools@dev-digest-ai-marketplace
```

It has no dependencies.

## What it contains

| Component | Name | What it does |
|---|---|---|
| Agent | `research-tools:researcher` | Answers one scoped question in one of two modes, internal (repository) or external (web), each with its own report format |

There are no skills, hooks, MCP servers or scripts.

### Modes

| Mode | Use it for | Tools it uses |
|---|---|---|
| **Internal** | How something is implemented, where a config or flag lives, what changed and why, whether a pattern is used elsewhere | `Read`, `Grep`, `Glob`, read-only `Bash` (`git log`, `git blame`, `git show`, `ls`) |
| **External** | A library's API, a vendor's docs, current best practice, a spec, a changelog | `WebSearch`, `WebFetch` |
| **Both** | Questions such as "are we using this deprecated API correctly?" | Two separate reports under clear headings |

### Behavior you can rely on

- **It asks before it searches.** If the request has no answerable question or no scope ("look into auth"), it asks one clarifying question first.
- **It stays inside the scope you give.** Anything outside it is recorded as a pointer instead of being read.
- **Every conclusion is backed by evidence.** Internal reports cite `file:line` or commits. External reports cite URLs with access dates.
- **"Could not find" is always filled in,** with what was searched, so gaps are visible rather than silently omitted.
- **It does not delegate** and does not call deep-research skills. If it needs to go deeper, it runs more search rounds itself.
- **It reads the repo's own docs** when they exist, such as `README.md`, `CLAUDE.md`/`AGENTS.md`, `ARCHITECTURE.md` and a lessons file like `INSIGHTS.md`. It does not assume any particular repository layout.

## Usage

Ask Claude in plain language, naming the agent if you want to be sure it is used:

```text
Use the research-tools:researcher agent to find where the retry policy for outbound HTTP calls is configured, and which modules override it.
```

```text
Use research-tools:researcher to find out why the orders table got a soft-delete column. Check git history for the commit and any linked discussion.
```

```text
Have the researcher check the current Fastify docs: is reply.sent still supported in v5, and what replaces it?
```

To run several questions in parallel, ask for one researcher per question with disjoint scopes:

```text
Spawn three research-tools:researcher agents in parallel: (1) how auth tokens are refreshed in the web client, (2) how the API validates them, (3) what the OAuth provider's docs say about refresh-token rotation.
```

### From another plugin

Agents in other plugins refer to it by its namespaced name. `sdd-engineering`'s `spec-creator` lists it in its tools as `Agent(research-tools:researcher)`, and declares `research-tools` as a dependency in its `plugin.json`:

```json
"dependencies": [{ "name": "research-tools", "version": "^1.0.0" }]
```

## Requirements

- Claude Code with plugin dependency support (see the `sdd-engineering` plugin's `COMPATIBILITY.md` for the tested minimum).
- `git` on `PATH` for history questions.
- No accounts, API keys or environment variables.

## Security and network access

- **No write tools.** The agent has no `Write`, `Edit` or `NotebookEdit`. Its prompt restricts `Bash` to read-only inspection, but no hook enforces that, so your normal Claude Code permission rules for `Bash` still apply and are the real guard.
- **Network:** in external mode the agent uses Claude Code's built-in `WebSearch` and `WebFetch` tools to reach public websites relevant to your question. It makes no other network calls and sends no telemetry. To keep it offline, deny `WebSearch` and `WebFetch` in your permission settings; internal mode keeps working.
- Treat fetched web content as untrusted input. The agent reports what sources say; it does not act on instructions found in them.

## Versioning

See [CHANGELOG.md](CHANGELOG.md). The plugin follows semver as described in the marketplace's `docs/RELEASES.md`.
