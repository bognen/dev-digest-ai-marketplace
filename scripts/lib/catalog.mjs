// Shared catalog model for the marketplace.
// Used by scripts/validate-marketplace.mjs (CI) and by the site build (site/),
// so validation and the published catalog always agree. Node built-ins only.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const MARKETPLACE_PATH = '.claude-plugin/marketplace.json';
export const TAXONOMY_PATH = 'site/data/taxonomy.json';
export const STATUSES = ['stable', 'beta', 'deprecated'];
export const ARTIFACT_TYPES = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];
export const SCHEMA_VERSION = 1;

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESERVED_PREFIXES = ['claude-', 'anthropic-', 'anthropics-', 'cc-plugin-'];
const RESERVED_NAMES = ['claude', 'anthropic', 'claude-code', 'claude-mods'];
const DAY = 86_400_000;
// Plugins are extracted from the DevDigest product repo and must stay product-neutral.
// The marketplace's own name (dev-digest-ai-marketplace) is allowed.
const PRODUCT_REFERENCES = /devdigest|dev-digest(?!-ai-marketplace)|reviewer-core|agent-runner|verify-changed\.sh|pr-self-review/i;
const TEXT_FILE = /\.(md|json|mjs|cjs|js|ts|tsx|py|ya?ml|sh|txt)$/;

// ---------------------------------------------------------------------------
// Frontmatter: a deliberately small YAML subset (scalars, quoted strings,
// inline [a, b] lists, block "- item" lists, folded > and literal | blocks).
// ---------------------------------------------------------------------------

export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return { data: null, body: text };
  return { data: parseYamlSubset(match[1]), body: text.slice(match[0].length) };
}

function parseYamlSubset(src) {
  const data = {};
  const lines = src.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(lines[i]);
    if (!kv) continue;
    const [, key, raw] = kv;
    const value = raw.trim();
    if (value === '') {
      const items = [];
      while (i + 1 < lines.length && /^\s*-\s+/.test(lines[i + 1])) {
        items.push(scalar(lines[++i].replace(/^\s*-\s+/, '')));
      }
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) i++; // nested maps are ignored
      data[key] = items.length ? items : '';
    } else if (/^[>|][+-]?$/.test(value)) {
      const parts = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1] === '')) {
        parts.push(lines[++i].trim());
      }
      data[key] = value[0] === '>' ? parts.join(' ').replace(/\s+/g, ' ').trim() : parts.join('\n').trim();
    } else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map((s) => scalar(s)).filter(Boolean);
    } else {
      data[key] = scalar(value);
    }
  }
  return data;
}

