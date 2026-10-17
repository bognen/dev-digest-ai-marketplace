// Server render: used by scripts/prerender.mjs at build time and by the dev server.
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { LANG, t, type MessageKey } from './i18n';
import { detailPath } from './lib/site';
import { pageData, type SiteData } from './server/pages';
import type { RouteId } from './types';

export interface Route {
  id: RouteId;
  path: string;
  file: string;
  /** title and description are keys in src/i18n/en.json; descriptions get {name}. */
  title?: MessageKey;
  description?: MessageKey;
  /** Detail pages: the catalog id the page is about. */
  artifactId?: string;
}

export const ROUTES: Route[] = [
  { id: 'home', path: '', file: 'index.html' },
  { id: 'search', path: 'search/', file: 'search/index.html', title: 'pages.search.title', description: 'pages.search.description' },
  { id: 'get-started', path: 'get-started/', file: 'get-started/index.html', title: 'pages.getStarted.title', description: 'pages.getStarted.description' },
  { id: 'whats-new', path: 'whats-new/', file: 'whats-new/index.html', title: 'pages.whatsNew.title', description: 'pages.whatsNew.description' },
  { id: '404', path: '404.html', file: '404.html', title: 'pages.notFound.title' },
];

/** Every page: the fixed ones plus a detail page per plugin, skill, agent, command, hook and MCP server. */
export function routes(data: SiteData): Route[] {
  const details = data.catalog.artifacts.map((a: { id: string; type: string }) => {
    const path = decodeURIComponent(detailPath(a.id));
    return { id: (a.type === 'plugin' ? 'plugin' : 'artifact') as RouteId, path, file: `${path}index.html`, artifactId: a.id };
  });
  return [...ROUTES, ...details];
}

/** Route for a path relative to the base, e.g. "whats-new" or "plugins/x/agent/y/". */
export function matchRoute(path: string, data: SiteData): Route {
  const clean = decodeURIComponent(path.replace(/index\.html$/, '')).replace(/\/?$/, '/');
  const all = routes(data);
  return all.find((r) => r.path && clean === r.path) ?? (clean === '/' ? all[0] : all.find((r) => r.id === '404')!);
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function render(route: Route, data: SiteData, { origin }: { origin: string | null }) {
  const page = pageData(route.id, data, route.artifactId);
  const siteName = t('site.title', { name: page.site.name });
  const subject = route.artifactId ? data.catalog.artifacts.find((a: { id: string }) => a.id === route.artifactId) : null;
  const pageName = subject ? subject.title || subject.name : route.title ? t(route.title) : null;
  const title = pageName ? t('site.pageTitle', { page: pageName, site: siteName }) : siteName;
  const description = subject?.description
    || (route.description ? t(route.description, { name: page.site.name }) : page.site.description || t('site.description'));
  const canonical = origin && page.route !== '404' ? new URL(import.meta.env.BASE_URL + encodeURI(route.path), origin).href : null;

  const head = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    `<meta property="og:type" content="website" />`,
    canonical && `<link rel="canonical" href="${escapeHtml(canonical)}" />`,
    canonical && `<meta property="og:url" content="${escapeHtml(canonical)}" />`,
  ].filter(Boolean).join('\n    ');

  return {
    lang: LANG,
    head,
    html: renderToString(<App {...page} />),
    // Escape "<" so the JSON can't close its <script>.
    data: JSON.stringify(page).replace(/</g, '\\u003c'),
  };
}
