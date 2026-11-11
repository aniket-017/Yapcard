import { useEffect, type ReactNode } from 'react';
import { LEGAL_UPDATED } from '../config';
import { SiteFooter } from './SiteFooter';

/** Layout for the privacy, terms and support pages. */
export function DocPage({ title, intro, updated = true, children }: { title: string; intro: ReactNode; updated?: boolean; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Yapcard`;
  }, [title]);

  return (
    <>
      <header className="nav wrap">
        <a className="logo" href="/">yapcard</a>
        <a className="nav-link" href="/#download">Download</a>
      </header>

      <main className="doc wrap">
        <h1>{title}</h1>
        {updated && <p className="doc-date">Last updated {LEGAL_UPDATED}</p>}
        <p className="doc-intro">{intro}</p>
        {children}
      </main>

      <SiteFooter />
    </>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="doc-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
