declare global {
  interface Window {
    grecaptcha: any;
  }
}

export const RECAPTCHA_V3_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6Lc2i5UtAAAAAJ5j6TzvLV5W2_LDSbXPXTbg_UWJ';

let scriptLoadingPromise: Promise<void> | null = null;

export function loadRecaptchaV3Script(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha && window.grecaptcha.execute) return Promise.resolve();

  if (scriptLoadingPromise) return scriptLoadingPromise;

  scriptLoadingPromise = new Promise((resolve) => {
    // Check if script element already exists
    const existing = document.querySelector('script[src*="recaptcha/api.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => resolve());
      // If already loaded
      if (window.grecaptcha) resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_V3_SITE_KEY}&hl=id`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      console.warn('Failed to load Google reCAPTCHA v3 script');
      resolve();
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
}

/**
 * Execute reCAPTCHA v3 and return the token
 * @param action 'login' | 'register'
 */
export async function executeRecaptchaV3(action: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    await loadRecaptchaV3Script();

    return new Promise((resolve) => {
      if (!window.grecaptcha) {
        console.warn('grecaptcha is not available');
        return resolve(null);
      }

      window.grecaptcha.ready(async () => {
        try {
          const token = await window.grecaptcha.execute(RECAPTCHA_V3_SITE_KEY, { action });
          resolve(token || null);
        } catch (err) {
          console.error('reCAPTCHA v3 execution failed:', err);
          resolve(null);
        }
      });
    });
  } catch (error) {
    console.error('reCAPTCHA v3 helper error:', error);
    return null;
  }
}
