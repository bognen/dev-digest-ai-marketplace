// "Start here" card for newcomers. Its states come from attributes on <html>
// that the inline script in index.html sets before first paint, so the server
// HTML is correct for every visitor:
//   expanded  — default
//   collapsed — [data-start-dismissed]: the card hides; HomePage shows a "Getting started" link
//   connected — [data-connected] (onboarding step 2 ticked): the primary action becomes "Browse what's new"
import { useState } from 'react';
import { rich, t } from '../i18n';
import { requestSearchFocus } from '../lib/events';
import { url } from '../lib/site';
import { save } from '../lib/storage';
import type { HomeProps, SiteInfo } from '../types';
import { CopyButton } from './CopyButton';
import { ArrowRightIcon, CheckIcon, CloseIcon, Corners } from './Icons';
import { useOnboardingGuide } from './OnboardingContext';
import s from './StartCard.module.css';

interface Props {
  site: SiteInfo;
  counts: HomeProps['counts'];
  starter: HomeProps['starter'];
}

export function StartCard({ site, counts, starter }: Props) {
  const { open } = useOnboardingGuide();
  const [starterOpen, setStarterOpen] = useState(false);
  const commands = starter.plugins.map((p) => p.installCommand).join('\n');
  const cells = (['plugin', 'skill', 'agent', 'command'] as const).map((type) => ({ type, n: counts[type], label: t(`start.stats.${type}`) }));

  const dismiss = () => {
    save('startCard', 'dismissed');
    document.documentElement.setAttribute('data-start-dismissed', '');
    document.querySelector<HTMLElement>('[data-show-start]')?.focus();
  };

  return (
    <section className={`blueprint ${s.card}`} data-start-card aria-labelledby="start-title">
      <Corners />
      <div className={s.copy}>
        <p className={`kicker ${s.kicker}`}>
          <span className={`${s.whenConnected} ${s.connectedKicker}`}><CheckIcon size={14} />{t('start.connected', { name: site.name })}</span>
          <span className={s.whenNew}>{t('start.kicker')}</span>
        </p>
        <h1 id="start-title">{t('start.title')}</h1>
        <p className={`${s.pitch} ${s.whenNew}`}>{t('start.pitch', { name: site.name })}</p>
        <p className={`${s.pitch} ${s.whenConnected}`}>{t('start.pitchConnected')}</p>
        <div className={s.actions}>
          <button type="button" className={`btn btn-primary blueprint ${s.whenNew}`} data-action="connect" data-open-onboarding onClick={() => open(null)}>
            <Corners />
            {t('start.connect')} <ArrowRightIcon />
          </button>
          <a className={`btn btn-primary blueprint ${s.whenConnected}`} data-action="browse" href={url('whats-new')}>
            <Corners />
            {t('start.browse')} <ArrowRightIcon />
          </a>
          <button type="button" className="btn btn-secondary" data-find-skill onClick={requestSearchFocus}>{t('start.findSkill')}</button>
          <button
            type="button"
            className="btn btn-secondary"
            data-starter-toggle
            aria-expanded={starterOpen}
            aria-controls="starter-pack"
            onClick={() => setStarterOpen((o) => !o)}
          >
            {t('start.starterPack')}
          </button>
        </div>
      </div>

      <div className={s.stats}>
        <div className={s.statsHead}>
          <span>catalog.json · {site.generatedAt.slice(0, 10)}</span>
          <button type="button" className={`btn btn-ghost btn-icon ${s.dismiss}`} data-dismiss-start aria-label={t('start.dismissAriaLabel')} title={t('start.dismiss')} onClick={dismiss}>
            <CloseIcon />
          </button>
        </div>
        {/* Each count opens the results page filtered to that type. */}
        {cells.map(({ type, n, label }) => (
          <a className={s.stat} key={type} href={`${url('search/')}?type=${type}`} data-stat={type}>
            <span className={s.statN}>{n}</span>
            <span className={s.statLabel}>{label}</span>
          </a>
        ))}
      </div>

      <div className={s.starter} id="starter-pack" hidden={!starterOpen}>
        <h2>{starter.title ?? t('start.starterPack')}</h2>
        {starter.plugins.length > 0 ? (
          <>
            {starter.description && <p className={s.starterDesc}>{starter.description}</p>}
            <ul>
              {starter.plugins.map((p) => (
                <li key={p.name}>
                  <span className={s.starterName}>{p.name}</span>
                  <span className={s.starterDesc}>{p.description}</span>
                </li>
              ))}
            </ul>
            <pre className={s.starterCmds}>{commands}</pre>
            <CopyButton text={commands} className="btn btn-primary blueprint" label={t('start.copyAll')}>
              <Corners />
            </CopyButton>
          </>
        ) : (
          <p className={s.starterDesc}>
            {rich('start.starterEmpty', {}, { link: (c) => <a href={url('whats-new')}>{c}</a> })}
          </p>
        )}
      </div>
    </section>
  );
}
