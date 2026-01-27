// src/api/client.js

const DEFAULT_API_PORT = 5018;

// 1. Resolve base URL from env first (so you can point to any remote host)
function resolveApiBaseUrl() {
  // Vite-style env (VITE_API_BASE_URL=https://api.myphishapp.com)
  const viteBase =
    typeof import.meta !== 'undefined' &&
    import.meta.env &&
    import.meta.env.VITE_API_BASE_URL;

  // CRA / generic env (REACT_APP_API_BASE_URL=https://api.myphishapp.com)
  const craBase = typeof process !== 'undefined'
    ? process.env.REACT_APP_API_BASE_URL
    : undefined;

  if (viteBase) return viteBase.replace(/\/+$/, '');
  if (craBase) return craBase.replace(/\/+$/, '');

  // Fallback: same host as frontend but fixed port (useful in dev)
  if (typeof window !== 'undefined' && window.location) {
    const protocol = window.location.protocol || 'http:';
    const hostname = window.location.hostname || 'localhost';
    return `${protocol}//${hostname}:${DEFAULT_API_PORT}`;
  }

  // Final fallback
  return `http://localhost:${DEFAULT_API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

const TENANT_STORAGE_KEY = 'tenantSlug';

function resolveTenantSlug() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem(TENANT_STORAGE_KEY);
    if (stored && stored.trim()) return stored.trim().toLowerCase();
  }

  return 'default';
}

function resolveUserRole() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('userRole');
    if (stored && stored.trim()) return stored.trim();
  }

  return 'TenantAdmin';
}

function resolveUserEmail() {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('userEmail');
    if (stored && stored.trim()) return stored.trim();
  }

  return '';
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': resolveTenantSlug(),
    'X-Role': resolveUserRole(),
    ...(resolveUserEmail() ? { 'X-User-Email': resolveUserEmail() } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {
      try {
        const text = await res.text();
        if (text) message = `${message}: ${text}`;
      } catch {
        // ignore
      }
    }
    throw new Error(`${message} (URL: ${url})`);
  }

  if (res.status === 204) return null;

  return res.json();
}

export const api = {
  get: (path, options = {}) => request(path, options),
  post: (path, body, options = {}) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (path, body, options = {}) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  del: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};
