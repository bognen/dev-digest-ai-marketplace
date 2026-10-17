// Compact artifact card used on the What's New timeline. The install button
// opens the onboarding guide in contextual mode.
import { label, t } from '../i18n';
import type { CardInfo } from '../types';
import { useOnboardingGuide } from './OnboardingContext';
import s from './MiniCard.module.css';

export function MiniCard({ card }: { card: CardInfo }) {
  const { open } = useOnboardingGuide();
  const cls = [s.card, (card.deprecated || card.removed) && s.dim, card.removed && s.removed].filter(Boolean).join(' ');
  return (
    <article className={cls}>
      <div className={s.badges}>
        <span className={`type-code ${s.code}`} title={label('types', card.type)}>{label('typeCodes', card.type)}</span>
        {card.badges.map((b) => <span key={b.kind} className={`tag ${b.cls} ${s.tag}`}>{label('badges', b.kind)}</span>)}
      </div>
      <h3 className={s.title}>{card.href ? <a href={card.href}>{card.name}</a> : <span>{card.name}</span>}</h3>
      {card.type !== 'plugin' && <p className={s.foot}>{t('common.inPlugin', { plugin: card.plugin })}</p>}
      {card.installable && (
        <button
          type="button"
          className={`btn btn-ghost ${s.install}`}
          data-open-onboarding
          data-plugin={card.plugin}
          aria-label={t('common.installAriaLabel', { plugin: card.plugin })}
          onClick={() => open(card.plugin)}
        >
          {card.type === 'plugin' ? t('common.install') : t('common.installWith', { plugin: card.plugin })}
        </button>
      )}
    </article>
  );
}
