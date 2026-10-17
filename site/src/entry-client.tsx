// Browser entry: hydrates the server-rendered page with the props embedded in it.
import { hydrateRoot } from 'react-dom/client';
import { App } from './App';
import type { PageData } from './types';

const data = JSON.parse(document.getElementById('page-data')!.textContent!) as PageData;
hydrateRoot(document.getElementById('root')!, <App {...data} />);
