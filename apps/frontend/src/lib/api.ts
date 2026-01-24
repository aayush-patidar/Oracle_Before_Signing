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
  const url = API_BASE === '/api' 
    ? `/api${endpoint}` 
    : `${API_BASE}${endpoint}`;

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
  const url = API_BASE === '/api'
    ? `/api${endpoint}`
    : `${API_BASE}${endpoint}`;
  return new EventSource(url);
}
