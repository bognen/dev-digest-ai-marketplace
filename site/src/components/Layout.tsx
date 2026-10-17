import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { t } from '../i18n';
import type { RouteId, SiteInfo } from '../types';
import { Footer } from './Footer';
import { Header } from './Header';
import { OnboardingContext } from './OnboardingContext';
import { OnboardingDrawer } from './OnboardingDrawer';

interface Props {
  site: SiteInfo;
  route: RouteId;
  hasDrawer: boolean;
  children: ReactNode;
}

export function Layout({ site, route, hasDrawer, children }: Props) {
  const [drawer, setDrawer] = useState<{ open: boolean; plugin: string | null }>({ open: false, plugin: null });
  const [pagePlugin, setPagePlugin] = useState<string | null>(null);

  const open = useCallback(
    (plugin: string | null) => {
      if (hasDrawer) {
        setDrawer({ open: true, plugin });
        return;
      }
      // On /get-started the guide is already on the page.
      setPagePlugin(plugin);
      document.querySelector(plugin ? '[data-step="install"]' : '[data-step="prereq"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [hasDrawer],
  );
  const context = useMemo(() => ({ open, pagePlugin }), [open, pagePlugin]);

  return (
    <OnboardingContext.Provider value={context}>
      <a className="skip" href="#main">{t('layout.skipToContent')}</a>
      <Header site={site} route={route} />
      <main id="main">{children}</main>
      <Footer site={site} />
      {hasDrawer && (
        <OnboardingDrawer site={site} open={drawer.open} plugin={drawer.plugin} onClose={() => setDrawer((d) => ({ ...d, open: false }))} />
      )}
    </OnboardingContext.Provider>
  );
}
