// Shapes passed from the build (src/server/pages.ts) to the React pages.
// Everything here is plain JSON: it is embedded in each page and hydrated.

export type RouteId = 'home' | 'search' | 'get-started' | 'whats-new' | 'plugin' | 'artifact' | '404';

export interface SiteInfo {
  name: string;
  description: string;
  repo: string | null;
  stars: number | null;
  generatedAt: string;
  artifactCount: number;
}

export interface Badge {
  /** Key under "badges" in src/i18n/en.json. */
  kind: 'new' | 'updated' | 'beta' | 'deprecated';
  cls: string;
}

/** What a mini card needs to know about the artifact behind a change. */
export interface CardInfo {
  type: string;
  name: string;
  plugin: string;
  href: string | null;
  badges: Badge[];
  /** The artifact is still in the catalog, so it can be installed. */
  installable: boolean;
  deprecated: boolean;
  removed: boolean;
}

export interface ChangeView {
  kind: 'new' | 'updated' | 'deprecated' | 'removed';
  type: string;
  plugin: string;
  date: string;
  name: string;
  version: string | null;
  note: string | null;
  includes: string[];
  changed: string[];
  card: CardInfo;
}

export interface StarterPack {
  /** From collections.json; null shows the default "Starter pack" heading. */
  title: string | null;
  description: string | null;
  plugins: { name: string; description: string; installCommand: string }[];
}

export interface HomeProps {
  counts: { plugin: number; skill: number; agent: number; command: number };
  starter: StarterPack;
  latest: ChangeView[];
}

export interface WhatsNewProps {
  weeks: { start: string; entries: ChangeView[] }[];
  total: number;
  kinds: string[];
  types: string[];
  plugins: string[];
}

/** One artifact on the results page (a trimmed catalog.json entry). */
export interface ArtifactView {
  id: string;
  type: string;
  name: string;
  description: string;
  plugin: string;
  category: string | null;
  tags: string[];
  version: string | null;
  updatedAt: string | null;
  status: string;
  installCommand: string;
  href: string | null;
  badges: Badge[];
}

export interface SearchProps {
  artifacts: ArtifactView[];
  /** Filter options, in display order. */
  types: string[];
  plugins: string[];
  categories: string[];
  statuses: string[];
}

/** One version section of a plugin's CHANGELOG.md; notes are rendered inline Markdown. */
export interface ChangelogEntry {
  version: string;
  date: string | null;
  notesHtml: string[];
}

/** The artifact or plugin a detail page is about. */
export interface DetailView extends ArtifactView {
  author: string | null;
  addedAt: string | null;
  sourceUrl: string | null;
  issueUrl: string | null;
}

/** "3 skills · 4 agents · 1 hook": what installing the plugin adds. */
export interface PluginSummary {
  type: string;
  count: number;
}

export interface ArtifactDetailProps {
  artifact: DetailView;
  pluginHref: string;
  categoryHref: string | null;
  /** The artifact's Markdown body (or a hook's or MCP server's configuration) as HTML. */
  bodyHtml: string | null;
  /** How to call it, e.g. "/run-plan <plan-path> …" or "sdd-engineering:spec-creator". */
  invocation: string | null;
  argumentHint: string | null;
  examples: string[];
  requirements: { key: 'tools' | 'model' | 'env' | 'event' | 'arguments'; value: string; mono: boolean }[];
  files: { path: string; url: string | null }[];
  changelog: ChangelogEntry[];
  quality: { score: number; flags: { key: 'validManifest' | 'hasReadme' | 'hasExamples' | 'recentlyUpdated' | 'description'; ok: boolean }[] };
  summary: PluginSummary[];
  related: ArtifactView[];
}

export interface PluginDetailProps {
  plugin: DetailView;
  categoryHref: string | null;
  summary: PluginSummary[];
  groups: { type: string; items: ArtifactView[] }[];
  readmeHtml: string | null;
  changelog: ChangelogEntry[];
  /** Plugins this one installs with it (from plugin.json dependencies). */
  dependencies: { name: string; range: string | null; href: string | null }[];
}

export interface PageData {
  route: RouteId;
  site: SiteInfo;
  props: HomeProps | WhatsNewProps | SearchProps | ArtifactDetailProps | PluginDetailProps | Record<string, never>;
}
