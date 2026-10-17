// Build time only: turns the catalog and What's New data into the props each
// page needs. Only these props are embedded in the HTML, not the whole catalog.
import { CHANGE_TAGS, detailPath, url } from '../lib/site';
import type {
  ArtifactDetailProps, ArtifactView, Badge, CardInfo, ChangeView, DetailView, HomeProps, PageData, PluginDetailProps, PluginSummary, RouteId,
  SearchProps, SiteInfo, WhatsNewProps,
} from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface SiteData {
  catalog: any;
  changes: { entries: any[] };
  /** Detail page content per artifact id and per plugin name (scripts/site-data.mjs). */
  details: { artifacts: Record<string, any>; plugins: Record<string, any> };
  settings: { badgeWindowDays: number; whatsNewStripCount: number };
  collections: { slug: string; title: string; description?: string; plugins: string[] }[];
  /** Category ids from site/data/taxonomy.json, in display order. */
  categories: string[];
  stars: number | null;
}

const DAY = 86_400_000;
const isWithinDays = (iso: string | null | undefined, days: number, now = Date.now()) => !!iso && now - new Date(iso).getTime() < days * DAY;
const idName = (id: string) => id.split('/').slice(1).join(' ').replace(/^(\w+) /, '$1: ');

function siteInfo(data: SiteData): SiteInfo {
  const { marketplace, artifacts, generatedAt } = data.catalog;
  return {
    name: marketplace.name,
    description: marketplace.description || '',
    repo: marketplace.repo ?? null,
    stars: data.stars,
    generatedAt,
    artifactCount: artifacts.length,
  };
}

/** New / Updated (within settings.badgeWindowDays), Beta and Deprecated badges. */
function badgesFor(data: SiteData, artifact: any): Badge[] {
  if (!artifact) return [];
  const days = data.settings.badgeWindowDays;
  const status = artifact.status;
  const live = status !== 'deprecated';
  const isNew = live && isWithinDays(artifact.addedAt, days);
  const isUpdated = live && !isNew && artifact.updatedAt !== artifact.addedAt && isWithinDays(artifact.updatedAt, days);
  const badges: Badge[] = [];
  if (isNew) badges.push({ kind: 'new', cls: CHANGE_TAGS.new });
  if (isUpdated) badges.push({ kind: 'updated', cls: CHANGE_TAGS.updated });
  if (status === 'beta') badges.push({ kind: 'beta', cls: CHANGE_TAGS.beta });
  if (status === 'deprecated') badges.push({ kind: 'deprecated', cls: CHANGE_TAGS.deprecated });
  return badges;
}

function card(data: SiteData, entry: any): CardInfo {
  const removed = entry.kind === 'removed';
  const artifact = removed ? null : data.catalog.artifacts.find((a: any) => a.id === entry.artifactId);
  const status = artifact?.status;
  const badges = badgesFor(data, artifact);
  return {
    type: entry.type,
    name: entry.title || entry.name,
    plugin: entry.plugin,
    href: artifact ? url(detailPath(artifact.id)) : null,
    badges,
    installable: !!artifact,
    deprecated: status === 'deprecated',
    removed,
  };
}

function change(data: SiteData, entry: any): ChangeView {
  const version =
    entry.kind === 'updated' && entry.toVersion
      ? `${entry.fromVersion ?? '—'} → ${entry.toVersion}`
      : entry.kind === 'new' && entry.toVersion
        ? `v${entry.toVersion}`
        : null;
  return {
    kind: entry.kind,
    type: entry.type,
    plugin: entry.plugin,
    date: entry.date,
    name: entry.title || entry.name,
    version,
    note: entry.note || entry.description || null,
    includes: (entry.includes ?? []).map(idName),
    changed: (entry.changed ?? []).map(idName),
    card: card(data, entry),
  };
}

