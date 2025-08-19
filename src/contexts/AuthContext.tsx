import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ORG_ID, SITE_ID } from '../../db_connect';

type ServerUser = {
  userId: string;
  email: string;
  userName: string;
  isSuperAdmin?: boolean;
  organizations?: Record<string, unknown>;
};

type AuthState = {
  user: ServerUser | null;
  loading: boolean;
  isAuthorized: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ServerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Dynamic endpoints: localhost in dev, production in deploy
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const AUTH_API_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';
  const LOGIN_UI_BASE = isLocalhost ? 'http://localhost:5001' : 'https://login.intuitiva.pt';

  useEffect(() => {
    let cancelled = false;
    async function refreshSession() {
      try {
        const res = await fetch(`${AUTH_API_BASE}/refreshSession`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          if (!cancelled) {
            setUser(null);
            setIsAuthorized(false);
          }
        } else {
          const data = await res.json().catch(() => null);
          const u = (data && data.user) ? data.user as ServerUser : null;
          if (!cancelled) {
            setUser(u);
            const allowed = !!(u && u.isSuperAdmin === true); // Super-admin only for now
            setIsAuthorized(allowed);
          }
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setIsAuthorized(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    refreshSession();
    return () => { cancelled = true; };
  }, [AUTH_API_BASE]);

  const value = useMemo<AuthState>(() => ({
    user,
    loading,
    isAuthorized,
    async signIn() {
      const redirectTo = window.location.href;
      const url = new URL('/login', LOGIN_UI_BASE);
      url.searchParams.set('redirect', redirectTo);
      url.searchParams.set('siteId', SITE_ID);
      url.searchParams.set('orgId', ORG_ID);
      // Simple redirect (original flow)
      window.location.href = url.toString();
    },
    async signOut() {
      try {
        await fetch(`${AUTH_API_BASE}/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
      } finally {
        setUser(null);
        setIsAuthorized(false);
        window.location.reload();
      }
    },
  }), [user, loading, isAuthorized, AUTH_API_BASE, LOGIN_UI_BASE]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}


