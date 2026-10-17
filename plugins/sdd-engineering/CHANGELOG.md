# Changelog

All notable changes to `sdd-engineering` are documented here, in
[Keep a Changelog](https://keepachangelog.com) format. Versions follow
[semver](https://semver.org).

## [1.0.0] - 2026-10-16
- Added agents `spec-creator`, `implementation-planner`, `implementer` and `plan-verifier`
- Added skills `/run-plan`, `/workflow-retro` and `engineering-insights`
- Added `PreToolUse` guards that keep `spec-creator` inside the specs folder and `implementation-planner` to `*-plan.md` files
- Added the `.claude/sdd-engineering.json` repo contract (`specsDir`, `plansDir`, `verifyCommand`, `architectureDocs`, `skillRouting`, `insights`, `retroLedger`)
- Added behavior evals for write scope, missing verify command and `CANNOT VERIFY` reporting
- Depends on `engineering-paved-path@^1.0.0`, `research-tools@^1.0.0` and `architecture-review@^1.0.0`
