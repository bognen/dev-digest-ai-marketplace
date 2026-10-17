// Detail page of one plugin: install, what it contains, its README and changelog.
import type { MouseEvent } from 'react';
import { ArtifactCard, absoluteDate } from '../components/ArtifactCard';
import { label, t, type MessageKey } from '../i18n';
import { url } from '../lib/site';
import type { PluginDetailProps } from '../types';
import s from './Detail.module.css';
import { Breadcrumb, Changelog, DetailHeader, InstallBox, Prose, summaryText } from './DetailParts';

export function PluginPage(p: PluginDetailProps) {
  const a = p.plugin;
  const summary = summaryText(p.summary);
  const jump = (id: string) => (e: MouseEvent) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className={`container ${s.page}`} data-artifact={a.id}>
      <Breadcrumb items={[
        { label: t('detail.catalog'), href: url() },
        ...(a.category ? [{ label: label('categories', a.category), href: p.categoryHref }] : []),
        { label: a.name },
      ]} />

      <div className={s.layout}>
        <div className={s.main}>
          <DetailHeader item={a} code={label('typeCodes', 'plugin')} />
          <InstallBox item={a} note={summary ? t('detail.installsPlugin', { summary }) : ''} />
        </div>
        <aside className={s.aside}>
          <nav aria-labelledby="contents-title" className={s.asideSection}>
            <h2 id="contents-title">{t('detail.contents')}</h2>
            <div className={s.contents}>
              {p.groups.map((g) => (
                <a key={g.type} href={`#g-${g.type}`} onClick={jump(`g-${g.type}`)}>
                  <span>{t(`detail.typeGroups.${g.type}` as MessageKey)}</span>
                  <span className={s.count}>{g.items.length}</span>
                </a>
              ))}
            </div>
          </nav>
          {p.dependencies.length > 0 && (
            <section className={s.asideSection}>
              <h2>{t('detail.dependencies')}</h2>
              <div className={s.contents}>
                {p.dependencies.map((d) => (
                  <a key={d.name} href={d.href ?? undefined}>
                    <span>{d.name}</span>
                    {d.range && <span className={s.count}>{d.range}</span>}
                  </a>
                ))}
              </div>
            </section>
          )}
          <div className={s.links}>
            {a.sourceUrl && <a className="btn btn-secondary" href={a.sourceUrl} target="_blank" rel="noopener">{t('detail.viewSource')}<span aria-hidden="true">↗</span></a>}
            {a.issueUrl && <a className="btn btn-secondary" href={a.issueUrl} target="_blank" rel="noopener">{t('detail.reportIssue')}<span aria-hidden="true">↗</span></a>}
          </div>
        </aside>
      </div>

      {summary && <p className={s.summary}>{summary}</p>}
      {p.groups.map((g) => (
        <section key={g.type} id={`g-${g.type}`} aria-labelledby={`g-${g.type}-title`} className={s.group}>
          <h2 id={`g-${g.type}-title`}>{t(`detail.typeGroups.${g.type}` as MessageKey)}</h2>
          <ul className={s.grid}>
            {g.items.map((x) => <ArtifactCard key={x.id} artifact={x} variant="card" terms={[]} when={absoluteDate} />)}
          </ul>
        </section>
      ))}

      <div className={s.bottom}>
        <section aria-labelledby="readme-title" className={s.readme}>
          <h2 id="readme-title">{t('detail.readme')}</h2>
          {p.readmeHtml ? <Prose html={p.readmeHtml} className={s.boxed} /> : <p className={s.muted}>{t('detail.noReadme')}</p>}
        </section>
        <section aria-labelledby="log-title" className={s.sideLog}>
          <h2 id="log-title">{t('detail.changelog')}</h2>
          <Changelog entries={p.changelog} compact />
        </section>
      </div>
    </div>
  );
}
