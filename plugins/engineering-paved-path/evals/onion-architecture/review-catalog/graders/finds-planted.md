---
type: llm
weight: 2
---

The review must report every planted layering violation below. A violation counts as reported when the response names the right file and either a line within one line of a listed location or a description that clearly matches.

- adapters/search imports slugify from modules/catalog/helpers. (`adapters/search/index.ts:3`, `adapters/search/index.ts:11`)
- CatalogService imports ElasticSearchIndex from adapters/index.js and instantiates it. (`modules/catalog/service.ts:2`, `modules/catalog/service.ts:16-23`)
- GET /catalog/:id validates the id by hand with a regex test instead of schema.params. (`modules/catalog/routes.ts:32-37`)
- CatalogService.page imports CatalogListResponse from @acme/contracts and parses the response envelope in the service. (`modules/catalog/service.ts:1`, `modules/catalog/service.ts:31-34`)
- constants.ts reads process.env.CATALOG_PAGE_SIZE. (`modules/catalog/constants.ts:1`)

PASS if every violation above is reported. FAIL if any is missing.
