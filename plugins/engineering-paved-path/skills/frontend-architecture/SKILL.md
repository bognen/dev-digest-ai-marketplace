---
name: frontend-architecture
description: "Frontend code organization for React + Next.js App Router apps: where pages, page components, shared components, hooks, constants, helpers, types, styles and tests live; how to split and name components; where data fetching belongs. Structural decisions only."
metadata:
  tags: frontend, architecture, nextjs, app-router, react, folder-structure, colocation, naming
---

# Frontend Architecture (React + Next.js App Router)

Where code lives and how it is layered in a React/Next.js frontend. Generic
principles are distilled from official docs and reference architectures; sources
and rationale are in [references.md](references.md).

## Your repo's docs come first

This skill gives a **reference layout**. Before applying it, read the frontend
package's own docs (`AGENTS.md` / `CLAUDE.md`, `ARCHITECTURE.md`,
`docs/architecture/**`, or the paths in `architectureDocs` of
`.claude/sdd-engineering.json`). Where they name a different design-system
import path, data layer, styling approach or test layout, **the repo's
convention wins**. Never invent package names or paths; if the repo documents
nothing, apply the reference layout and say so.

Sibling skills (do not duplicate their territory):
- `engineering-paved-path:react-best-practices`: hooks rules, state patterns, memoization, rendering anti-patterns
- `engineering-paved-path:next-best-practices`: RSC boundary mechanics, file conventions, async APIs, caching, bundling
- `engineering-paved-path:react-testing-library`: how to write the tests this skill says where to put

## Where things live (reference layout)

`<web>` is the frontend package root (for example `apps/web/` or `web/`).

| What | Where | Rule |
|---|---|---|
| **Route / page** | `<web>/src/app/<segment>/page.tsx` | **Thin**: import the page-level view, pass params, return it. No feature logic, no styles, no fetching. |
| **Page component** (used by one route) | `src/app/<segment>/_components/<Name>/` | Private folder (`_` prefix = non-routable). Each component gets its own folder. |
| **Sub-component of a page component** | `<Name>/_components/<Child>/` | Nest only while it has exactly one parent; promote when a second route needs it. |
| **Shared app chrome / cross-route components** | `src/components/<kebab-group>/` | Domain-agnostic or used by 2+ routes. A folder is the norm. |
| **Design-system UI** (Button, Badge, Dialog, …) | the repo's design-system package, **imported only through its public barrel** | Never deep-import a primitive's file. New or changed components follow the design system's own docs (for example a showcase or Storybook entry). |
| **Data hooks** (for example TanStack Query) | `src/lib/hooks/<domain>.ts`, re-exported by `src/lib/hooks/index.ts` | The only surface components use for server data; they call the API client. |
| **HTTP client** | `src/lib/api.ts` | One preconfigured client; nothing else calls `fetch` for the API. |
| **API contracts / DTO types** | the shared contracts package, if the repo has one | Never redeclare a DTO locally. |
| **App-wide helpers / providers** | `src/lib/*.ts(x)` (`format.ts`, `theme.tsx`, `providers.tsx`) | Named by domain, never `utils.ts`. |
| **i18n strings** (if the app is localized) | the repo's message files + the i18n hook | No user-visible literals inline. |
| **Tests** | colocated `*.test.ts(x)` next to the source | Test-only harnesses in a `_test/` private folder next to the route; global setup in `src/test/`. No mirrored `test/` tree. Browser journeys belong to the e2e suite. |

## Component folder anatomy (naming)

```
_components/OrderCard/
  index.ts            # forwarder only: export { OrderCard, OrderCard as default } from "./OrderCard"
  OrderCard.tsx       # the component ("use client" only if it needs it)
  styles.ts           # co-located style objects or class maps, if the repo styles this way
  constants.ts        # feature-local constants (SCREAMING_SNAKE_CASE exports)
  helpers.ts          # pure functions for this component (no React, no hooks)
  OrderCard.test.tsx  # colocated test
  _components/        # private sub-components, same shape (only if needed)
```

- **Folder and component file: PascalCase**, matching the exported component
  name. Shared-chrome *group* folders in `src/components/` are kebab-case
  (`app-shell/`) and hold PascalCase component folders inside.
- **Create files only when needed**: `styles.ts`, `constants.ts`, `helpers.ts`
  appear when the component has styles/constants/helpers; do not scaffold
  empty ones. `index.ts` is always present so the import path is
  `./_components/OrderCard`.
- **Barrels:** the per-component `index.ts` forwarder is the only barrel allowed
  in app code (a wide `export *` barrel defeats tree-shaking and causes circular
  imports). Exceptions are deliberate public entry points: the design-system
  barrel and `lib/hooks/index.ts`.
- **Hooks:** `useXxx` camelCase, in `src/lib/hooks/` when they wrap the API;
  a hook used by a single component sits in that component's folder.
- **Imports:** absolute alias `@/…` for `src/` (no `../../../`); the design-system
  barrel for UI; the contracts package for DTOs; `import type` for type-only
  imports. Nesting deeper than ~4 levels is a signal to promote or flatten.

## Core principles

1. **Colocation is the default; sharing is earned.** Place code as close to its
   consumer as possible; extract to a shared location only on demonstrated reuse.
