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

const API_BASE_URL = resolveApiBaseUrl();

// Later we can make this dynamic (e.g. from logged-in user / subdomain)
const TENANT_SLUG = 'default';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': TENANT_SLUG,
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return null;

  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};
