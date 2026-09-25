/**
 * Helper utility to decode and validate JWT tokens safely in both browser and Edge runtimes.
 */

export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    let jsonStr: string;
    try {
      jsonStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      jsonStr = atob(base64);
    }

    const parsed = JSON.parse(jsonStr);
    if (!parsed.exp) return false;

    // Buffer 5 seconds to treat almost-expired token as expired
    return Date.now() >= (parsed.exp * 1000) - 5000;
  } catch {
    return true;
  }
}
