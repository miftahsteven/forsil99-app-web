const TOKEN_KEY = 'ruang59_web_token';
const USER_KEY = 'ruang59_web_user';
const PROFILE_KEY = 'ruang59_web_profile';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';

export function getPlatformIdentifier(): string {
  if (typeof window === 'undefined') return 'web';
  const ua = navigator.userAgent || '';
  if (/iphone|ipad|ipod/i.test(ua)) {
    return 'web_ios';
  }
  if (/android/i.test(ua)) {
    return 'web_android';
  }
  return 'web';
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PROFILE_KEY);
}

export function getCachedUserProfile(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUserProfile(profile: any): void {
  if (typeof window === 'undefined' || !profile) return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('LocalStorage quota limit reached', e);
  }
}

export function getCachedUserData(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUserData(user: any): void {
  if (typeof window === 'undefined' || !user) return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.warn('LocalStorage quota limit reached', e);
  }
}

export function getCandidateBaseUrls(): string[] {
  const candidates: string[] = [];

  // 1. Same-origin relative path (most reliable for production HTTPS web)
  if (typeof window !== 'undefined' && window.location.origin) {
    candidates.push(`${window.location.origin}/api/v1`);
  }

  candidates.push('/api/v1');

  // 2. Explicit configured env url
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    candidates.push(process.env.NEXT_PUBLIC_API_BASE_URL);
  }

  // 3. Local development fallback
  if (process.env.NODE_ENV === 'development') {
    candidates.push('http://localhost:5001/api/v1');
    candidates.push('http://127.0.0.1:5001/api/v1');
  }

  return Array.from(new Set(candidates.filter(Boolean)));
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const token = getAccessToken();
  const platform = getPlatformIdentifier();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-platform': platform,
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (endpoint.startsWith('http')) {
    const response = await fetch(endpoint, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data = await response.json().catch(() => ({ message: `HTTP Error ${response.status}` }));
    if (!response.ok) {
      throw new Error(data.message || `API Error (${response.status})`);
    }
    return data;
  }

  const candidateUrls = getCandidateBaseUrls();
  let lastNetworkError: any = null;

  for (const baseUrl of candidateUrls) {
    const url = `${baseUrl}${cleanEndpoint}`;
    let response: Response;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);

      response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (netErr: any) {
      lastNetworkError = netErr;
      continue; // Network failed on this URL, try next candidate
    }

    // Server responded (status 200..599). Parse response:
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = { message: `Respon server tidak valid (${response.status})` };
    }

    if (!response.ok) {
      // Throw the server's actual error message directly (e.g. "Nomor HP sudah terdaftar", "Foto selfie wajib diunggah", etc.)
      throw new Error(data.message || `Terjadi kesalahan pada server (${response.status})`);
    }

    return data;
  }

  throw lastNetworkError || new Error('Gagal terhubung ke server (Koneksi jaringan bermasalah).');
}

export const apiClient = {
  get: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'POST', body }),
  put: <T = any>(endpoint: string, body?: any) => apiRequest<T>(endpoint, { method: 'PUT', body }),
  delete: <T = any>(endpoint: string) => apiRequest<T>(endpoint, { method: 'DELETE' }),
};
