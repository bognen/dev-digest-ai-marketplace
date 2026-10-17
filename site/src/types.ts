// Shapes passed from the build (src/server/pages.ts) to the React pages.
// Everything here is plain JSON: it is embedded in each page and hydrated.

export type RouteId = 'home' | 'search' | 'get-started' | 'whats-new' | '404';

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

export interface PageData {
  route: RouteId;
  site: SiteInfo;
  props: HomeProps | WhatsNewProps | SearchProps | Record<string, never>;
}
