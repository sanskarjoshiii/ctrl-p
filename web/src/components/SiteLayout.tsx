import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useCartCount } from '../store/cart';
import { useToasts } from '../store/toast';
import { IconCart, IconClose, IconMenu, Starburst } from './Doodles';
import { Logo, Selectable } from './Kit';
import './SiteLayout.css';

const NAV = [
  { to: '/templates', label: 'Templates' },
  { to: '/#how', label: 'How it works' },
  { to: '/diaries', label: 'My diaries' },
];

export function Toasts() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.tone === 'error' ? 'toast--error' : ''}`}>
          <span>{t.message}</span>
          {t.action ? (
            <button className="btn btn--sm btn--yellow" onClick={() => { t.action!.run(); dismiss(t.id); }}>{t.action.label}</button>
          ) : (
            <button className="toast__close" aria-label="Dismiss" onClick={() => dismiss(t.id)}><IconClose width={16} /></button>
          )}
        </div>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const count = useCartCount();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <Starburst className="site-header__burst site-header__burst--l float--slow float" />
      <Starburst className="site-header__burst site-header__burst--r float" />
      <Selectable as="nav" className={`site-nav ${open ? 'is-open' : ''}`}>
        <Logo className="site-nav__logo" />
        <button className="site-nav__toggle" aria-expanded={open} aria-controls="site-links" onClick={() => setOpen(o => !o)}>
          {open ? <IconClose width={22} /> : <IconMenu width={22} />}
          <span className="visually-hidden">Menu</span>
        </button>
        <ul id="site-links" className="site-nav__links" onClick={() => setOpen(false)}>
          {NAV.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} className={({ isActive }) => `site-nav__link ${isActive && !item.to.includes('#') ? 'is-active' : ''}`}>{item.label}</NavLink>
            </li>
          ))}
          <li>
            <NavLink to="/cart" className={({ isActive }) => `site-nav__link site-nav__cart ${isActive ? 'is-active' : ''}`} aria-label={`Cart, ${count} items`}>
              <IconCart width={22} />
              <span>Cart</span>
              {count > 0 && <span className="site-nav__count">{count}</span>}
            </NavLink>
          </li>
        </ul>
      </Selectable>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__row">
        <Logo />
        <p className="site-footer__mid">Travel diaries, printed with love · {new Date().getFullYear()}</p>
        <nav className="site-footer__links" aria-label="Footer">
          <Link to="/templates">Templates</Link>
          <Link to="/#faq">FAQ</Link>
          <a href="mailto:hello@bookdiaries.example">Contact</a>
        </nav>
      </div>
    </footer>
  );
}

export default function SiteLayout() {
  const { hash, pathname } = useLocation();
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, [hash, pathname]);

  return (
    <div className="site">
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
      <Toasts />
      <ScrollRestoration />
    </div>
  );
}
