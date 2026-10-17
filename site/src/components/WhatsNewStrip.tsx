import { t } from '../i18n';
import { url } from '../lib/site';
import type { ChangeView } from '../types';
import { ChangeEntry } from './ChangeEntry';
import s from './WhatsNewStrip.module.css';

/** The latest changes on the homepage. */
export function WhatsNewStrip({ latest }: { latest: ChangeView[] }) {
  return (
    <section className={s.section} aria-labelledby="strip-title">
      <div className="section-head">
        <h2 id="strip-title">{t('strip.title')}</h2>
        {latest.length > 0 && <a href={url('whats-new')}>{t('strip.seeAll')}</a>}
      </div>
      {latest.length > 0 ? (
        <ul className={s.strip}>
          {latest.map((entry, i) => <ChangeEntry key={i} entry={entry} compact />)}
        </ul>
      ) : (
        <div className="empty">
          <p>{t('strip.empty')}</p>
        </div>
      )}
    </section>
  );
}
