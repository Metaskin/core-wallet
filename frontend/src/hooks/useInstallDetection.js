import { useState, useEffect, useCallback } from 'react';

const APK_BUILD_KEY = 'mct_apk_last_build';

function detectPlatform() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  // iPad on iOS 13+ reports as MacIntel with touch points
  if (/iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
  return 'desktop';
}

export function useInstallDetection() {
  const [platform]       = useState(() => detectPlatform());
  const [isPWA]          = useState(() =>
    window.matchMedia('(display-mode: standalone)').matches ||
    navigator.standalone === true
  );
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canPWAInstall,  setCanPWAInstall]  = useState(false);
  const [latestVersion,  setLatestVersion]  = useState(null);
  const [versionLoading, setVersionLoading] = useState(true);
  const [hasUpdate,      setHasUpdate]      = useState(false);

  // Capture browser PWA install prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanPWAInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Fetch version.json on mount — cache-busted so we always get fresh data
  useEffect(() => {
    fetch(`/downloads/version.json?_=${Date.now()}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        setLatestVersion(data);
        if (data) {
          const lastBuild = parseInt(localStorage.getItem(APK_BUILD_KEY) || '0', 10);
          // Only show "update available" if user has previously downloaded an older build
          setHasUpdate(lastBuild > 0 && data.build > lastBuild);
        }
      })
      .catch(() => setLatestVersion(null))
      .finally(() => setVersionLoading(false));
  }, []);

  const triggerPWAInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanPWAInstall(false);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  const recordDownload = useCallback((build) => {
    if (build != null) localStorage.setItem(APK_BUILD_KEY, String(build));
    setHasUpdate(false);
  }, []);

  return {
    platform,        // 'android' | 'ios' | 'desktop'
    isPWA,           // currently running as installed PWA
    canPWAInstall,   // browser has a pending install prompt
    triggerPWAInstall,
    latestVersion,   // parsed version.json object or null
    versionLoading,
    hasUpdate,
    recordDownload,
  };
}