2. **The promotion ladder.** Inside the component → same file → the component's
   folder (`helpers.ts`, `constants.ts`) → the route's `_components/` → shared
   `src/components/` / `src/lib/`. Trigger to promote: a **second route/feature**
   needs it. Demote symmetrically: a "shared" thing used by one route moves in.
3. **Unidirectional imports: shared → components → routes.** `src/lib` and the
   design system import nothing from `src/app`; components in `src/components`
   never import from a route's `_components`; one route never imports another
   route's `_components` (promote instead).
4. **Consistency beats the specific choice.** A mediocre structure applied
   uniformly outperforms a perfect one applied inconsistently.

## Component splitting

- Split on **responsibility, not size**: one concern per component. Treat "many
  props" as a prompt to examine, not a rule.
- **Split signals:** part of it needs reuse; incompatible props; state hard to
  follow; tests unwieldy; constant merge conflicts on one file.
- **Counter-signal:** don't split or abstract speculatively. Duplication beats
  the wrong abstraction.
- **Composition over configuration:** sprouting boolean/variant props → use
  `children`, slots, or compound components. Move state down; lift content up,
  before reaching for `memo`.
- **Mutually exclusive UI states** (loading / error / empty / data) are separate
  early-return branches, not nested ternaries.
- Container/presentational is retired as a rule: logic goes in custom hooks; a
  pure-logic function that calls no hooks is a plain function (no `use` prefix)
  in `helpers.ts`.
- A private subcomponent with exactly one parent may stay in the parent's file;
  move it into `_components/<Child>/` when it is shared, separately tested, or
  contended in reviews.

## Business logic and data placement

| Band | Holds | Tested via |
|------|-------|-----------|
| Components | rendering, event wiring | render tests (RTL) |
| Custom hooks | orchestration: state, effects, query composition | `renderHook` |
| Plain TS modules (`helpers.ts`, `src/lib/*.ts`) | business rules, calculations, validation, mapping | direct unit tests |

- **Components never `fetch`.** Data flows: API client → data hook → component.
  Query keys and fetchers never appear in components.
- **Server state ≠ client state.** The query cache owns freshness and
  invalidation; don't copy query data into local state or a store.
- **Business logic in `useEffect` is the canonical anti-pattern.** Derive at
  render, handle in event handlers, reset with `key`.
- **Contracts:** shapes come from the shared contract types. If a UI-only view
  model is needed, derive it in `helpers.ts`.
- **Client vs server pages:** if the app's data lives behind a separate API and
  depends on a client-side cache, many pages may be `"use client"` by design.
  Keep the *page* file thin regardless; put `"use client"` on the view it
  renders when the page itself needn't be client.

## Constants, helpers, types

- **Constants colocate** in the component folder's `constants.ts`; app-wide
  values go in a named `src/lib/*.ts` module, never one global dumping file.
  No magic numbers/strings inline.
- **`as const` objects + literal unions over enums.**
- **No `utils.ts` grab-bag.** Name helper modules by domain; a helper serving one
  component lives in its `helpers.ts`. Delete helpers orphaned by their last caller.
- **Pure functions live outside the component body** (file level or `helpers.ts`).
- **Types colocate**: prop types in the component file; API/contract types come
  from the contracts package, never re-declared.
- **Styles:** follow the repo's styling system (CSS modules, Tailwind, CSS-in-JS,
  inline styles with CSS variables). Use its tokens; never hard-code colors.

## Next.js App Router

- **`app/` is a thin routing layer.** A `page.tsx` reads like orchestration; real
  code lives in `_components/`, `src/components/`, `src/lib/`.
- **Private folders `_folder`** for non-routable colocated code; **route groups
  `(group)`** for section layouts without changing the URL.
- **`'use client'` at the leaves** where possible: it is a one-way module-graph
  door, and everything imported below it ships to the browser.
- **External HTTP API case:** when the frontend fronts a separate backend, the
  API client + contracts play the data-access role. Don't add Next route
  handlers that proxy the API for the UI's own use.

## Checklist before you add a file

1. Is it a route? → `page.tsx` only, delegating to `_components/<View>`.
2. Used by one route? → that route's `_components/<PascalName>/`. Two+ routes? → `src/components/<kebab-group>/`.
3. Fetching? → hook in `src/lib/hooks/<domain>.ts`, not in the component.
4. UI primitive needed? → import from the design-system barrel; if missing, add it to the design system, not a one-off.
5. Constants / helpers / styles → the folder's `constants.ts` / `helpers.ts` / `styles.ts`.
6. Strings → the repo's message files, if the app is localized.
7. Test → colocated `*.test.tsx`; run the repo's typecheck and test commands.

## Known judgment calls

Where respected sources genuinely disagree, pick per situation and follow the repo's docs:
- **Feature folders vs function folders** at scale.
- **Feature code inside `app/` (route colocation) vs outside** (`src/features`). The reference layout colocates in `app/**/_components/`; don't migrate a repo that chose otherwise.
- **`lib/` vs `utils/` vs `helpers/`.** Reference layout: `lib/` app-wide, `helpers.ts` per component.
- **Layering depth.** A flat dumping ground and premature enterprise layering are both failure modes.
