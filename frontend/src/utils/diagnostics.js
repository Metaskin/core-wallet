const RENDER_ROOT = 'https://core-wallet.onrender.com';
export const API_BASE = import.meta.env.VITE_API_URL || `${RENDER_ROOT}/api`;

function withTimeout(fn, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fn(ctrl.signal).finally(() => clearTimeout(timer));
}

// ── Backend health ─────────────────────────────────────────────────────────────

export async function checkBackendHealth() {
  try {
    const t0 = performance.now();
    const res = await withTimeout(s => fetch(`${RENDER_ROOT}/health`, { signal: s }));
    const latency = Math.round(performance.now() - t0);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, latency, data };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Timeout (7s)' : err.message };
  }
}

export async function checkFullHealth() {
  try {
    const t0 = performance.now();
    const res = await withTimeout(s => fetch(`${RENDER_ROOT}/health/full`, { signal: s }), 12000);
    const latency = Math.round(performance.now() - t0);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, latency, data };
  } catch (err) {
    return { ok: false, error: err.name === 'AbortError' ? 'Timeout (12s)' : err.message };
  }
}

export async function checkDomainConnectivity() {
  const origin = window.location.origin;
  if (origin.includes('mctbank.online')) {
    return { ok: true, message: 'You are on mctbank.online — DNS resolved successfully', origin };
  }
  try {
    const t0 = performance.now();
    await withTimeout(s => fetch('https://mctbank.online/', { signal: s, mode: 'no-cors' }), 5000);
    return { ok: true, latency: Math.round(performance.now() - t0), message: 'mctbank.online reachable' };
  } catch (err) {
    return {
      ok: false,
      error: err.name === 'AbortError' ? 'Timeout reaching mctbank.online' : err.message,
      likely: !navigator.onLine ? 'Device is offline' : 'DNS failure or domain unreachable',
    };
  }
}

// ── Service Worker ─────────────────────────────────────────────────────────────

export async function checkServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, error: 'Service Worker not supported' };
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) return { supported: true, registered: false };

    const sw = reg.active || reg.waiting || reg.installing;
    const state = sw?.state || 'none';
    const hasWaiting = !!reg.waiting;

    let versionInfo = null;
    if (reg.active) {
      versionInfo = await new Promise(resolve => {
        const ch = new MessageChannel();
        const timer = setTimeout(() => resolve(null), 2000);
        ch.port1.onmessage = (e) => { clearTimeout(timer); resolve(e.data); };
        reg.active.postMessage({ type: 'GET_VERSION' }, [ch.port2]);
      });
    }

    return {
      supported: true,
      registered: true,
      state,
      hasWaiting,
      scope: reg.scope,
      scriptURL: reg.active?.scriptURL || null,
      version: versionInfo?.version || null,
      cacheName: versionInfo?.cacheName || null,
    };
  } catch (err) {
    return { supported: true, registered: false, error: err.message };
  }
}

// ── Cache Storage ──────────────────────────────────────────────────────────────

export async function checkCaches() {
  if (!('caches' in window)) return { supported: false };
  try {
    const keys = await caches.keys();
    const entries = await Promise.all(
      keys.map(async name => {
        const cache = await caches.open(name);
        const reqs = await cache.keys();
        return { name, count: reqs.length, urls: reqs.slice(0, 30).map(r => r.url) };
      })
    );
    return { supported: true, caches: entries, total: entries.reduce((s, c) => s + c.count, 0) };
  } catch (err) {
    return { supported: true, error: err.message };
  }
}

// ── Auth & Environment (sync) ──────────────────────────────────────────────────

export function checkAuthState() {
  const token = localStorage.getItem('cw_token') || sessionStorage.getItem('cw_token');
  if (!token) return { loggedIn: false, tokenPresent: false };
  try {
    const [, b64] = token.split('.');
    const payload = JSON.parse(atob(b64.replace(/-/g, '+').replace(/_/g, '/')));
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : null;
    return {
      loggedIn: true,
      tokenPresent: true,
      userId: payload.id || payload.sub || null,
      role: payload.role || null,
      expiresAt: expiresAt?.toISOString() || null,
      isExpired: expiresAt ? expiresAt < new Date() : null,
      storage: localStorage.getItem('cw_token') ? 'localStorage' : 'sessionStorage',
    };
  } catch {
    return { loggedIn: true, tokenPresent: true, decodeError: 'Cannot parse token payload' };
  }
}

export function checkEnvironment() {
  return {
    apiUrl: import.meta.env.VITE_API_URL || '(not set — falls back to Render direct)',
    mode: import.meta.env.MODE,
    isProd: import.meta.env.PROD,
    online: navigator.onLine,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    swSupported: 'serviceWorker' in navigator,
    cacheSupported: 'caches' in window,
    notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
    origin: window.location.origin,
    pathname: window.location.pathname,
    buildTime: import.meta.env.VITE_BUILD_TIME || null,
  };
}

// ── Recovery Actions ───────────────────────────────────────────────────────────

export async function clearAllCaches() {
  if (!('caches' in window)) return { ok: false, error: 'CacheStorage not supported' };
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    return { ok: true, cleared: keys };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) return { ok: false, error: 'SW not supported' };
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map(r => r.unregister()));
    return { ok: true, count: regs.length };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function forceSWUpdate() {
  if (!('serviceWorker' in navigator)) return { ok: false, error: 'SW not supported' };
  try {
    const reg = await navigator.serviceWorker.getRegistration('/');
    if (!reg) return { ok: false, error: 'No SW registered' };
    await reg.update();
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      return { ok: true, message: 'SW update queued — reload to activate' };
    }
    return { ok: true, message: 'SW is up to date' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function clearAppStorage() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function fullReset() {
  await clearAllCaches();
  await unregisterServiceWorkers();
  clearAppStorage();
  window.location.replace('/');
}
