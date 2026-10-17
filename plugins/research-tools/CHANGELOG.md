# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com), and the plugin uses [semver](https://semver.org).

## [1.0.0] - 2026-10-16
- Added the `researcher` agent: a read-only investigator with internal (repository) and external (web) modes, each with a fixed report format (conclusions, evidence, references, could not find)
- Project-agnostic: no hardcoded paths or file names; reads whatever docs the repository provides
