// Quick search: a keyword filter over catalog.json (loaded on first focus)
// until full search ships.
import { useEffect, useRef, useState, type RefObject } from 'react';
import { label, t, tn } from '../i18n';
import { rank } from '../lib/search';
import { detailPath, url } from '../lib/site';
import { SearchIcon } from './Icons';
import s from './Search.module.css';

interface Artifact {
  id: string;
  type: string;
  name: string;
  title: string | null;
  description: string;
  plugin: string;
  tags: string[];
  sourceUrl: string | null;
}

let catalog: Promise<Artifact[]> | null = null;
const loadCatalog = () =>
  (catalog ??= fetch(url('catalog.json'))
    .then((r) => r.json())
    .then((c) => c.artifacts as Artifact[])
    .catch(() => []));

interface Props {
  className?: string;
  inputRef: RefObject<HTMLInputElement>;
  placeholder: string;
}

export function Search({ className = '', inputRef, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Artifact[] | null>(null); // null = closed
  const [empty, setEmpty] = useState(false); // catalog has no artifacts at all
  const [total, setTotal] = useState(0); // all matches; the list shows the first 6
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    let stale = false;
    loadCatalog().then((all) => {
      if (stale) return;
      const found = rank(all, q);
      setEmpty(all.length === 0);
      setTotal(found.length);
      setResults(found.slice(0, 6));
      setActive(-1);
    });
    return () => {
      stale = true;
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setResults(null);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const open = results !== null;
  // Options: the results, then "See all N results".
  const options = results?.length ? results.length + 1 : 0;
  const move = (step: number) => {
    if (!options) return;
    setActive((i) => (i < 0 ? (step > 0 ? 0 : options - 1) : (i + step + options) % options));
  };
  const allResultsUrl = `${url('search/')}?q=${encodeURIComponent(query.trim())}`;

  return (
    <div className={`${s.search} ${className}`} id="header-search" ref={wrapRef}>
      <label htmlFor="site-search" className="visually-hidden">{t('search.label')}</label>
      <SearchIcon className={s.icon} />
      <input
        ref={inputRef}
        id="site-search"
        className="input"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        aria-autocomplete="list"
        aria-activedescendant={open && active >= 0 ? `sr-${active}` : undefined}
        value={query}
        onFocus={() => loadCatalog()}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
          else if (e.key === 'Escape') { setResults(null); }
          else if (e.key === 'Enter') {
            e.preventDefault();
            // The highlighted result, or every result on the results page.
            if (open && active >= 0) listRef.current?.querySelectorAll<HTMLAnchorElement>('li[role="option"] a')[active]?.click();
            else if (query.trim()) location.href = allResultsUrl;
          }
        }}
      />
      <kbd className={s.key} aria-hidden="true">/</kbd>
      <ul id="search-results" ref={listRef} className={s.results} role="listbox" aria-label={t('search.results')} hidden={!open}>
        {open && results.length === 0 && (
          <li className={s.none}>{empty ? t('search.nothingPublished') : t('search.noMatches', { query: query.trim() })}</li>
        )}
        {results?.map((a, i) => (
          <li key={a.id} id={`sr-${i}`} role="option" aria-selected={i === active} className={i === active ? s.active : undefined}>
            <a href={url(detailPath(a.id))} tabIndex={-1} onMouseEnter={() => setActive(i)}>
              <span className={s.code}>{label('typeCodes', a.type)}</span>
              <span className={s.name}>{a.title || a.name}</span>
              <span className={s.plugin}>{a.plugin}</span>
            </a>
          </li>
        ))}
        {!!results?.length && (
          <li id={`sr-${results.length}`} role="option" aria-selected={active === results.length} className={`${s.seeAll} ${active === results.length ? s.active : ''}`}>
            <a href={allResultsUrl} tabIndex={-1} data-search-all onMouseEnter={() => setActive(results.length)}>{tn('search.seeAll', total)}</a>
          </li>
        )}
      </ul>
    </div>
  );
}
