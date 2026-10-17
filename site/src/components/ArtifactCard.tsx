// An artifact on the results page: a card (grid view) or a row (list view).
// The name links to its detail page; the footer copies the install command.
import { label, t } from '../i18n';
import { highlightParts } from '../lib/search';
import { formatDate } from '../lib/site';
import type { ArtifactView } from '../types';
import s from './ArtifactCard.module.css';
import { CopyButton } from './CopyButton';
import { Corners, CopyIcon } from './Icons';

interface Props {
  artifact: ArtifactView;
  variant: 'card' | 'row';
  /** Search words to highlight. */
  terms: string[];
  /** "2 days ago" once the page has loaded; the date until then (and in the static HTML). */
  when: (iso: string | null) => string;
}

function Highlight({ text, terms }: { text: string; terms: string[] }) {
  return <>{highlightParts(text, terms).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : p.text))}</>;
}

export function ArtifactCard({ artifact: a, variant, terms, when }: Props) {
  const dim = a.status === 'deprecated';
  const name = a.href ? <a href={a.href}><Highlight text={a.name} terms={terms} /></a> : <Highlight text={a.name} terms={terms} />;
  const badges = a.badges.map((b) => <span key={b.kind} className={`tag ${b.cls} ${s.badge}`}>{label('badges', b.kind)}</span>);
  const copyLabel = t('results.copyInstall');

  if (variant === 'row') {
    return (
      <li className={`${s.row} ${dim ? s.dim : ''}`} data-artifact={a.id} data-type={a.type}>
        <span className={s.rowCode} title={label('types', a.type)}>{label('typeCodes', a.type)}</span>
        <h3 className={s.rowName}>{name}</h3>
        <span className={s.rowDesc}>{a.description}</span>
        <span className={s.rowMeta}>{badges}{a.plugin}</span>
        <CopyButton text={a.installCommand} className={`btn btn-ghost btn-icon ${s.rowCopy}`} ariaLabel={copyLabel} label={copyLabel} iconOnly>
          <CopyIcon size={14} />
        </CopyButton>
      </li>
    );
  }

  const install = a.type === 'plugin' ? t('results.installsPlugin') : t('results.installsWith', { plugin: a.plugin });
  const date = when(a.updatedAt);
  return (
    <li className={`blueprint ${s.card} ${dim ? s.dim : ''}`} data-artifact={a.id} data-type={a.type}>
      <Corners />
      <div className={s.body}>
        <div className={s.badges}>
          <span className={s.code} title={label('types', a.type)}>{label('typeCodes', a.type)}</span>
          {badges}
        </div>
        <h3 className={s.name}>{name}</h3>
        <p className={s.desc}><Highlight text={a.description} terms={terms} /></p>
        {a.tags.length > 0 && (
          <div className={s.tags}>
            {a.tags.slice(0, 3).map((tag) => <span key={tag} className="tag tag-neutral">{tag}</span>)}
            {a.tags.length > 3 && <span className={s.more}>{t('results.moreTags', { count: a.tags.length - 3 })}</span>}
          </div>
        )}
        {a.skills && a.skills.length > 0 && (
          <p className={s.skills}>
            <span className={s.skillsLabel}>{t('results.skills')}</span>
            {a.skills.slice(0, 3).map((k) => (k.href
              ? <a key={k.fullName} href={k.href} title={k.fullName} className={s.skill}>{k.name}</a>
              : <span key={k.fullName} title={k.fullName} className={s.skill}>{k.name}</span>))}
            {a.skills.length > 3 && <span className={s.more}>{t('results.moreTags', { count: a.skills.length - 3 })}</span>}
          </p>
        )}
        <p className={s.meta}>
          {a.version ? t('results.meta', { install, version: a.version, when: date }) : t('results.metaNoVersion', { install, when: date })}
        </p>
      </div>
      <div className={s.foot}>
        <code className={s.cmd}>{a.installCommand}</code>
        <CopyButton text={a.installCommand} className={`btn btn-ghost ${s.copy}`} ariaLabel={copyLabel}>
          <CopyIcon size={14} />
        </CopyButton>
      </div>
    </li>
  );
}

const DAY = 86_400_000;

/** "2 days ago" / "3 weeks ago" in the site language. */
export function relativeDate(iso: string | null, now: number, lang: string): string {
  if (!iso) return '';
  const days = Math.max(0, Math.floor((now - new Date(iso).getTime()) / DAY));
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  if (days < 7) return rtf.format(-days, 'day');
  if (days < 30) return rtf.format(-Math.floor(days / 7), 'week');
  if (days < 365) return rtf.format(-Math.floor(days / 30), 'month');
  return rtf.format(-Math.floor(days / 365), 'year');
}

/** Absolute date, used until the browser knows the current time. */
export const absoluteDate = (iso: string | null) => formatDate(iso);
