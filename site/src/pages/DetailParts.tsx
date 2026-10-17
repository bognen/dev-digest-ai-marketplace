// Pieces shared by the plugin and artifact detail pages.
import { CopyCommand } from '../components/CopyCommand';
import { Corners } from '../components/Icons';
import { useOnboardingGuide } from '../components/OnboardingContext';
import { label, rich, t, tn, type MessageKey, type PluralKey } from '../i18n';
import { formatDate, url } from '../lib/site';
import type { ChangelogEntry, DetailView, PluginSummary } from '../types';
import s from './Detail.module.css';

/** "3 skills · 4 agents · 1 hook" */
export function summaryText(summary: PluginSummary[]): string {
  return summary.map((x) => tn(`detail.typeCounts.${x.type}` as PluralKey, x.count)).join(t('detail.summarySeparator'));
}

export function Breadcrumb({ items }: { items: { label: string; href?: string | null }[] }) {
  return (
    <nav aria-label={t('detail.breadcrumb')} className={s.crumbs}>
      <ol>
        {items.map((item, i) => (
          <li key={i}>{item.href && i < items.length - 1 ? <a href={item.href}>{item.label}</a> : <span aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function DetailHeader({ item, code }: { item: DetailView; code: string }) {
  return (
    <header className={s.head}>
      <div className={s.badges}>
        <span className={s.code}>{code}</span>
        {item.badges.map((b) => <span key={b.kind} className={`tag ${b.cls}`}>{label('badges', b.kind)}</span>)}
      </div>
      <h1>{item.name}</h1>
      <p className={s.lead}>{item.description}</p>
      <p className={s.meta}>
        {item.version && <span>{t('detail.version', { version: item.version })}</span>}
        {item.updatedAt && <span>{t('detail.updated', { date: formatDate(item.updatedAt) })}</span>}
        {item.author && <span>{t('detail.by', { author: item.author })}</span>}
        <span>{label('statuses', item.status)}</span>
      </p>
      {item.status === 'deprecated' && (
        <div role="note" className={s.note}>{t('detail.deprecated', { type: label('types', item.type).toLowerCase() })}</div>
      )}
    </header>
  );
}

export function InstallBox({ item, note }: { item: DetailView; note: string }) {
  const { open } = useOnboardingGuide();
  return (
    <section className={`blueprint ${s.install}`} aria-labelledby="install-title">
      <Corners />
      <div className={s.installHead}>
        <h2 id="install-title">{t('detail.install')}</h2>
        <span>{note}</span>
      </div>
      <CopyCommand command={item.installCommand} label={item.installCommand} installCmd="session" />
      <p className={s.installHelp}>
        {rich('detail.notConnected', {}, {
          link: (c) => (
            <a
              href={`${url('get-started')}?plugin=${encodeURIComponent(item.plugin)}`}
              data-open-onboarding
              data-plugin={item.plugin}
              onClick={(e) => { e.preventDefault(); open(item.plugin); }}
            >
              {c}
            </a>
          ),
        })}
      </p>
    </section>
  );
}

export function Changelog({ entries, compact = false }: { entries: ChangelogEntry[]; compact?: boolean }) {
  if (!entries.length) return <p className={s.muted}>{t('detail.noChangelog')}</p>;
  return (
    <ol className={compact ? `${s.log} ${s.logCompact}` : s.log}>
      {entries.map((e) => (
        <li key={e.version}>
          <div className={s.logVersion}>
            <span>{e.version}</span>
            {e.date && <span>{formatDate(e.date)}</span>}
          </div>
          <ul>{e.notesHtml.map((n, i) => <li key={i} dangerouslySetInnerHTML={{ __html: n }} />)}</ul>
        </li>
      ))}
    </ol>
  );
}

/** Markdown rendered at build time from the repository (scripts/site-data.mjs escapes raw HTML). */
export function Prose({ html, className = '' }: { html: string; className?: string }) {
  return <div className={`${s.prose} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

export const metaLabel = (key: string) => t(`detail.meta.${key}` as MessageKey);
