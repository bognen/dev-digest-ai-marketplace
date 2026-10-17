// Onboarding as a side panel (bottom sheet below 768px), opened through
// OnboardingContext. A plugin switches the guide into contextual mode.
import { useEffect, useRef } from 'react';
import { t } from '../i18n';
import { url } from '../lib/site';
import type { SiteInfo } from '../types';
import { CloseIcon } from './Icons';
import { Onboarding } from './Onboarding';
import s from './OnboardingDrawer.module.css';

interface Props {
  site: SiteInfo;
  open: boolean;
  plugin: string | null;
  onClose: () => void;
}

export function OnboardingDrawer({ site, open, plugin, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.scrollTop = 0;
      if (plugin) requestAnimationFrame(() => dialog.querySelector('[data-step="install"]')?.scrollIntoView({ block: 'start' }));
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, plugin]);

  return (
    <dialog
      ref={ref}
      className={s.drawer}
      data-onboarding-drawer
      aria-labelledby="drawer-title"
      // Fires for Esc as well as close().
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={s.inner}>
        <header className={s.head}>
          <div className={s.titles}>
            <p className="kicker" data-drawer-kicker>{plugin ? t('drawer.kickerInstall') : t('drawer.kicker')}</p>
            <h2 id="drawer-title" data-drawer-title>{plugin ? t('drawer.titleInstall', { plugin }) : t('drawer.title')}</h2>
          </div>
          <button type="button" className="btn btn-secondary btn-icon" data-close-drawer aria-label={t('common.close')} onClick={onClose}>
            <CloseIcon />
          </button>
        </header>
        <Onboarding site={site} idPrefix="drawer" headingLevel="h3" contextPlugin={plugin} />
        <p className={s.foot}>
          <a href={plugin ? `${url('get-started')}?plugin=${encodeURIComponent(plugin)}` : url('get-started')} data-full-guide>
            {t('drawer.fullGuide')}
          </a>
        </p>
      </div>
    </dialog>
  );
}
