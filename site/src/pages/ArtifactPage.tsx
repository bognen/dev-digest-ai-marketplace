// Detail page of one skill, agent, command, hook or MCP server: what it does,
// how to call it, what it needs, its files and the plugin's changelog.
import { useState, type KeyboardEvent } from 'react';
import { ArtifactCard, absoluteDate } from '../components/ArtifactCard';
import { CopyButton } from '../components/CopyButton';
import { CheckIcon, CloseIcon, CopyIcon } from '../components/Icons';
import { label, t, type MessageKey } from '../i18n';
import { formatDate, url } from '../lib/site';
import type { ArtifactDetailProps } from '../types';
import s from './Detail.module.css';
import { Breadcrumb, Changelog, DetailHeader, InstallBox, Prose, metaLabel, summaryText } from './DetailParts';

const TABS = ['overview', 'how', 'req', 'files', 'log'] as const;
type Tab = (typeof TABS)[number];

export function ArtifactPage(p: ArtifactDetailProps) {
  const a = p.artifact;
  const [tab, setTab] = useState<Tab>('overview');
  const summary = summaryText(p.summary);

  // Arrow keys move between tabs, as the ARIA tabs pattern expects.
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + step + TABS.length) % TABS.length];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  const how = a.type === 'skill' && p.invocation
    ? t('detail.how.slashSkill')
    : t(`detail.how.${a.type}` as MessageKey, { name: p.invocation ?? a.name, event: a.name });

  const req = (key: string) => p.requirements.find((r) => r.key === key);
  const rows = [
    { key: 'tools', value: req('tools')?.value || t('detail.toolsDefault'), mono: !!req('tools') },
    { key: 'model', value: req('model')?.value || t('detail.modelDefault'), mono: false },
    ...p.requirements.filter((r) => !['tools', 'model'].includes(r.key)),
  ];

  const meta: [string, string | null][] = [
    ['type', label('types', a.type)],
    ['plugin', a.plugin],
    ['category', a.category ? label('categories', a.category) : null],
    ['version', a.version],
    ['added', a.addedAt ? formatDate(a.addedAt) : null],
    ['updated', a.updatedAt ? formatDate(a.updatedAt) : null],
    ['author', a.author],
  ];

  return (
    <div className={`container ${s.page}`} data-artifact={a.id}>
      <Breadcrumb items={[
        { label: t('detail.catalog'), href: url() },
        ...(a.category ? [{ label: label('categories', a.category), href: p.categoryHref }] : []),
        { label: a.plugin, href: p.pluginHref },
        { label: a.name },
      ]} />

      <div className={s.layout}>
        <div className={s.main}>
          <DetailHeader item={a} code={label('typeCodes', a.type)} />
          <InstallBox item={a} note={t('detail.installsWith', { plugin: a.plugin, summary })} />

          <div>
            <div role="tablist" aria-label={t('detail.sections')} className={s.tabs}>
              {TABS.map((k) => (
                <button
                  key={k}
                  id={`tab-${k}`}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  aria-controls={`panel-${k}`}
                  tabIndex={tab === k ? 0 : -1}
                  onClick={() => setTab(k)}
                  onKeyDown={onTabKey}
                >
                  {t(`detail.tabs.${k}`)}
                </button>
              ))}
            </div>

            <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" hidden={tab !== 'overview'} className={s.panel}>
              {p.bodyHtml ? <Prose html={p.bodyHtml} /> : <p className={s.muted}>{t('detail.noBody')}</p>}
            </div>

            <div id="panel-how" role="tabpanel" aria-labelledby="tab-how" hidden={tab !== 'how'} className={`${s.panel} ${s.stack}`}>
              <p className={s.muted}>{how}</p>
              {p.invocation && (
                <div className={s.field}>
                  <span>{t('detail.syntax')}</span>
                  <code className={s.syntax}>{p.invocation}</code>
                </div>
              )}
              {p.examples.length > 0 && (
                <div className={s.field}>
                  <span>{t('detail.examples')}</span>
                  {p.examples.map((ex) => (
                    <div key={ex} className={s.example}>
                      <span>“{ex}”</span>
                      <CopyButton text={ex} className="btn btn-ghost btn-icon" ariaLabel={t('detail.copyPrompt')} iconOnly label={t('detail.copyPrompt')}>
                        <CopyIcon size={14} />
                      </CopyButton>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div id="panel-req" role="tabpanel" aria-labelledby="tab-req" hidden={tab !== 'req'} className={s.panel}>
              <table className={`table ${s.req}`}>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key}>
                      <th scope="row">{t(`detail.requirements.${r.key}` as MessageKey)}</th>
                      <td className={r.mono ? s.mono : undefined}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div id="panel-files" role="tabpanel" aria-labelledby="tab-files" hidden={tab !== 'files'} className={s.panel}>
              <ul className={s.files}>
                {p.files.map((f) => (
                  <li key={f.path}>{f.url ? <a href={f.url} target="_blank" rel="noopener">{f.path}</a> : <span>{f.path}</span>}</li>
                ))}
              </ul>
            </div>

            <div id="panel-log" role="tabpanel" aria-labelledby="tab-log" hidden={tab !== 'log'} className={s.panel}>
              <Changelog entries={p.changelog} />
            </div>
          </div>
        </div>

        <aside className={s.aside}>
          <section aria-labelledby="quality-title" className={s.asideSection}>
            <div className={s.qualityHead}>
              <h2 id="quality-title">{t('detail.quality')}</h2>
              <span>{t('detail.qualityScore', { score: p.quality.score })}</span>
            </div>
            <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={p.quality.score} aria-label={t('detail.qualityLabel')} className={s.meter}>
              <div style={{ width: `${p.quality.score}%` }} />
            </div>
            <ul className={s.flags}>
              {p.quality.flags.map((f) => (
                <li key={f.key} className={f.ok ? undefined : s.flagOff}>
                  {f.ok ? <CheckIcon size={14} className={s.flagIcon} /> : <CloseIcon size={14} />}
                  {t(`detail.qualityFlags.${f.key}`)}
                </li>
              ))}
            </ul>
          </section>

          {a.skills && a.skills.length > 0 && (
            <section className={s.asideSection} aria-labelledby="skills-title">
              <h2 id="skills-title">{t('detail.skills')}</h2>
              <div className={s.contents}>
                {a.skills.map((k) => (
                  <a key={k.fullName} href={k.href ?? undefined} title={k.fullName}>
                    <span>{k.name}</span>
                    <span className={s.count}>{k.fullName.includes(':') ? k.fullName.split(':')[0] : a.plugin}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {p.usedBy.length > 0 && (
            <section className={s.asideSection} aria-labelledby="used-by-title">
              <h2 id="used-by-title">{t('detail.usedBy')}</h2>
              <div className={s.contents}>
                {p.usedBy.map((u) => (
                  <a key={u.href} href={u.href}>
                    <span>{u.name}</span>
                    <span className={s.count}>{u.plugin}</span>
                  </a>
                ))}
              </div>
            </section>
          )}

          {a.tags.length > 0 && (
            <section className={s.asideSection}>
              <h2>{t('detail.tags')}</h2>
              <div className={s.tagList}>
                {a.tags.map((tag) => <a key={tag} className="tag tag-neutral" href={`${url('search/')}?q=${encodeURIComponent(tag)}`}>{tag}</a>)}
              </div>
            </section>
          )}

          <section className={s.asideSection}>
            <h2>{t('detail.details')}</h2>
            <dl className={s.metaList}>
              {meta.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><dt>{metaLabel(k)}</dt><dd>{v}</dd></div>
              ))}
            </dl>
          </section>

          <div className={s.links}>
            {a.sourceUrl && <a className="btn btn-secondary" href={a.sourceUrl} target="_blank" rel="noopener">{t('detail.viewSource')}<span aria-hidden="true">↗</span></a>}
            {a.issueUrl && <a className="btn btn-secondary" href={a.issueUrl} target="_blank" rel="noopener">{t('detail.reportIssue')}<span aria-hidden="true">↗</span></a>}
          </div>
        </aside>
      </div>

      {p.related.length > 0 && (
        <section aria-labelledby="related-title" className={s.related}>
          <h2 id="related-title">{t('detail.related')}</h2>
          <ul className={s.grid}>
            {p.related.map((r) => <ArtifactCard key={r.id} artifact={r} variant="card" terms={[]} when={absoluteDate} />)}
          </ul>
        </section>
      )}
    </div>
  );
}
