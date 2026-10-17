// Build-time data for the site: the catalog and What's New, read from the
// repository through scripts/lib/catalog.mjs (the same code CI validates with),
// plus the site's own settings. Used by the prerender step and the dev server.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import { buildSiteData } from '../../scripts/lib/catalog.mjs';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (file) => JSON.parse(readFileSync(resolve(SITE_DIR, 'data', file), 'utf8'));

const escapeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Markdown from the repository (READMEs, SKILL.md and agent bodies) to HTML for
// the detail pages. Relative links point at the file on GitHub, raw HTML is
// shown as text, and a leading "# Title" is dropped because the page has its own.
export function markdownToHtml(markdown, path, repo) {
  if (!markdown) return null;
  const dir = path.slice(0, path.lastIndexOf('/') + 1);
  const resolveHref = (href) => {
    if (!href || !repo || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(href)) return href;
    const target = decodeURI(new URL(href, `https://repo.invalid/${dir}`).pathname.slice(1));
    return `https://github.com/${repo}/blob/main/${target}`;
  };
  const marked = new Marked({
    gfm: true,
    async: false,
    walkTokens(token) {
      if (token.type === 'link') token.href = resolveHref(token.href);
      if (token.type === 'image') token.href = `${resolveHref(token.href)}${/^https:\/\/github\.com\//.test(resolveHref(token.href)) ? '?raw=true' : ''}`;
    },
    renderer: { html: (token) => escapeText(token.text) },
  });
  return marked.parse(markdown.replace(/^\s*#\s+[^\n]*\n+/, ''));
}

const inline = new Marked({ gfm: true, async: false, renderer: { html: (token) => escapeText(token.text) } });

function renderDetails(details, repo) {
  const artifacts = Object.fromEntries(Object.entries(details.artifacts).map(([id, d]) => [id, { ...d, html: markdownToHtml(d.markdown, d.markdownPath, repo) }]));
  const plugins = Object.fromEntries(Object.entries(details.plugins).map(([name, d]) => [name, {
    ...d,
    readmeHtml: markdownToHtml(d.readme, d.readmePath, repo),
    changelog: d.changelog.map((e) => ({ version: e.version, date: e.date, notesHtml: e.notes.map((n) => inline.parseInline(n)) })),
  }]));
  return { artifacts, plugins };
}

// strict (the build): an invalid catalog stops the build, so it never deploys.
// Not strict (the dev server): render what is there and report the errors.
export function loadSiteData({ repoRoot = process.env.REPO_ROOT || resolve(SITE_DIR, '..'), strict = true } = {}) {
  const data = buildSiteData(repoRoot);
  const errors = data.issues.filter((i) => i.level === 'error').map((e) => `${e.path}: ${e.message}`);
  if (errors.length && strict) {
    throw new Error(`The catalog is invalid; run node scripts/validate-marketplace.mjs\n${errors.map((e) => `  ${e}`).join('\n')}`);
  }
  return {
    errors,
    catalog: data.catalog,
    changes: data.changes,
    details: renderDetails(data.details, data.catalog.marketplace.repo),
    settings: readJson('settings.json'),
    collections: readJson('collections.json').collections,
    categories: readJson('taxonomy.json').categories.map((c) => c.id),
    stars: /** @type {number | null} */ (null),
  };
}

// GitHub star count for the header; null when the API is unreachable.
export async function fetchStars(repo) {
  if (!repo) return null;
  try {
    const headers = { Accept: 'application/vnd.github+json' };
    if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(4000) });
    return res.ok ? ((await res.json()).stargazers_count ?? null) : null;
  } catch {
    return null;
  }
}

// Fills the HTML template (index.html after Vite has processed it) with one rendered page.
export function fillTemplate(template, { lang, head, html, data }) {
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html)
    .replace('<!--app-data-->', `<script id="page-data" type="application/json">${data}</script>`);
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Dev server only: lists catalog errors at the bottom of the page. It sits
// outside #root, so React hydration doesn't see it.
export function errorBanner(errors) {
  if (!errors.length) return '';
  const style = 'position:fixed;inset:auto 0 0 0;z-index:100;max-height:40vh;overflow:auto;margin:0;padding:12px 16px;'
    + 'background:#3b0d0d;color:#ffd7d7;font:13px/1.5 ui-monospace,monospace;border-top:2px solid #ff6b6b';
  const items = errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('');
  return `<aside data-dev-catalog-errors role="alert" style="${style}"><strong>The catalog has ${errors.length} error(s). `
    + `The build and deploy will fail until they are fixed (node scripts/validate-marketplace.mjs).</strong>`
    + `<ul style="margin:6px 0 0;padding-left:20px">${items}</ul></aside>`;
}
