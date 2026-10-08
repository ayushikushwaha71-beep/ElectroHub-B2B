'use client';

import * as React from 'react';
import { api } from '@/lib/api';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id:        string;
  name:      string;
  email:     string;
  createdAt: string;
  role: 'customer' | 'vendor' | 'admin';
}

export interface AuthError {
  field?: 'email' | 'password' | 'name' | 'confirmPassword' | 'general';
  message: string;
}

export interface LoginResult {
  error: AuthError | null;
  user:  AuthUser | null;
}

interface AuthContextValue {
  user:       AuthUser | null;
  isLoggedIn: boolean;
  isLoading:  boolean;
  login:      (email: string, password: string) => Promise<LoginResult>;
  register:   (name: string, email: string, password: string) => Promise<LoginResult>;
  logout:     () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────
const AuthContext = React.createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'electrohub_user';

function loadCachedUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw    = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed ? { ...parsed, role: (parsed.role ?? 'customer').toLowerCase() as AuthUser['role'] } : null;
  } catch { return null; }
}

function persistCurrentUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else       localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
}

function clearAllTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('electrohub_access_token');
  localStorage.removeItem('electrohub_refresh_token');
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  // isHydrating = true until we've checked localStorage AND optionally the backend
  const [isHydrating, setIsHydrating] = React.useState(true);

  // ── Session hydration on mount ─────────────────────────────────────────────
  React.useEffect(() => {
    const cached = loadCachedUser();
    const token  = typeof window !== 'undefined'
      ? localStorage.getItem('electrohub_access_token')
      : null;

    if (!cached || !token) {
      // No stored session — done immediately
      setUser(null);
      setIsHydrating(false);
      return;
    }

    // We have a cached user + token. Use cached user immediately for fast paint,
    // then silently verify with the backend in the background.
    setUser(cached);

    api.get<{
      id: number;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      date_joined: string;
    }>('/profile/')
      .then((profile) => {
        // Build fresh AuthUser from live profile data
        const freshUser: AuthUser = {
          id:        String(profile.id),
          name:      `${profile.first_name} ${profile.last_name}`.trim() || profile.email,
          email:     profile.email,
          createdAt: profile.date_joined,
          role:      profile.role.toLowerCase() as AuthUser['role'],
        };
        setUser(freshUser);
        persistCurrentUser(freshUser);
      })
      .catch(() => {
        // 401 that couldn't be refreshed → api.ts already cleared tokens
        // Check if access token was wiped (refresh expired too)
        const stillHasToken = typeof window !== 'undefined'
          ? localStorage.getItem('electrohub_access_token')
          : null;
        if (!stillHasToken) {
          setUser(null);
          persistCurrentUser(null);
        }
        // If token was silently refreshed by api.ts and the retry also failed,
        // the tokens were already cleared above.
      })
      .finally(() => {
        setIsHydrating(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── login ──────────────────────────────────────────────────────────────────
  const login = React.useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      setIsLoading(true);
      try {
        const response = await api.post<{
          access:  string;
          refresh: string;
          user: { id: number; name: string; email: string; role: AuthUser['role'] };
        }>('/login/', { email, password });

        localStorage.setItem('electrohub_access_token',  response.access);
        localStorage.setItem('electrohub_refresh_token', response.refresh);

        const authUser: AuthUser = {
          id:        String(response.user.id),
          name:      response.user.name,
          email:     response.user.email,
          createdAt: new Date().toISOString(),
          role:      (response.user.role as string).toLowerCase() as AuthUser['role'],
        };
        setUser(authUser);
        persistCurrentUser(authUser);
        return { error: null, user: authUser };
      } catch (err) {
        return {
          error: {
            field:   'general',
            message: err instanceof Error ? err.message : 'Invalid email or password.',
          },
          user: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── register ───────────────────────────────────────────────────────────────
  const register = React.useCallback(
    async (name: string, email: string, password: string): Promise<LoginResult> => {
      setIsLoading(true);
      try {
        const parts     = name.trim().split(/\s+/);
        const firstName = parts[0] ?? '';
        const lastName  = parts.slice(1).join(' ');

        const response = await api.post<{
          access:  string;
          refresh: string;
          user: { id: number; name: string; email: string; role: AuthUser['role'] };
        }>('/register/', {
          first_name:       firstName,
          last_name:        lastName,
          email,
          password,
          confirm_password: password,
        });

        localStorage.setItem('electrohub_access_token',  response.access);
        localStorage.setItem('electrohub_refresh_token', response.refresh);

        const authUser: AuthUser = {
          id:        String(response.user.id),
          name:      response.user.name || name,
          email:     response.user.email,
          createdAt: new Date().toISOString(),
          role:      (response.user.role as string).toLowerCase() as AuthUser['role'],
        };
        setUser(authUser);
        persistCurrentUser(authUser);
        return { error: null, user: authUser };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Registration failed.';
        const isEmailError = message.toLowerCase().includes('email') || message.toLowerCase().includes('already');
        return {
          error: {
            field:   isEmailError ? 'email' : 'general',
            message,
          },
          user: null,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── logout ─────────────────────────────────────────────────────────────────
  const logout = React.useCallback(() => {
    const refresh     = typeof window !== 'undefined' ? localStorage.getItem('electrohub_refresh_token') : null;
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('electrohub_access_token')  : null;
    if (refresh) {
      // Fire-and-forget blacklist — backend will invalidate the refresh token
      api.post('/logout/', { refresh }, { token: accessToken ?? undefined }).catch(() => { /* ignore */ });
    }
    clearAllTokens();
    setUser(null);
  }, []);

  // Block rendering until hydration is done to prevent SSR/localStorage mismatch
  if (isHydrating) return null;

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
