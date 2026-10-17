import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { errorBanner, fetchStars, fillTemplate, loadSiteData } from './scripts/site-data.mjs';

// SITE_ORIGIN and SITE_BASE_PATH come from actions/configure-pages in CI
// (e.g. https://bognen.github.io and /dev-digest-ai-marketplace). Locally the
// site is served from the root.
const base = (process.env.SITE_BASE_PATH || '/').replace(/\/?$/, '/');

// Dev server: render each page on the server like the production prerender,
// re-reading the repository on every page load so new plugins show up at once.
function devServerRendering(): Plugin {
  let stars: Promise<number | null> | null = null;
  return {
    name: 'dev-server-rendering',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith(base) && url.pathname !== base.slice(0, -1)) return next();
        const path = url.pathname.slice(base.length);
        try {
          if (path === 'catalog.json' || path === 'changes.json') {
            const data = loadSiteData({ strict: false });
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            return res.end(JSON.stringify(path === 'catalog.json' ? data.catalog : data.changes));
          }
          const isPage = !/\.\w+$/.test(path) || path.endsWith('.html');
          if (!isPage || !req.headers.accept?.includes('text/html')) return next();

          const data = loadSiteData({ strict: false });
          if (data.errors.length) server.config.logger.warn(`Catalog has ${data.errors.length} error(s):\n  ${data.errors.join('\n  ')}`, { timestamp: true });
          stars ??= fetchStars(data.catalog.marketplace.repo);
          data.stars = await stars;
          const template = await server.transformIndexHtml(url.pathname, readFileSync('index.html', 'utf8'));
          const { render, matchRoute } = await server.ssrLoadModule('/src/entry-server.tsx');
          const route = matchRoute(path);
          res.statusCode = route.id === '404' ? 404 : 200;
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          const html = fillTemplate(template, render(route.id, data, { origin: null }));
          res.end(html.replace('</body>', `${errorBanner(data.errors)}</body>`));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

// `vite preview`: serve dist/ the way GitHub Pages does — folders resolve to
// their index.html, and anything missing gets 404.html with a 404 status.
function previewLikePages(): Plugin {
  return {
    name: 'preview-like-pages',
    configurePreviewServer(server) {
      const dist = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith(base)) return next();
        const path = decodeURIComponent(url.pathname.slice(base.length));
        const file = join(dist, path);
        if (existsSync(file) && statSync(file).isFile()) return next();
        const index = join(file, 'index.html');
        if (existsSync(index)) {
          if (!url.pathname.endsWith('/')) {
            res.writeHead(301, { Location: `${url.pathname}/${url.search}` });
            return res.end();
          }
          req.url = `${url.pathname}index.html${url.search}`;
          return next();
        }
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(readFileSync(join(dist, '404.html')));
      });
    },
  };
}

export default defineConfig({
  base,
  appType: 'custom',
  plugins: [react(), devServerRendering(), previewLikePages()],
  build: { outDir: 'dist', emptyOutDir: true },
});
