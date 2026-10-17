import { StartCard } from '../components/StartCard';
import { WhatsNewStrip } from '../components/WhatsNewStrip';
import { t } from '../i18n';
import { save } from '../lib/storage';
import type { HomeProps, SiteInfo } from '../types';
import s from './HomePage.module.css';

export function HomePage({ site, counts, starter, latest }: HomeProps & { site: SiteInfo }) {
  const showStart = () => {
    save('startCard', null);
    document.documentElement.removeAttribute('data-start-dismissed');
    [...document.querySelectorAll<HTMLElement>('[data-start-card] [data-action], [data-start-card] [data-find-skill]')].find((b) => b.offsetParent)?.focus();
  };

  return (
    <div className={`container ${s.home}`}>
      <StartCard site={site} counts={counts} starter={starter} />

      {/* Shown instead of the Start card once it is dismissed. */}
      <section className={s.collapsed} data-collapsed-hero aria-labelledby="home-title">
        <h1 id="home-title">{t('home.title')}</h1>
        <p>{site.description || t('site.fallbackDescription')}</p>
        <button type="button" className={s.gettingStarted} data-show-start onClick={showStart}>{t('home.showStart')}</button>
      </section>

      <WhatsNewStrip latest={latest} />
    </div>
  );
}