function homeProps(data: SiteData): HomeProps {
  const { counts, artifacts } = data.catalog;
  const starter = data.collections.find((c) => c.slug === 'starter-pack');
  const plugins = (starter?.plugins ?? [])
    .map((name) => artifacts.find((a: any) => a.type === 'plugin' && a.name === name))
    .filter(Boolean)
    .map((p: any) => ({ name: p.name, description: p.description, installCommand: p.installCommand }));
  return {
    counts: { plugin: counts.plugin, skill: counts.skill, agent: counts.agent, command: counts.command },
    starter: { title: starter?.title ?? null, description: starter?.description ?? null, plugins },
    latest: data.changes.entries.slice(0, data.settings.whatsNewStripCount).map((e) => change(data, e)),
  };
}

function whatsNewProps(data: SiteData): WhatsNewProps {
  const entries = data.changes.entries;
  // Group by week (weeks start on Monday, UTC).
  const weekStart = (iso: string) => {
    const d = new Date(iso);
    const day = (d.getUTCDay() + 6) % 7;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day)).toISOString();
  };
  const weeks: WhatsNewProps['weeks'] = [];
  for (const entry of entries) {
    const start = weekStart(entry.date);
    if (weeks.at(-1)?.start !== start) weeks.push({ start, entries: [] });
    weeks.at(-1)!.entries.push(change(data, entry));
  }
  return {
    weeks,
    total: entries.length,
    kinds: ['new', 'updated', 'deprecated', 'removed'],
    types: [...new Set<string>(entries.map((e) => e.type))],
    plugins: [...new Set<string>(entries.map((e) => e.plugin))].sort(),
  };
}

const TYPE_ORDER = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];

function view(data: SiteData, a: any): ArtifactView {
  return {
    id: a.id,
    type: a.type,
    name: a.title || a.name,
    description: a.description,
    plugin: a.plugin,
    category: a.category,
    tags: a.tags ?? [],
    version: a.version,
    updatedAt: a.updatedAt,
    status: a.status,
    installCommand: a.installCommand,
    href: url(detailPath(a.id)),
    badges: badgesFor(data, a),
  };
}

function searchProps(data: SiteData): SearchProps {
  const all = data.catalog.artifacts;
  const artifacts: ArtifactView[] = all.map((a: any) => view(data, a));
  const used = (key: 'category' | 'status') => new Set<string>(all.map((a: any) => a[key]).filter(Boolean));
  const categories = used('category');
  return {
    artifacts,
    types: TYPE_ORDER,
    plugins: [...new Set<string>(all.filter((a: any) => a.type === 'plugin').map((a: any) => a.name))],
    // Taxonomy order, plus any category in use that the taxonomy doesn't list.
    categories: [...new Set([...data.categories, ...categories])],
    statuses: [...new Set(['stable', 'beta', 'deprecated', ...used('status')])],
  };
}

function detailView(data: SiteData, a: any): DetailView {
  const repo = data.catalog.marketplace.repo;
  return {
    ...view(data, a),
    author: a.author ?? null,
    addedAt: a.addedAt ?? null,
    sourceUrl: a.sourceUrl ?? null,
    issueUrl: repo ? `https://github.com/${repo}/issues/new?title=${encodeURIComponent(`[${a.id}] `)}` : null,
  };
}

/** Components of a plugin, by type in display order. */
function components(data: SiteData, plugin: string) {
  return data.catalog.artifacts.filter((a: any) => a.plugin === plugin && a.type !== 'plugin');
}

function summaryOf(items: any[]): PluginSummary[] {
  return TYPE_ORDER.slice(1).map((type) => ({ type, count: items.filter((a) => a.type === type).length })).filter((s) => s.count);
}

const categoryHref = (category: string | null) => (category ? url(`search/?category=${encodeURIComponent(category)}`) : null);
const listOf = (v: unknown) => (Array.isArray(v) ? v.join(', ') : typeof v === 'string' ? v : '');

