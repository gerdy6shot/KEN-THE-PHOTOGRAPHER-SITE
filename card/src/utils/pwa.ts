// ==========================================================================
// KENNY HARRIS DIGITAL CARD — PWA UTILITIES & LIFECYCLE
// Handles install prompt capture, standalone detection, platform sensing,
// offline status, and service worker registration.
// ==========================================================================

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export interface PlatformInfo {
  isIOS: boolean;
  isIOSSafari: boolean;
  isAndroid: boolean;
  isChromium: boolean;
  isMobile: boolean;
}

export function detectPlatform(): PlatformInfo {
  if (typeof navigator === 'undefined') {
    return { isIOS: false, isIOSSafari: false, isAndroid: false, isChromium: false, isMobile: false };
  }
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream;
  const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isChromium = /Chrome|Chromium|Edg|CriOS/.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);

  return { isIOS, isIOSSafari, isAndroid, isChromium, isMobile };
}

export function getServiceWorkerConfig(): { scriptUrl: string; scope: string } {
  if (typeof window === 'undefined') {
    return { scriptUrl: '/card/sw.js', scope: '/card/' };
  }
  const pathname = window.location.pathname;
  if (pathname.startsWith('/card')) {
    return { scriptUrl: '/card/sw.js', scope: '/card/' };
  }
  return { scriptUrl: './sw.js', scope: './' };
}

export function registerServiceWorker(onUpdate?: () => void): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const config = getServiceWorkerConfig();
    navigator.serviceWorker
      .register(config.scriptUrl, { scope: config.scope })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                if (onUpdate) onUpdate();
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration error:', err);
      });
  });
}
