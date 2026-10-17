# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com), and the plugin uses [semver](https://semver.org).

## [1.0.0] - 2026-10-16
- Added the `architecture-reviewer` agent: read-only boundary review of a diff or path set, with `file:line` evidence, a verbatim quote and a cited rule for every finding, and no overall verdict
- Rules come from the repository's own architecture docs first (`ARCHITECTURE.md`, `docs/architecture/**`, ADRs, `CLAUDE.md`/`AGENTS.md`), then from `engineering-paved-path` skills; documented exceptions are respected
- Supports a narrow re-review round, as used by `sdd-engineering`'s `/run-plan`
- Added five `claude plugin eval` cases: layering violation with repo rule ids, repo-specific rule ids, a documented exception, no docs, and a benign rename
- Depends on `engineering-paved-path@^1.0.0`
