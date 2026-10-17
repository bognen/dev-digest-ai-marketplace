import './styles/industry.css';
import './styles/global.css';
import { Layout } from './components/Layout';
import { ArtifactPage } from './pages/ArtifactPage';
import { GetStartedPage } from './pages/GetStartedPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PluginPage } from './pages/PluginPage';
import { SearchPage } from './pages/SearchPage';
import { WhatsNewPage } from './pages/WhatsNewPage';
import type { ArtifactDetailProps, HomeProps, PageData, PluginDetailProps, SearchProps, WhatsNewProps } from './types';

export function App({ route, site, props }: PageData) {
  return (
    // The guide is already on /get-started, so that page has no drawer.
    <Layout site={site} route={route} hasDrawer={route !== 'get-started'}>
      {route === 'home' && <HomePage site={site} {...(props as HomeProps)} />}
      {route === 'search' && <SearchPage site={site} {...(props as SearchProps)} />}
      {route === 'get-started' && <GetStartedPage site={site} />}
      {route === 'whats-new' && <WhatsNewPage site={site} {...(props as WhatsNewProps)} />}
      {route === 'plugin' && <PluginPage {...(props as PluginDetailProps)} />}
      {route === 'artifact' && <ArtifactPage {...(props as ArtifactDetailProps)} />}
      {route === '404' && <NotFoundPage />}
    </Layout>
  );
}
