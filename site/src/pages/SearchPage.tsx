// "All artifacts": every artifact in the catalog with filters (type, plugin,
// category, status, last update), sort, grid/list views and keyword search
// (?q=). The Start card's counts and the header search link here, e.g.
// search/?type=skill. Filters live in the URL, so a filtered view can be shared.
//
// The static HTML lists every artifact, unfiltered. Filters from the URL apply
// after hydration; until then the inline script in index.html hides the list
// (html[data-query]) so the unfiltered list doesn't flash.
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArtifactCard, absoluteDate, relativeDate } from '../components/ArtifactCard';
import { CloseIcon, Corners, FilterIcon, GridIcon, ListIcon } from '../components/Icons';
import { LANG, label, rich, richN, t, tn, type MessageKey } from '../i18n';
import { queryTerms, rank } from '../lib/search';
import type { ArtifactView, SearchProps, SiteInfo } from '../types';
import s from './SearchPage.module.css';

type ListKey = 'type' | 'plugin' | 'category' | 'status';
const LIST_KEYS: ListKey[] = ['type', 'plugin', 'category', 'status'];
const UPDATED = ['7', '30', '90'] as const;
const SORTS = ['relevance', 'updated', 'name'] as const;
const DAY = 86_400_000;

interface Filters {
  q: string;
  type: string[];
  plugin: string[];
  category: string[];
  status: string[];
  updated: string; // '' = any time, or a number of days
  sort: string; // '' = relevance with a query, otherwise most recently updated
  view: string; // '' = grid, or 'list'
}
const NO_FILTERS: Filters = { q: '', type: [], plugin: [], category: [], status: [], updated: '', sort: '', view: '' };

const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
const byUpdated = (x: ArtifactView, y: ArtifactView) => (y.updatedAt ?? '').localeCompare(x.updatedAt ?? '');

