import { defineConfig } from 'astro/config';

// SITE_ORIGIN and SITE_BASE_PATH come from actions/configure-pages in CI
// (e.g. https://bognen.github.io and /dev-digest-ai-marketplace). Locally the
// site is served from the root.
export default defineConfig({
  site: process.env.SITE_ORIGIN || undefined,
  base: process.env.SITE_BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
