export function SiteFooter() {
  return (
    <footer className="footer wrap">
      <a className="logo logo-small" href="/">yapcard</a>
      <nav className="footer-links" aria-label="Legal and support">
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/support">Support</a>
      </nav>
      <span>© {new Date().getFullYear()} Yapcard. Not affiliated with WhatsApp or Telegram.</span>
    </footer>
  );
}