export function SearchPage({ site, artifacts, types, plugins, categories, statuses }: SearchProps & { site: SiteInfo }) {
  // Starts unfiltered so the browser's first render matches the static HTML.
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  const options: Record<ListKey, string[]> = { type: types, plugin: plugins, category: categories, status: statuses };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const list = (key: ListKey) => (params.get(key) ?? '').split(',').filter((v) => options[key].includes(v));
    const pick = (key: string, allowed: readonly string[]) => {
      const v = params.get(key) ?? '';
      return allowed.includes(v) ? v : '';
    };
    setFilters({
      q: (params.get('q') ?? '').slice(0, 200),
      type: list('type'),
      plugin: list('plugin'),
      category: list('category'),
      status: list('status'),
      updated: pick('updated', UPDATED),
      sort: pick('sort', SORTS),
      view: pick('view', ['list']),
    });
    setNow(Date.now());
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    for (const key of LIST_KEYS) if (filters[key].length) params.set(key, filters[key].join(','));
    for (const key of ['updated', 'sort', 'view'] as const) if (filters[key]) params.set(key, filters[key]);
    const qs = params.toString().replace(/%2C/g, ',');
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }, [filters, ready]);

  // Mobile filter sheet: Esc closes it, and focus returns to the Filters button.
  useEffect(() => {
    if (!sheetOpen) return;
    sheetRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen]);
  const closeSheet = () => {
    setSheetOpen(false);
    filtersButtonRef.current?.focus();
  };

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const clearFilters = () => setFilters((f) => ({ ...NO_FILTERS, q: f.q, sort: f.sort, view: f.view }));

  const terms = useMemo(() => queryTerms(filters.q), [filters.q]);
  const base = useMemo(() => (filters.q ? rank(artifacts, filters.q) : artifacts), [artifacts, filters.q]);
  const passes = (a: ArtifactView, skip?: string) =>
    LIST_KEYS.every((key) => key === skip || !filters[key].length || filters[key].includes(a[key] ?? '')) &&
    (skip === 'updated' || !filters.updated || now === null || (!!a.updatedAt && now - new Date(a.updatedAt).getTime() <= +filters.updated * DAY));

  const sort = filters.sort || (filters.q ? 'relevance' : 'updated');
  let results = base.filter((a) => passes(a));
  if (sort === 'updated' || (sort === 'relevance' && !filters.q)) results = results.slice().sort(byUpdated);
  if (sort === 'name') results = results.slice().sort((x, y) => x.name.localeCompare(y.name));
  const count = (key: string, test: (a: ArtifactView) => boolean) => base.filter((a) => passes(a, key) && test(a)).length;

  const chips: { label: string; remove: () => void }[] = [];
  for (const key of LIST_KEYS) {
    for (const v of filters[key]) {
      chips.push({
        label: t('results.chip', { facet: t(`results.facets.${key}`), value: valueLabel(key, v) }),
        remove: () => set({ [key]: filters[key].filter((x) => x !== v) }),
      });
    }
  }
  if (filters.updated) chips.push({ label: t('results.chipUpdated', { days: filters.updated }), remove: () => set({ updated: '' }) });

  const n = results.length;
  const resultsText = tn('results.count', n);
  const summary = filters.sort && filters.sort !== 'relevance'
    ? t('results.summarySorted', { results: resultsText, sort: t(`results.sortedBy.${filters.sort as 'name' | 'updated'}`) })
    : resultsText;
  const view = filters.view === 'list' ? 'row' : 'card';
  const when = (iso: string | null) => (now === null ? absoluteDate(iso) : relativeDate(iso, now, LANG));
  const categoryCounts = categories
    .map((c) => ({ c, n: artifacts.filter((a) => a.category === c).length }))
    .filter((x) => x.n > 0)
    .sort((x, y) => y.n - x.n)
    .slice(0, 4);

  const facets = (
    <>
      {LIST_KEYS.map((key) => (
        <fieldset key={key} className={s.facet}>
          <legend>{t(`results.facets.${key}`)}</legend>
          {options[key].map((v) => {
            const c = count(key, (a) => a[key] === v);
            const checked = filters[key].includes(v);
            return (
              <label key={v} className={`${s.option} ${!c && !checked ? s.empty : ''}`}>
                <input type="checkbox" name={key} value={v} checked={checked} onChange={() => set({ [key]: toggle(filters[key], v) })} />
                <span className={s.optionLabel}>{valueLabel(key, v)}</span>
                <span className={s.optionCount}>{c}</span>
              </label>
            );
          })}
        </fieldset>
      ))}
      <fieldset className={s.facet}>
        <legend>{t('results.facets.updated')}</legend>
        {(['', ...UPDATED] as const).map((v) => (
          <label key={v || 'any'} className={s.option}>
            <input type="radio" name="updated" value={v} checked={filters.updated === v} onChange={() => set({ updated: v })} />
            <span className={s.optionLabel}>{t(`results.updatedWithin.${v || 'any'}` as MessageKey)}</span>
            <span className={s.optionCount}>
              {count('updated', (a) => !v || (now !== null && !!a.updatedAt && now - new Date(a.updatedAt).getTime() <= +v * DAY))}
            </span>
          </label>
        ))}
      </fieldset>
    </>
  );

  return (
    <div className={`container ${s.page}`} data-results-page data-ready={ready ? '' : undefined}>
      <header className={s.head}>
        <h1>
          {filters.q
            ? richN('results.titleQuery', n, { query: <em className={s.query}>“{filters.q}”</em> })
            : t('results.title')}
        </h1>
        {chips.length > 0 && (
          <div className={s.chips} data-chips>
            {chips.map((c) => (
              <button key={c.label} type="button" className={`tag tag-outline ${s.chip}`} aria-label={t('results.removeFilter', { label: c.label })} onClick={c.remove}>
                {c.label}
                <CloseIcon size={12} />
              </button>
            ))}
            {chips.length > 1 && (
              <button type="button" className={`btn btn-ghost ${s.clearAll}`} onClick={clearFilters}>{t('results.clearAll')}</button>
            )}
          </div>
        )}
      </header>

      <div className={s.bar}>
        <div className={s.barLeft}>
          <button
            ref={filtersButtonRef}
            type="button"
            className={`btn btn-secondary ${s.filtersButton}`}
            aria-expanded={sheetOpen}
            aria-controls="result-filters"
            onClick={() => setSheetOpen(true)}
          >
            <FilterIcon size={14} />
            {chips.length ? t('results.filtersCount', { count: chips.length }) : t('results.filters')}
          </button>
          <span className={s.summary} data-result-summary aria-live="polite">{summary}</span>
        </div>
        <div className={s.barRight}>
          <label className={s.sort}>
            {t('results.sort')}
            <select className="input" name="sort" value={filters.sort || 'relevance'} onChange={(e) => set({ sort: e.target.value === 'relevance' ? '' : e.target.value })}>
              {SORTS.map((v) => <option key={v} value={v}>{t(`results.sortOptions.${v}`)}</option>)}
            </select>
          </label>
          <div className={s.views} role="group" aria-label={t('results.layout')}>
            <button type="button" aria-pressed={view === 'card'} aria-label={t('results.gridView')} data-view="grid" onClick={() => set({ view: '' })}><GridIcon size={15} /></button>
            <button type="button" aria-pressed={view === 'row'} aria-label={t('results.listView')} data-view="list" onClick={() => set({ view: 'list' })}><ListIcon size={15} /></button>
          </div>
        </div>
      </div>

      <div className={s.layout}>
        {sheetOpen && <div className={s.backdrop} onClick={closeSheet} />}
        <aside
          ref={sheetRef}
          id="result-filters"
          className={`${s.facets} ${sheetOpen ? s.sheetOpen : ''}`}
          aria-label={t('results.filters')}
          data-facets
        >
          <div className={s.sheetHead}>
            <span>{t('results.filters')}</span>
            <button type="button" className="btn btn-primary" onClick={closeSheet}>{tn('results.showResults', n)}</button>
          </div>
          {facets}
        </aside>

        <div className={s.results}>
          {n === 0 ? (
            <div className={`blueprint ${s.emptyBox}`} data-results-empty>
              <Corners />
              <h2>{t('results.emptyTitle', { query: filters.q || t('results.emptyFilters') })}</h2>
              <p className={s.muted}>{t('results.emptyHint')}</p>
              <div className={s.emptyActions}>
                {chips.length > 0 && (
                  <button type="button" className="btn btn-secondary" onClick={clearFilters}>{t('results.clearAll')}</button>
                )}
                {categoryCounts.map(({ c }) => (
                  <a
                    key={c}
                    className="btn btn-secondary"
                    href={`?category=${encodeURIComponent(c)}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setFilters({ ...NO_FILTERS, category: [c], view: filters.view });
                    }}
                  >
                    {label('categories', c)}
                  </a>
                ))}
              </div>
              {site.repo && (
                <p className={s.request}>
                  {rich('results.request', {}, {
                    link: (c: ReactNode) => (
                      <a
                        href={`https://github.com/${site.repo}/issues/new?labels=request&title=${encodeURIComponent(t('results.requestIssueTitle', { query: filters.q }))}`}
                        target="_blank"
                        rel="noopener"
                      >
                        {c}
                      </a>
                    ),
                  })}
                </p>
              )}
            </div>
          ) : (
            <ul className={view === 'card' ? s.grid : s.list} data-results>
              {results.map((a) => <ArtifactCard key={a.id} artifact={a} variant={view} terms={terms} when={when} />)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function valueLabel(key: ListKey, value: string): string {
  if (key === 'type') return label('types', value);
  if (key === 'category') return label('categories', value);
  if (key === 'status') return label('statuses', value);
  return value;
}