function artifactProps(data: SiteData, a: any): ArtifactDetailProps {
  const detail = data.details.artifacts[a.id] ?? {};
  const plugin = data.details.plugins[a.plugin] ?? {};
  const rq = a.requires ?? {};
  const requirements: ArtifactDetailProps['requirements'] = [];
  if (rq.tools) requirements.push({ key: 'tools', value: listOf(rq.tools), mono: true });
  if (rq.model) requirements.push({ key: 'model', value: String(rq.model), mono: false });
  if (rq.env?.length) requirements.push({ key: 'env', value: listOf(rq.env), mono: true });
  if (detail.event) requirements.push({ key: 'event', value: detail.event, mono: true });
  if (a.argumentHint) requirements.push({ key: 'arguments', value: a.argumentHint, mono: true });

  // A skill with an argument hint is meant to be typed as a slash command.
  const invocation =
    a.type === 'agent' ? `${a.plugin}:${a.name}`
      : a.type === 'command' || (a.type === 'skill' && a.argumentHint) ? `/${a.name}${a.argumentHint ? ` ${a.argumentHint}` : ''}`
        : null;

  const q = a.quality ?? {};
  const related = data.catalog.artifacts
    .filter((x: any) => x.id !== a.id && x.type !== 'plugin')
    .map((x: any) => ({ x, score: (x.plugin === a.plugin ? 2 : 0) + (x.tags ?? []).filter((t: string) => (a.tags ?? []).includes(t)).length }))
    .filter((r: any) => r.score > 0)
    .sort((r1: any, r2: any) => r2.score - r1.score || r1.x.name.localeCompare(r2.x.name))
    .slice(0, 4)
    .map((r: any) => view(data, r.x));

  return {
    artifact: detailView(data, a),
    pluginHref: url(detailPath(`${a.plugin}/plugin/${a.plugin}`)),
    categoryHref: categoryHref(a.category),
    bodyHtml: detail.html ?? null,
    invocation,
    argumentHint: a.argumentHint ?? null,
    examples: a.examples ?? [],
    requirements,
    files: detail.files ?? [],
    changelog: plugin.changelog ?? [],
    quality: {
      score: q.score ?? 0,
      flags: [
        { key: 'validManifest', ok: !!q.validManifest },
        { key: 'hasReadme', ok: !!q.hasReadme },
        { key: 'hasExamples', ok: !!q.hasExamples },
        { key: 'recentlyUpdated', ok: !!q.recentlyUpdated },
        { key: 'description', ok: (a.description ?? '').length >= 40 },
      ],
    },
    summary: summaryOf(components(data, a.plugin)),
    related,
  };
}

function pluginProps(data: SiteData, a: any): PluginDetailProps {
  const detail = data.details.plugins[a.name] ?? {};
  const items = components(data, a.name);
  const pluginNames = new Set(data.catalog.artifacts.filter((x: any) => x.type === 'plugin').map((x: any) => x.name));
  return {
    plugin: detailView(data, a),
    categoryHref: categoryHref(a.category),
    summary: summaryOf(items),
    groups: TYPE_ORDER.slice(1)
      .map((type) => ({ type, items: items.filter((x: any) => x.type === type).map((x: any) => view(data, x)) }))
      .filter((g) => g.items.length),
    readmeHtml: detail.readmeHtml ?? null,
    changelog: detail.changelog ?? [],
    dependencies: (detail.dependencies ?? []).map((d: any) => ({
      name: d.name,
      range: d.range,
      href: pluginNames.has(d.name) ? url(detailPath(`${d.name}/plugin/${d.name}`)) : null,
    })),
  };
}

export function pageData(route: RouteId, data: SiteData, artifactId?: string): PageData {
  const site = siteInfo(data);
  if (route === 'home') return { route, site, props: homeProps(data) };
  if (route === 'whats-new') return { route, site, props: whatsNewProps(data) };
  if (route === 'search') return { route, site, props: searchProps(data) };
  if (route === 'plugin' || route === 'artifact') {
    const a = data.catalog.artifacts.find((x: any) => x.id === artifactId);
    if (a) return { route, site, props: route === 'plugin' ? pluginProps(data, a) : artifactProps(data, a) };
    return { route: '404', site, props: {} };
  }
  return { route, site, props: {} };
}