function scalar(raw) {
  const v = raw.trim();
  if (v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) {
    return v.slice(1, -1);
  }
  return v.replace(/\s+#.*$/, '');
}

// ---------------------------------------------------------------------------
// File sources: the working tree, or a git commit (for What's New history).
// Both expose { files, read(path), key(path) }; key() is a content fingerprint.
// ---------------------------------------------------------------------------

export function fsSource(root) {
  const files = [];
  const walk = (rel) => {
    for (const ent of readdirSync(join(root, rel), { withFileTypes: true })) {
      if (ent.name === 'node_modules' || ent.name === '.git') continue;
      const path = `${rel}/${ent.name}`;
      if (ent.isDirectory()) walk(path);
      else files.push(path);
    }
  };
  if (existsSync(join(root, 'plugins'))) walk('plugins');
  if (existsSync(join(root, MARKETPLACE_PATH))) files.push(MARKETPLACE_PATH);
  const read = (path) => {
    try {
      return readFileSync(join(root, path), 'utf8');
    } catch {
      return null;
    }
  };
  return { files, read, key: (path) => read(path) };
}

function git(root, args) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

function gitSource(root, commit, blobCache) {
  const shas = new Map();
  for (const rec of git(root, ['ls-tree', '-r', '-z', commit, '--', 'plugins', MARKETPLACE_PATH]).split('\0')) {
    if (!rec) continue;
    const tab = rec.indexOf('\t');
    const [, kind, sha] = rec.slice(0, tab).split(' ');
    if (kind === 'blob') shas.set(rec.slice(tab + 1), sha);
  }
  return {
    files: [...shas.keys()],
    key: (path) => shas.get(path) ?? null,
    read: (path) => {
      const sha = shas.get(path);
      if (!sha) return null;
      if (!blobCache.has(sha)) blobCache.set(sha, git(root, ['cat-file', 'blob', sha]));
      return blobCache.get(sha);
    },
  };
}

// ---------------------------------------------------------------------------
// Model: marketplace entries + every artifact they contain.
// ---------------------------------------------------------------------------

function authorName(author) {
  if (!author) return null;
  return typeof author === 'string' ? author : author.name ?? null;
}

function safeJson(source, path, issues) {
  const raw = source.read(path);
  if (raw == null) return undefined;
  try {
    return JSON.parse(raw);
  } catch (e) {
    issues.push({ level: 'error', path, message: `Invalid JSON: ${e.message}` });
    return undefined;
  }
}

export function readModel(source) {
  const issues = [];
  const marketplace = safeJson(source, MARKETPLACE_PATH, issues);
  if (marketplace === undefined) {
    if (!issues.length) issues.push({ level: 'error', path: MARKETPLACE_PATH, message: 'File not found' });
    return { marketplace: null, plugins: [], artifacts: [], issues };
  }

  const plugins = [];
  const artifacts = [];

  for (const entry of Array.isArray(marketplace.plugins) ? marketplace.plugins : []) {
    if (!entry || typeof entry.name !== 'string') continue;
    const plugin = { entry, name: entry.name, dir: null, manifest: null, files: [] };
    if (typeof entry.source === 'string') {
      plugin.dir = entry.source.replace(/^\.\//, '').replace(/\/+$/, '');
      plugin.files = source.files.filter((f) => f.startsWith(`${plugin.dir}/`));
      plugin.manifest = safeJson(source, `${plugin.dir}/.claude-plugin/plugin.json`, issues) ?? null;
    }
    plugins.push(plugin);

    const status = entry.metadata?.status ?? 'stable';
    const base = {
      plugin: entry.name,
      category: entry.category ?? null,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      status,
      author: authorName(plugin.manifest?.author ?? entry.author ?? marketplace.owner),
    };

    const pluginArtifact = {
      ...base,
      id: `${entry.name}/plugin/${entry.name}`,
      type: 'plugin',
      name: entry.name,
      title: plugin.manifest?.displayName ?? entry.displayName ?? null,
      description: entry.description ?? plugin.manifest?.description ?? '',
      version: plugin.manifest?.version ?? entry.version ?? null,
      path: plugin.dir,
      examples: [],
      requires: null,
      key: null,
    };
    artifacts.push(pluginArtifact);
    if (!plugin.dir) continue;

    const dirKey = (prefix) =>
      plugin.files.filter((f) => f.startsWith(prefix)).map((f) => `${f}:${source.key(f)}`).join('|');

    const addMarkdown = (type, slug, file, keyPrefix) => {
      const { data } = parseFrontmatter(source.read(file) ?? '');
      const fm = data ?? {};
      const tags = Array.isArray(fm.tags) ? fm.tags : typeof fm.tags === 'string' && fm.tags ? [fm.tags] : null;
      const requires = {};
      if (fm.tools) requires.tools = fm.tools;
      if (fm.model) requires.model = fm.model;
      artifacts.push({
        ...base,
        id: `${entry.name}/${type}/${slug}`,
        type,
        name: type === 'command' ? slug : fm.name || slug,
        title: fm.title || null,
        description: fm.description || '',
        category: fm.category || base.category,
        tags: tags ?? base.tags,
        status: fm.status || status,
        version: pluginArtifact.version,
        path: file,
        examples: Array.isArray(fm.examples) ? fm.examples : fm.examples ? [fm.examples] : [],
        argumentHint: fm['argument-hint'] || null,
        requires: Object.keys(requires).length ? requires : null,
        frontmatter: data,
        key: keyPrefix ? dirKey(keyPrefix) : source.key(file),
      });
    };

    for (const file of plugin.files) {
      const rel = file.slice(plugin.dir.length + 1);
      let m;
      if ((m = /^skills\/([^/]+)\/SKILL\.md$/.exec(rel))) {
        addMarkdown('skill', m[1], file, `${plugin.dir}/skills/${m[1]}/`);
      } else if ((m = /^agents\/([^/]+)\.md$/.exec(rel))) {
        addMarkdown('agent', m[1], file);
      } else if ((m = /^commands\/([^/]+)\.md$/.exec(rel))) {
        addMarkdown('command', m[1], file);
      } else if (rel === 'hooks/hooks.json') {
        const json = safeJson(source, file, issues);
        for (const [event, config] of Object.entries(json?.hooks ?? {})) {
          const matchers = (Array.isArray(config) ? config : []).map((c) => c?.matcher).filter(Boolean);
          artifacts.push({
            ...base,
            id: `${entry.name}/hook/${event}`,
            type: 'hook',
            name: event,
            title: null,
            description: `Runs on ${event}${matchers.length ? ` for ${matchers.join(', ')}` : ''}`,
            version: pluginArtifact.version,
            path: file,
            examples: [],
            requires: null,
            key: JSON.stringify(config),
          });
        }
      } else if (rel === '.mcp.json') {
        const json = safeJson(source, file, issues);
        const servers = json?.mcpServers ?? json ?? {};
        for (const [server, config] of Object.entries(servers)) {
          if (!config || typeof config !== 'object') continue;
          const env = Object.keys(config.env ?? {});
          artifacts.push({
            ...base,
            id: `${entry.name}/mcp/${server}`,
            type: 'mcp',
            name: server,
            title: null,
            description: config.description ?? `MCP server ${server}${config.url ? ` (${config.url})` : ''}`,
            version: pluginArtifact.version,
            path: file,
            examples: [],
            requires: env.length ? { env } : null,
            key: JSON.stringify(config),
          });
        }
      }
    }
  }

  return { marketplace, plugins, artifacts, issues };
}

// ---------------------------------------------------------------------------
// Validation (policy on top of `claude plugin validate`).
// ---------------------------------------------------------------------------

export function loadTaxonomy(root) {
  return JSON.parse(readFileSync(join(root, TAXONOMY_PATH), 'utf8'));
}

export function validate(root) {
  const source = fsSource(root);
  const model = readModel(source);
  const issues = [...model.issues];
  const error = (path, message) => issues.push({ level: 'error', path, message });
  const warn = (path, message) => issues.push({ level: 'warning', path, message });
  if (!model.marketplace) return { model, issues };

  let taxonomy;
  try {
    taxonomy = loadTaxonomy(root);
  } catch (e) {
    error(TAXONOMY_PATH, `Cannot read taxonomy: ${e.message}`);
    return { model, issues };
  }
  const categories = new Set(taxonomy.categories.map((c) => c.id));
  const tags = new Set(taxonomy.tags);

  const checkTaxonomy = (path, category, tagList, status) => {
    if (category != null && !categories.has(category)) error(path, `Unknown category "${category}" (see ${TAXONOMY_PATH})`);
    for (const t of tagList ?? []) if (!tags.has(t)) error(path, `Unknown tag "${t}" (add it to ${TAXONOMY_PATH})`);
    if (status != null && !STATUSES.includes(status)) error(path, `status must be one of ${STATUSES.join(', ')}`);
  };

  const { marketplace } = model;
  if (!Array.isArray(marketplace.plugins)) error(MARKETPLACE_PATH, '"plugins" must be an array');
  const names = model.plugins.map((p) => p.name);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  if (names.join('\n') !== sorted.join('\n')) error(MARKETPLACE_PATH, 'Plugin entries must be sorted by name');
  for (const dup of names.filter((n, i) => names.indexOf(n) !== i)) error(MARKETPLACE_PATH, `Duplicate plugin "${dup}"`);

  for (const plugin of model.plugins) {
    const { entry, name } = plugin;
    const at = `${MARKETPLACE_PATH} → ${name}`;
    if (!KEBAB.test(name)) error(at, 'Plugin name must be kebab-case');
    if (RESERVED_NAMES.includes(name) || RESERVED_PREFIXES.some((p) => name.startsWith(p))) error(at, 'Plugin name is reserved');
    if (!entry.category) error(at, '"category" is required');
    if (!Array.isArray(entry.tags) || entry.tags.length < 1 || entry.tags.length > 6) error(at, '"tags" must list 1–6 tags');
    const desc = entry.description ?? '';
    if (desc.length < 20 || desc.length > 300) error(at, '"description" must be 20–300 characters');
    checkTaxonomy(at, entry.category, entry.tags, entry.metadata?.status);

    if (typeof entry.source !== 'string') {
      const s = entry.source ?? {};
      if (['github', 'url', 'git-subdir'].includes(s.source) && !/^[0-9a-f]{40}$/.test(s.sha ?? '')) {
        error(at, 'External git sources must be pinned to a full 40-character "sha"');
      }
      continue;
    }

    if (!entry.source.startsWith('./') || entry.source.split('/').includes('..')) {
      error(at, 'Relative "source" must start with "./" and must not contain ".."');
      continue;
    }
    const dir = plugin.dir;
    if (!plugin.files.length) {
      error(at, `Source directory "${entry.source}" does not exist or is empty`);
      continue;
    }
    if (dir.split('/').at(-1) !== name) error(at, `Folder name must match the plugin name ("${name}")`);
    if (entry.version != null) error(at, 'Do not set "version" in marketplace.json; set it in plugin.json only');

    const manifestPath = `${dir}/.claude-plugin/plugin.json`;
    const manifest = plugin.manifest;
    if (!manifest) {
      error(manifestPath, 'plugin.json is required');
    } else {
      if (manifest.name !== name) error(manifestPath, `"name" must equal the marketplace entry name "${name}"`);
      if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(manifest.version ?? '')) error(manifestPath, '"version" must be semver (e.g. 1.0.0)');
      for (const key of ['commands', 'agents', 'skills']) {
        if (manifest[key] != null) error(manifestPath, `"${key}" overrides default folders, which the site catalog does not read; use ${key}/`);
      }
      for (const key of ['hooks', 'mcpServers']) {
        if (manifest[key] != null) warn(manifestPath, `"${key}" in plugin.json is not shown in the site catalog; prefer ${key === 'hooks' ? 'hooks/hooks.json' : '.mcp.json'}`);
      }
    }

    const rel = (f) => f.slice(dir.length + 1);
    for (const f of plugin.files) {
      const r = rel(f);
      if (r.startsWith('.claude-plugin/') && r !== '.claude-plugin/plugin.json') error(f, 'Only plugin.json belongs in .claude-plugin/; move components to the plugin root');
      if (r.startsWith('bin/')) error(f, 'Use scripts/ instead of a top-level bin/ (bin/ blocks claude.ai org distribution)');
      if (r === 'CLAUDE.md') error(f, 'CLAUDE.md inside a plugin is not loaded; put instructions in a skill');
      if (f.includes('\\')) error(f, 'Paths must use forward slashes');
      if (TEXT_FILE.test(f)) {
        const lines = (source.read(f) ?? '').split('\n');
        const at = lines.findIndex((l) => PRODUCT_REFERENCES.test(l));
        if (at !== -1) error(`${f}:${at + 1}`, `Product-specific reference "${lines[at].match(PRODUCT_REFERENCES)[0]}"; plugins must stay product-neutral`);
        // A plugin that states its own version (e.g. a "Generated-by: <name>@1.2.3"
        // stamp in an agent prompt) must state the current one. The changelog is history.
        const version = plugin.manifest?.version;
        if (version && r !== 'CHANGELOG.md') {
          const self = new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}@(\\d+\\.\\d+\\.\\d+)(?![\\w.-])`);
          lines.forEach((l, i) => {
            const m = self.exec(l);
            if (m && m[1] !== version) error(`${f}:${i + 1}`, `States ${name}@${m[1]} but plugin.json says ${version}; update it with the version bump`);
          });
        }
      }
    }
    if (!plugin.files.includes(`${dir}/README.md`)) error(dir, 'README.md is required');
    if (!plugin.files.includes(`${dir}/CHANGELOG.md`)) warn(dir, 'CHANGELOG.md is recommended (feeds What\'s New)');
  }

  for (const a of model.artifacts) {
    if (!['skill', 'agent', 'command'].includes(a.type)) continue;
    if (!a.frontmatter) {
      error(a.path, 'Missing YAML frontmatter');
      continue;
    }
    const required = a.type === 'command' ? ['description'] : ['name', 'description'];
    for (const key of required) if (!a.frontmatter[key]) error(a.path, `Frontmatter "${key}" is required`);
    if (a.description.length > 300) warn(a.path, 'description is longer than 300 characters and will be truncated on the site');
    checkTaxonomy(a.path, a.frontmatter.category ?? null, a.frontmatter.tags ? a.tags : [], a.frontmatter.status ?? null);
  }

  const listed = new Set(model.plugins.map((p) => p.dir).filter(Boolean));
  const folders = new Set(source.files.filter((f) => f.split('/').length > 2).map((f) => f.split('/').slice(0, 2).join('/')));
  for (const folder of folders) if (!listed.has(folder)) error(folder, 'Plugin folder is not listed in marketplace.json');

  return { model, issues };
}

// ---------------------------------------------------------------------------
// History: What's New events from git, newest first.
// ---------------------------------------------------------------------------

function listCommits(root) {
  try {
    return git(root, ['log', '--reverse', '--first-parent', '--format=%H%x1f%cI%x1f%s', '--', 'plugins', MARKETPLACE_PATH])
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [sha, date, subject] = line.split('\x1f');
        return { sha, date, subject };
      });
  } catch {
    return []; // not a git repo, or no commits yet
  }
}

/** Keep a Changelog sections: [{ version, date, notes }], newest first as written. */
export function parseChangelog(text) {
  if (!text) return [];
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const head = /^##\s*\[?v?([^\]\s]+)\]?(?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/.exec(line);
    if (head) { entries.push({ version: head[1], date: head[2] ?? null, notes: [] }); continue; }
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet && entries.length) entries.at(-1).notes.push(bullet[1].trim());
  }
  return entries.filter((e) => /^\d/.test(e.version));
}

function changelogNote(text, version) {
  if (!text || !version) return null;
  const lines = text.split(/\r?\n/);
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const start = lines.findIndex((l) => new RegExp(`^##\\s*\\[?v?${escaped}\\]?(\\s|$)`).test(l));
  if (start < 0) return null;
  const bullets = [];
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break;
    const m = /^\s*[-*]\s+(.*)$/.exec(line);
    if (m) bullets.push(m[1].trim());
  }
  if (!bullets.length) return null;
  return bullets.slice(0, 3).join('; ') + (bullets.length > 3 ? ' …' : '');
}

export function readHistory(root) {
  const blobCache = new Map();
  const events = [];
  const pending = new Map(); // plugin → artifact ids changed since its last version bump
  let prev = new Map();

  for (const commit of listCommits(root)) {
    const source = gitSource(root, commit.sha, blobCache);
    const model = readModel(source);
    const cur = new Map(model.artifacts.map((a) => [a.id, a]));
    const pluginId = (name) => `${name}/plugin/${name}`;
    const newPlugins = new Set([...cur.values()].filter((a) => a.type === 'plugin' && !prev.has(a.id)).map((a) => a.plugin));
    const goneP = new Set([...prev.values()].filter((a) => a.type === 'plugin' && !cur.has(a.id)).map((a) => a.plugin));

    const event = (kind, a, extra = {}) => ({
      id: `${commit.sha.slice(0, 7)}:${a.id}:${kind}`,
      kind,
      artifactId: a.id,
      type: a.type,
      name: a.name,
      title: a.title,
      plugin: a.plugin,
      description: a.description,
      date: commit.date,
      commit: commit.sha,
      note: commit.subject,
      ...extra,
    });

    // Components first, so a version bump in the same commit picks up their changes.
    const ordered = [...cur.values()].sort((x, y) => (x.type === 'plugin') - (y.type === 'plugin'));
    for (const a of ordered) {
      const old = prev.get(a.id);
      if (!old) {
        if (a.type === 'plugin') {
          const includes = [...cur.values()].filter((x) => x.plugin === a.plugin && x.type !== 'plugin').map((x) => x.id);
          events.push(event('new', a, { includes, toVersion: a.version }));
        } else if (!newPlugins.has(a.plugin)) {
          events.push(event('new', a));
        }
        continue;
      }
      // Components that inherit a newly deprecated plugin's status are covered by the plugin's entry.
      const pluginJustDeprecated =
        a.type !== 'plugin' && cur.get(pluginId(a.plugin))?.status === 'deprecated' && prev.get(pluginId(a.plugin))?.status !== 'deprecated';
      if (a.status === 'deprecated' && old.status !== 'deprecated' && !pluginJustDeprecated) events.push(event('deprecated', a));
      if (a.type === 'plugin') {
        if (a.version && a.version !== old.version) {
          const plugin = model.plugins.find((p) => p.name === a.plugin);
          const note = plugin?.dir ? changelogNote(source.read(`${plugin.dir}/CHANGELOG.md`), a.version) : null;
          events.push(event('updated', a, {
            fromVersion: old.version,
            toVersion: a.version,
            changed: [...(pending.get(a.plugin) ?? [])],
            note: note ?? commit.subject,
          }));
          pending.delete(a.plugin);
        }
      } else if (a.key !== old.key) {
        if (cur.get(pluginId(a.plugin))?.version) {
          if (!pending.has(a.plugin)) pending.set(a.plugin, new Set());
          pending.get(a.plugin).add(a.id);
        } else {
          events.push(event('updated', a));
        }
      }
    }
    for (const a of prev.values()) {
      if (cur.has(a.id)) continue;
      if (a.type === 'plugin' || !goneP.has(a.plugin)) events.push(event('removed', a));
    }
    prev = cur;
  }

  // Dates per artifact, derived from the events (chronological order).
  const dates = new Map();
  const touch = (id, field, date) => {
    const d = dates.get(id) ?? { addedAt: null, updatedAt: null };
    if (field === 'addedAt' && !d.addedAt) d.addedAt = date;
    if (field === 'updatedAt') d.updatedAt = date;
    dates.set(id, d);
  };
  for (const e of events) {
    if (e.kind === 'new') {
      touch(e.artifactId, 'addedAt', e.date);
      for (const id of e.includes ?? []) touch(id, 'addedAt', e.date);
    } else if (e.kind === 'updated') {
      touch(e.artifactId, 'updatedAt', e.date);
      for (const id of e.changed ?? []) touch(id, 'updatedAt', e.date);
    }
  }

  return { events: events.reverse(), dates };
}

// ---------------------------------------------------------------------------
// Site data: catalog.json + changes.json contents.
// ---------------------------------------------------------------------------

export function repoSlug(root) {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  try {
    const url = git(root, ['remote', 'get-url', 'origin']).trim();
    return /github\.com[:/](.+?)(?:\.git)?$/.exec(url)?.[1] ?? null;
  } catch {
    return null;
  }
}

/**
 * An agent's `skills:` list: "plugin:skill" names, or bare names from the agent's
 * own plugin. id is null when the skill is not in this catalog.
 */
function agentSkills(agent, artifacts) {
  const raw = agent.frontmatter?.skills;
  const names = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [];
  return names.map((n) => String(n).trim()).filter(Boolean).map((name) => {
    const [plugin, skill] = name.includes(':') ? name.split(':', 2) : [agent.plugin, name];
    const id = `${plugin}/skill/${skill}`;
    return { name, id: artifacts.some((x) => x.id === id) ? id : null };
  });
}

export function buildSiteData(root, { now = new Date() } = {}) {
  const { model, issues } = validate(root);
  if (!model.marketplace) throw new Error(`Cannot read ${MARKETPLACE_PATH}`);
  const { events, dates } = readHistory(root);
  const repo = repoSlug(root);
  const marketplaceName = model.marketplace.name;
  const blob = (path) => (repo && path ? `https://github.com/${repo}/blob/main/${path}` : null);
  const tree = (path) => (repo && path ? `https://github.com/${repo}/tree/main/${path}` : null);
  const errorPaths = issues.filter((i) => i.level === 'error').map((i) => i.path);

  const artifacts = model.artifacts.map((a) => {
    const plugin = model.plugins.find((p) => p.name === a.plugin);
    const d = dates.get(a.id) ?? {};
    const addedAt = d.addedAt ?? null;
    const updatedAt = d.updatedAt ?? addedAt;
    const examples = a.type === 'plugin'
      ? model.artifacts.filter((x) => x.plugin === a.plugin).flatMap((x) => x.examples)
      : a.examples;
    const quality = {
      validManifest: !errorPaths.some((p) => p.includes(plugin?.dir ?? `→ ${a.plugin}`) || p.endsWith(`→ ${a.plugin}`)),
      hasReadme: Boolean(plugin?.files.includes(`${plugin.dir}/README.md`)),
      hasExamples: examples.length > 0,
      recentlyUpdated: Boolean(updatedAt && now - new Date(updatedAt) < 90 * DAY),
    };
    quality.score =
      (quality.validManifest ? 30 : 0) +
      (quality.hasReadme ? 25 : 0) +
      (quality.hasExamples ? 20 : 0) +
      (quality.recentlyUpdated ? 15 : 0) +
      (a.description.length >= 40 ? 10 : 0);

    return {
      id: a.id,
      type: a.type,
      name: a.name,
      title: a.title,
      description: a.description.length > 300 ? `${a.description.slice(0, 299)}…` : a.description,
      plugin: a.plugin,
      category: a.category,
      tags: a.tags,
      author: a.author,
      version: a.version,
      addedAt,
      updatedAt,
      status: a.status,
      installCommand: `/plugin install ${a.plugin}@${marketplaceName}`,
      requires: a.requires,
      examples: a.examples,
      argumentHint: a.argumentHint ?? null,
      // Agents: the skills preloaded through `skills:` in the frontmatter, as catalog ids where they resolve.
      skills: a.type === 'agent' ? agentSkills(a, model.artifacts) : undefined,
      sourceUrl: a.type === 'plugin' ? (plugin?.dir ? tree(plugin.dir) : null) : blob(a.path),
      quality,
    };
  });

  const counts = Object.fromEntries(ARTIFACT_TYPES.map((t) => [t, artifacts.filter((a) => a.type === t).length]));

  // Content for the detail pages. Kept out of catalog.json, which stays an index.
  const read = (path) => { try { return readFileSync(join(root, path), 'utf8'); } catch { return null; } };
  const details = { artifacts: {}, plugins: {} };
  for (const plugin of model.plugins) {
    if (!plugin.dir) continue;
    details.plugins[plugin.name] = {
      readme: read(`${plugin.dir}/README.md`),
      readmePath: `${plugin.dir}/README.md`,
      changelog: parseChangelog(read(`${plugin.dir}/CHANGELOG.md`)),
      dependencies: (Array.isArray(plugin.manifest?.dependencies) ? plugin.manifest.dependencies : [])
        .map((d) => (typeof d === 'string' ? { name: d, range: null } : { name: d?.name, range: d?.version ?? null }))
        .filter((d) => typeof d.name === 'string'),
    };
  }
  for (const a of model.artifacts) {
    const plugin = model.plugins.find((p) => p.name === a.plugin);
    if (!plugin?.dir || a.type === 'plugin') continue;
    const file = (path) => ({ path: path.slice(plugin.dir.length + 1), url: blob(path) });
    let markdown = null;
    let files = [file(a.path)];
    if (a.type === 'skill' || a.type === 'agent' || a.type === 'command') {
      markdown = parseFrontmatter(read(a.path) ?? '').body.trim();
      if (a.type === 'skill') {
        const dir = a.path.slice(0, a.path.lastIndexOf('/') + 1);
        files = plugin.files.filter((f) => f.startsWith(dir)).sort((x, y) => (x === a.path ? -1 : y === a.path ? 1 : x.localeCompare(y))).map(file);
      }
    } else {
      // Hooks and MCP servers: show their configuration.
      let config = null;
      try { config = JSON.parse(a.key); } catch { /* not JSON */ }
      if (config) markdown = `\`\`\`json\n${JSON.stringify(config, null, 2)}\n\`\`\``;
    }
    details.artifacts[a.id] = { markdown, markdownPath: a.path, files, event: a.type === 'hook' ? a.name : null };
  }

  return {
    details,
    catalog: {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: now.toISOString(),
      marketplace: {
        name: marketplaceName,
        description: model.marketplace.description ?? model.marketplace.metadata?.description ?? '',
        owner: model.marketplace.owner ?? null,
        repo,
      },
      counts,
      artifacts,
    },
    changes: { schemaVersion: SCHEMA_VERSION, generatedAt: now.toISOString(), entries: events },
    issues,
  };
}
