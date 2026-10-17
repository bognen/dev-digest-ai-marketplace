import { useEffect, useState } from 'react';
import { ChangeEntry } from '../components/ChangeEntry';
import { useOnboardingGuide } from '../components/OnboardingContext';
import { label, rich, t, tn } from '../i18n';
import { formatShortDate, url } from '../lib/site';
import type { ChangeView, SiteInfo, WhatsNewProps } from '../types';
import s from './WhatsNewPage.module.css';

type Filters = { change: string; type: string; plugin: string };
const NO_FILTERS: Filters = { change: '', type: '', plugin: '' };
const NAMES = Object.keys(NO_FILTERS) as (keyof Filters)[];

const matches = (entry: ChangeView, f: Filters) =>
  (!f.change || entry.kind === f.change) && (!f.type || entry.type === f.type) && (!f.plugin || entry.plugin === f.plugin);

export function WhatsNewPage({ site, weeks, total, kinds, types, plugins }: WhatsNewProps & { site: SiteInfo }) {
  const { open } = useOnboardingGuide();
  // Starts unfiltered so the browser's first render matches the server HTML.
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [restored, setRestored] = useState(false);

  // Restore filters from the URL, so a filtered view can be shared.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const allowed: Record<keyof Filters, string[]> = { change: kinds, type: types, plugin: plugins };
    const next = { ...NO_FILTERS };
    for (const name of NAMES) {
      const v = params.get(name);
      if (v && allowed[name].includes(v)) next[name] = v;
    }
    setFilters(next);
    setRestored(true);
  }, [kinds, types, plugins]);

  useEffect(() => {
    if (!restored) return;
    const params = new URLSearchParams();
    for (const name of NAMES) if (filters[name]) params.set(name, filters[name]);
    const qs = params.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  }, [filters, restored]);

  const set = (name: keyof Filters, value: string) => setFilters((f) => ({ ...f, [name]: value }));
  const shown = weeks.reduce((n, w) => n + w.entries.filter((e) => matches(e, filters)).length, 0);

  return (
    <div className={`container ${s.wn}`}>
      <header className="page-head">
        <h1>{t('whatsNew.title')}</h1>
        <p>{t('whatsNew.intro')}</p>
      </header>

      {total > 0 ? (
        <>
          <form className={s.filters} data-filters aria-label={t('whatsNew.filters')} onSubmit={(e) => e.preventDefault()}>
            <div className={`seg ${s.seg}`} role="radiogroup" aria-label={t('whatsNew.changeType')}>
              {['', ...kinds].map((k) => (
                <label className={`seg-opt ${s.segOpt}`} key={k || 'all'}>
                  <input type="radio" name="change" value={k} checked={filters.change === k} onChange={() => set('change', k)} />
                  {k ? label('changeKinds', k) : t('whatsNew.all')}
                </label>
              ))}
            </div>
            <select className="input" name="type" aria-label={t('whatsNew.artifactType')} value={filters.type} onChange={(e) => set('type', e.target.value)}>
              <option value="">{t('whatsNew.allTypes')}</option>
              {types.map((type) => <option key={type} value={type}>{label('types', type)}</option>)}
            </select>
            <select className="input" name="plugin" aria-label={t('whatsNew.plugin')} value={filters.plugin} onChange={(e) => set('plugin', e.target.value)}>
              <option value="">{t('whatsNew.allPlugins')}</option>
              {plugins.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <p className={s.count} data-result-count aria-live="polite">{tn('common.changes', shown)}</p>
          </form>

          <div className={s.emptyFiltered} data-filter-empty hidden={shown > 0}>
            <p>
              {t('whatsNew.noMatch')}{' '}
              <button type="button" className="btn btn-ghost" data-clear-filters onClick={() => setFilters(NO_FILTERS)}>{t('whatsNew.clearFilters')}</button>
            </p>
          </div>

          {weeks.map((week) => {
            const id = `week-${week.start.slice(0, 10)}`;
            const visible = week.entries.filter((e) => matches(e, filters)).length;
            return (
              <section className={s.week} data-week aria-labelledby={id} hidden={!visible} key={week.start}>
                <div className={s.weekHead}>
                  <h2 id={id}>{t('whatsNew.week', { date: formatShortDate(week.start) })}</h2>
                  <span data-week-count>{tn('common.changes', visible)}</span>
                </div>
                <ol className={s.list}>
                  {week.entries.map((entry, i) => <ChangeEntry key={i} entry={entry} hidden={!matches(entry, filters)} />)}
                </ol>
              </section>
            );
          })}
        </>
      ) : (
        <div className="empty">
          <p><strong>{t('whatsNew.emptyTitle')}</strong></p>
          <p>
            {rich('whatsNew.emptyBody')}
            {site.repo && <> {rich('whatsNew.emptyContribute', {}, { link: (c) => <a href={`https://github.com/${site.repo}/blob/main/CONTRIBUTING.md`}>{c}</a> })}</>}
          </p>
          <p>
            <a className="btn btn-secondary" href={url('get-started')} onClick={(e) => { e.preventDefault(); open(null); }}>
              {t('whatsNew.connect')}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
