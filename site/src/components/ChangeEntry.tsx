// One What's New entry: a timeline row (date, change, mini card, notes) or,
// with `compact`, a cell in the homepage strip.
import { label, t, tn } from '../i18n';
import { CHANGE_TAGS, formatShortDate } from '../lib/site';
import type { ChangeView } from '../types';
import s from './ChangeEntry.module.css';
import { MiniCard } from './MiniCard';
import { useOnboardingGuide } from './OnboardingContext';

interface Props {
  entry: ChangeView;
  compact?: boolean;
  hidden?: boolean;
}

export function ChangeEntry({ entry, compact = false, hidden = false }: Props) {
  const { open } = useOnboardingGuide();
  const hooks = { 'data-change': '', 'data-kind': entry.kind, 'data-type': entry.type, 'data-plugin': entry.plugin };
  const kindTag = <span className={`tag ${CHANGE_TAGS[entry.kind]}`}>{label('changeKinds', entry.kind)}</span>;
  const date = <time dateTime={entry.date}>{formatShortDate(entry.date)}</time>;

  if (compact) {
    const { card } = entry;
    return (
      <li className={`${s.cell} ${entry.kind === 'removed' ? s.removed : ''}`} {...hooks}>
        <div className={s.cellTop}>{kindTag}{date}</div>
        <h3 className={s.cellName}>{card.href ? <a href={card.href}>{entry.name}</a> : <span>{entry.name}</span>}</h3>
        <span className={s.cellMeta}>{entry.type === 'plugin' ? label('types', entry.type) : t('common.typeInPlugin', { type: label('types', entry.type), plugin: entry.plugin })}</span>
        {entry.version && <span className={s.cellVer}>{entry.version}</span>}
        {card.installable && (
          <button
            type="button"
            className={`btn btn-ghost ${s.cellInstall}`}
            data-open-onboarding
            data-plugin={entry.plugin}
            aria-label={t('common.installAriaLabel', { plugin: entry.plugin })}
            onClick={() => open(entry.plugin)}
          >
            {t('common.install')}
          </button>
        )}
      </li>
    );
  }

  const { includes, changed } = entry;
  return (
    <li className={s.row} {...hooks} hidden={hidden}>
      <span className={s.date}>{date}</span>
      <span className={s.kind}>{kindTag}</span>
      <div className={s.card}><MiniCard card={entry.card} /></div>
      <div className={s.notes}>
        {entry.version && <span className={s.ver}>{entry.version}</span>}
        {entry.note && <p className={s.note}>{entry.note}</p>}
        {includes.length > 0 && (
          <p className={s.sub}>{tn('changes.includes', includes.length, { list: includes.join(t('common.listSeparator')) })}</p>
        )}
        {changed.length > 0 && <p className={s.sub}>{t('changes.changed', { list: changed.join(t('common.listSeparator')) })}</p>}
      </div>
    </li>
  );
}
