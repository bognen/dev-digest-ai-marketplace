import { useEffect, useState } from 'react';
import { SearchIcon } from '../components/Icons';
import { requestSearchFocus } from '../lib/events';
import { t } from '../i18n';
import { url } from '../lib/site';
import s from './NotFoundPage.module.css';

export function NotFoundPage() {
  // The same 404.html serves every missing path, so the path is filled in after load.
  const [path, setPath] = useState<string | null>(null);
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    let shown = location.pathname.startsWith(base) ? location.pathname.slice(base.length) || '/' : location.pathname;
    try {
      shown = decodeURIComponent(shown);
    } catch {
      // keep it encoded
    }
    setPath(shown);
  }, []);

  return (
    <div className="container">
      <div className={s.nf}>
        <p className={s.path} data-not-found-path>{path ? t('notFound.path', { path }) : '404'}</p>
        <h1>{t('notFound.title')}</h1>
        <p className={s.lead}>{t('notFound.lead')}</p>
        {/* The design shows a search box here; it hands off to the header search. */}
        <button
          type="button"
          className={s.search}
          data-not-found-search
          onClick={() => {
            window.scrollTo({ top: 0 });
            requestSearchFocus();
          }}
        >
          <SearchIcon size={18} />
          <span>{t('notFound.search')}</span>
          <kbd aria-hidden="true">/</kbd>
        </button>
        <div className={s.links}>
          <a className="btn btn-secondary" href={url()}>{t('notFound.home')}</a>
          <a className="btn btn-secondary" href={url('whats-new')}>{t('notFound.whatsNew')}</a>
          <a className="btn btn-secondary" href={url('get-started')}>{t('notFound.getStarted')}</a>
        </div>
      </div>
    </div>
  );
}
