// The admin bundle. Lazy-loaded from /admin/*, never linked from the
// storefront, and marked noindex while it is mounted.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router';
import { can, ROLE_LABELS, type Permission } from '@shared/admin';
import { Toasts } from '../components/SiteLayout';
import { toast } from '../store/toast';
import { adminApi, AdminApiError, type Session } from './api';
import Login from './Login';
import OrderDetail from './OrderDetail';
import Orders from './Orders';
import Overview from './Overview';
import './admin.css';

interface AdminSession extends Session {
  signOut: () => void;
  allows: (permission: Permission) => boolean;
}

const SessionContext = createContext<AdminSession | null>(null);

export function useSession(): AdminSession {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession used outside the admin');
  return value;
}

/** Keeps the admin out of search results without touching index.html. */
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = 'Book Diaries admin';
    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, []);
}

export default function AdminApp() {
  useNoIndex();
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<'loading' | 'ready'>('loading');
  const location = useLocation();

  useEffect(() => {
    let live = true;
    adminApi
      .me()
      .then(s => live && setSession(s))
      .catch(() => live && setSession(null))
      .finally(() => live && setState('ready'));
    return () => {
      live = false;
    };
  }, []);

  const signOut = useCallback(() => {
    adminApi.logout().catch(() => undefined);
    setSession(null);
  }, []);

  if (state === 'loading') {
    return (
      <div className="admin admin--centre">
        <p className="muted">Checking your session…</p>
      </div>
    );
  }

  if (!session) return <Login onSignedIn={setSession} />;

  const value: AdminSession = {
    ...session,
    signOut,
    allows: permission => can(session.user.role, permission),
  };

  return (
    <SessionContext.Provider value={value}>
      <div className="admin">
        <header className="admin__bar">
          <div className="admin__brand">
            Book&nbsp;Diaries <span>admin</span>
          </div>
          <nav className="admin__nav">
            <NavLink to="/admin" end>
              Overview
            </NavLink>
            <NavLink to="/admin/orders">Orders</NavLink>
          </nav>
          <div className="admin__who">
            <span>
              {session.user.name} · {ROLE_LABELS[session.user.role]}
            </span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        <main className="admin__main" key={location.pathname}>
          <Routes>
            <Route index element={<Overview />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
        <Toasts />
      </div>
    </SessionContext.Provider>
  );
}

/** A dropped session anywhere in the admin sends you back to the sign-in form. */
export function useApiErrorHandler() {
  const { signOut } = useSession();
  return useCallback(
    (err: unknown, fallback: string) => {
      if (err instanceof AdminApiError && err.status === 401) {
        toast('Your session expired — sign in again', 'error');
        signOut();
        return;
      }
      toast(err instanceof Error ? err.message : fallback, 'error');
    },
    [signOut],
  );
}

