import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/bricolage-grotesque/800.css';
import './styles.css';
import { App } from './App';
import { Privacy } from './pages/Privacy';
import { Support } from './pages/Support';
import { Terms } from './pages/Terms';

// The server answers every extension-less path with index.html, so routing is just the pathname.
const PAGES: Record<string, ComponentType> = {
  '/privacy': Privacy,
  '/privacy-policy': Privacy,
  '/terms': Terms,
  '/support': Support,
};
const Page = PAGES[window.location.pathname.replace(/\/+$/, '').toLowerCase()] ?? App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
