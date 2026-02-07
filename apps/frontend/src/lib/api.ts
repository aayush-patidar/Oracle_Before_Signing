/**
 * API utility to handle requests to backend
 * Uses Next.js rewrites to proxy to backend
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Fetch from backend API
 * If NEXT_PUBLIC_API_URL is set, uses direct URL
 * Otherwise uses Next.js rewrites (/api/*)
 */
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  // Construct URL properly:
  // - If API_BASE is '/api' (local), use '/api' + endpoint
  // - If API_BASE is external URL (e.g., https://backend.onrender.com), use API_BASE + '/api' + endpoint
  let url: string;

  if (API_BASE === '/api') {
    // Local development: use Next.js rewrites
    url = `/api${endpoint}`;
  } else {
    // Production: external backend URL
    // Ensure we add /api prefix since backend routes are defined with /api
    url = `${API_BASE}/api${endpoint}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch from backend with streaming
 */
export function apiStream(endpoint: string): EventSource {
  let url: string;

  if (API_BASE === '/api') {
    url = `/api${endpoint}`;
  } else {
    url = `${API_BASE}/api${endpoint}`;
  }

  return new EventSource(url);
}
