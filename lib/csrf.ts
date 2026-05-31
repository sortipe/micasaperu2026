// CSRF Protection utilities for client-side form handling
// Uses Double Submit Cookie pattern via Supabase JWT + custom header

const CSRF_HEADER = 'x-csrf-token';
const CSRF_COOKIE = 'csrf-token';

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

let cachedToken: string | null = null;

export function getCsrfToken(): string {
  if (cachedToken) return cachedToken;
  cachedToken = generateToken();
  try {
    document.cookie = `${CSRF_COOKIE}=${cachedToken}; path=/; SameSite=Lax; Secure; max-age=86400`;
  } catch {}
  return cachedToken;
}

export function fetchWithCsrf(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (!headers.has(CSRF_HEADER)) {
    headers.set(CSRF_HEADER, getCsrfToken());
  }
  return fetch(input, { ...init, headers });
}
