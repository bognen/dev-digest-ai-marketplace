// Server render: used by scripts/prerender.mjs at build time and by the dev server.
import { renderToString } from 'react-dom/server';
import { App } from './App';
import { LANG, t, type MessageKey } from './i18n';
import { pageData, type SiteData } from './server/pages';
import type { RouteId } from './types';

// title and description are keys in src/i18n/en.json; descriptions get {name}.
export const ROUTES: { id: RouteId; path: string; file: string; title?: MessageKey; description?: MessageKey }[] = [
  { id: 'home', path: '', file: 'index.html' },
  { id: 'search', path: 'search/', file: 'search/index.html', title: 'pages.search.title', description: 'pages.search.description' },
  { id: 'get-started', path: 'get-started/', file: 'get-started/index.html', title: 'pages.getStarted.title', description: 'pages.getStarted.description' },
  { id: 'whats-new', path: 'whats-new/', file: 'whats-new/index.html', title: 'pages.whatsNew.title', description: 'pages.whatsNew.description' },
  { id: '404', path: '404.html', file: '404.html', title: 'pages.notFound.title' },
];

/** Route for a path relative to the base, e.g. "whats-new" or "whats-new/". */
export function matchRoute(path: string) {
  const clean = path.replace(/index\.html$/, '').replace(/\/?$/, '/');
  return ROUTES.find((r) => r.path && clean === r.path) ?? (clean === '/' ? ROUTES[0] : ROUTES.find((r) => r.id === '404')!);
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function render(routeId: RouteId, data: SiteData, { origin }: { origin: string | null }) {
  const route = ROUTES.find((r) => r.id === routeId)!;
  const page = pageData(routeId, data);
  const siteName = t('site.title', { name: page.site.name });
  const title = route.title ? t('site.pageTitle', { page: t(route.title), site: siteName }) : siteName;
  const description = route.description
    ? t(route.description, { name: page.site.name })
    : page.site.description || t('site.description');
  const canonical = origin && routeId !== '404' ? new URL(import.meta.env.BASE_URL + route.path, origin).href : null;

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
