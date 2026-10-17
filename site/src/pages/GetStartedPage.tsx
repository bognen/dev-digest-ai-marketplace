import { Corners } from '../components/Icons';
import { Onboarding } from '../components/Onboarding';
import { useOnboardingGuide } from '../components/OnboardingContext';
import { rich, t } from '../i18n';
import { url } from '../lib/site';
import type { SiteInfo } from '../types';
import s from './GetStartedPage.module.css';

export function GetStartedPage({ site }: { site: SiteInfo }) {
  const { pagePlugin } = useOnboardingGuide();
  return (
    <div className={`container ${s.layout}`}>
      <div className={s.main}>
        <header className={s.head}>
          <p className="kicker">{t('getStarted.kicker')}</p>
          <h1>{t('getStarted.title')}</h1>
          <p>{t('getStarted.intro')}</p>
        </header>
        {/* pagePlugin is null until an install button on this page sets it; ?plugin= is read by the guide itself. */}
        <Onboarding site={site} idPrefix="page" fromQuery contextPlugin={pagePlugin ?? undefined} />
      </div>

      <aside className={s.aside} aria-label={t('getStarted.asideLabel')}>
        <div className={`blueprint ${s.card}`}>
          <Corners />
          <h2>{t('getStarted.terminalTitle')}</h2>
          <p>{rich('getStarted.terminalBody')}</p>
          <p className={s.soon}>{t('getStarted.comingSoon')}</p>
        </div>
        <nav className={s.next} aria-labelledby="next-title">
          <h2 id="next-title">{t('getStarted.next')}</h2>
          <a href={url('whats-new')}>{t('getStarted.seeWhatsNew')}<span aria-hidden="true">→</span></a>
          <a href={url()}>{t('getStarted.backToCatalog')}<span aria-hidden="true">→</span></a>
        </nav>
      </aside>
    </div>
  );
}
