import { rich, t } from '../i18n';
import { formatDate, url } from '../lib/site';
import type { SiteInfo } from '../types';
import s from './Footer.module.css';

export function Footer({ site }: { site: SiteInfo }) {
  return (
    <footer className={s.footer}>
      <div className={`container ${s.row}`}>
        <nav aria-label={t('nav.footer')} className={s.nav}>
          {site.repo && <a href={`https://github.com/${site.repo}`}>{t('nav.github')}</a>}
          {site.repo && <a href={`https://github.com/${site.repo}/blob/main/CONTRIBUTING.md`}>{t('nav.contribute')}</a>}
          <a href={url('catalog.json')}>catalog.json</a>
          <a href={url('changes.json')}>changes.json</a>
        </nav>
        <p className={s.updated}>
          {rich('footer.updated', { date: <time dateTime={site.generatedAt}>{formatDate(site.generatedAt)}</time> })}
        </p>
      </div>
    </footer>
  );
}
