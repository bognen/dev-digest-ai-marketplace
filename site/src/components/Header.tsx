import { useCallback, useEffect, useRef, useState } from 'react';
import { t, tn, type MessageKey } from '../i18n';
import { FOCUS_SEARCH } from '../lib/events';
import { url } from '../lib/site';
import type { RouteId, SiteInfo } from '../types';
import s from './Header.module.css';
import { MenuIcon, SearchIcon, StarIcon } from './Icons';
import { Search } from './Search';
import { ThemeToggle } from './ThemeToggle';

const NAV: { label: MessageKey; path: string; route: RouteId }[] = [
  { label: 'nav.browse', path: 'search/', route: 'search' },
  { label: 'nav.whatsNew', path: 'whats-new', route: 'whats-new' },
  { label: 'nav.getStarted', path: 'get-started', route: 'get-started' },
];

export function Header({ site, route }: { site: SiteInfo; route: RouteId }) {
  // Below 1024px the search field and the nav fold into icon buttons.
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (focusRequest) inputRef.current?.focus();
  }, [focusRequest]);

  const revealSearch = useCallback(() => {
    if (!inputRef.current?.offsetParent) {
      setSearchOpen(true);
      setMenuOpen(false);
    }
    setFocusRequest((n) => n + 1);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement;
      if (event.key === '/' && !el.closest('input, textarea, select, [contenteditable="true"]')) {
        event.preventDefault();
        revealSearch();
      }
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener(FOCUS_SEARCH, revealSearch);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener(FOCUS_SEARCH, revealSearch);
    };
  }, [revealSearch]);

  const stars = site.stars;
  const repoUrl = site.repo ? `https://github.com/${site.repo}` : null;

  return (
    <header
      className={`${s.header} ${searchOpen ? s.searchOpen : ''}`}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && menuOpen) {
          setMenuOpen(false);
          menuToggleRef.current?.focus();
        }
      }}
    >
      <div className={`container ${s.row}`}>
        <a className={s.brand} href={url()} aria-label={t('header.homeAriaLabel', { name: site.name })}>
          <span className={s.mark} aria-hidden="true"><span /></span>
          <span className={s.brandName}>{site.name}</span>
        </a>

        <Search
          className={s.search}
          inputRef={inputRef}
          placeholder={site.artifactCount ? tn('header.searchPlaceholder', site.artifactCount) : t('header.searchPlaceholderEmpty')}
        />

        <nav className={s.nav} aria-label={t('nav.main')}>
          {NAV.map((n) => (
            <a key={n.path} href={url(n.path)} aria-current={route === n.route ? 'page' : undefined}>{t(n.label)}</a>
          ))}
        </nav>

        <div className={s.actions}>
          <button
            type="button"
            className={`btn btn-secondary btn-icon ${s.compactOnly}`}
            data-search-toggle
            aria-controls="header-search"
            aria-expanded={searchOpen}
            aria-label={t('header.searchToggle')}
            onClick={() => {
              if (searchOpen) setSearchOpen(false);
              else revealSearch();
            }}
          >
            <SearchIcon />
          </button>
          {repoUrl && (
            <a className={`btn btn-secondary ${s.gh}`} href={repoUrl} aria-label={stars != null ? tn('header.githubAriaLabelStars', stars) : t('header.githubAriaLabel')}>
              {t('nav.github')}
              {stars != null && (
                <>
                  <StarIcon size={14} />
                  <span className={s.stars}>{stars}</span>
                </>
              )}
            </a>
          )}
          <ThemeToggle />
          <button
            ref={menuToggleRef}
            type="button"
            className={`btn btn-secondary btn-icon ${s.compactOnly}`}
            data-menu-toggle
            aria-controls="mobile-menu"
            aria-expanded={menuOpen}
            aria-label={t('header.menu')}
            onClick={() => {
              setMenuOpen(!menuOpen);
              setSearchOpen(false);
            }}
          >
            <MenuIcon />
          </button>
        </div>
      </div>
      <nav className={s.mobileMenu} id="mobile-menu" aria-label={t('nav.main')} hidden={!menuOpen}>
        {NAV.map((n) => (
          <a key={n.path} href={url(n.path)} aria-current={route === n.route ? 'page' : undefined}>{t(n.label)}</a>
        ))}
        {repoUrl && <a href={repoUrl}>{stars != null ? t('header.githubStars', { count: stars }) : t('nav.github')}</a>}
      </nav>
    </header>
  );
}
