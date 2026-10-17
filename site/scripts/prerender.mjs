// Renders every route to static HTML in dist/ after the client and SSR builds,
// and writes catalog.json / changes.json next to them.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { fetchStars, fillTemplate, loadSiteData } from './site-data.mjs';

const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(SITE_DIR, 'dist');
const SSR = resolve(SITE_DIR, '.ssr');

const data = loadSiteData();
data.stars = await fetchStars(data.catalog.marketplace.repo);

const { render, routes } = await import(pathToFileURL(resolve(SSR, 'entry-server.js')).href);
const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');
const origin = process.env.SITE_ORIGIN || null;

const all = routes(data);
for (const route of all) {
  const out = render(route, data, { origin });
  const file = resolve(DIST, route.file);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, fillTemplate(template, out));
  console.log(`  ${route.file}`);
}
writeFileSync(resolve(DIST, 'catalog.json'), JSON.stringify(data.catalog));
writeFileSync(resolve(DIST, 'changes.json'), JSON.stringify(data.changes));
rmSync(SSR, { recursive: true, force: true });
console.log(`Prerendered ${all.length} pages, catalog.json and changes.json`);
