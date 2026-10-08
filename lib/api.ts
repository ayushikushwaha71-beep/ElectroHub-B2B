const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

type RequestOptions = RequestInit & { token?: string; _retry?: boolean };

// ─── Silent token refresh ──────────────────────────────────────────────────────
// Called automatically when a 401 is received. Returns new access token or null.
async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const refresh = localStorage.getItem('electrohub_refresh_token');
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/token/refresh/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh }),
    });
    if (!res.ok) {
      // Refresh token also expired — clear everything
      localStorage.removeItem('electrohub_access_token');
      localStorage.removeItem('electrohub_refresh_token');
      localStorage.removeItem('electrohub_user');
      return null;
    }
    const data = await res.json();
    // SimpleJWT with ROTATE_REFRESH_TOKENS=True returns new refresh too
    if (data.access)  localStorage.setItem('electrohub_access_token',  data.access);
    if (data.refresh) localStorage.setItem('electrohub_refresh_token', data.refresh);
    return data.access ?? null;
  } catch {
    return null;
  }
}

// ─── Core request ──────────────────────────────────────────────────────────────
async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, _retry, ...rest } = options;

  // Read token from localStorage if not explicitly supplied
  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    authToken = localStorage.getItem('electrohub_access_token') || undefined;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  // Handle 204 No Content (DELETE responses have no body)
  if (response.status === 204) return null as unknown as T;

  // ── Auto-refresh on 401 (once) ────────────────────────────────────────────
  if (response.status === 401 && !_retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry original request with fresh token (mark _retry to prevent loops)
      return apiRequest<T>(endpoint, { ...options, token: newToken, _retry: true });
    }
    // Could not refresh — let the error bubble through below
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    // DRF can return errors as: { detail }, { message }, { field: [msgs] }, { non_field_errors: [msgs] }
    const msg =
      data?.detail ||
      data?.message ||
      data?.non_field_errors?.[0] ||
      (typeof data === 'object' && data !== null
        ? Object.values(data as Record<string, unknown>)
            .flatMap((v) => (Array.isArray(v) ? v : [v]))
            .filter(Boolean)
            .join(' ')
        : null) ||
      'Something went wrong.';
    throw new Error(msg);
  }
  return data;
}


export const api = {
  get:    <T>(endpoint: string, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'GET',    ...options }),
  post:   <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'POST',   body: body ? JSON.stringify(body) : undefined, ...options }),
  patch:  <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined, ...options }),
  put:    <T>(endpoint: string, body?: unknown, options?: RequestOptions) => apiRequest<T>(endpoint, { method: 'PUT',    body: body ? JSON.stringify(body) : undefined, ...options }),
  delete: <T>(endpoint: string, options?: RequestOptions)                 => apiRequest<T>(endpoint, { method: 'DELETE', ...options }),
};
