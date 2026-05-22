import { useState, useEffect, useCallback } from 'react';
import * as D from '../utils/diagnostics';
import logger from '../utils/logger';

// ── Status helpers ─────────────────────────────────────────────────────────────

function Dot({ ok, warn }) {
  const color = ok === null ? 'bg-gray-500' : ok ? 'bg-emerald-400' : warn ? 'bg-yellow-400' : 'bg-red-400';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${color}`} />;
}

function StatusCard({ label, ok, warn, detail, sub }) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 flex items-start gap-2.5">
      <Dot ok={ok} warn={warn} />
      <div className="min-w-0">
        <p className="text-gray-200 text-xs font-semibold">{label}</p>
        {detail && <p className={`text-xs mt-0.5 truncate ${ok ? 'text-emerald-400' : warn ? 'text-yellow-400' : 'text-red-400'}`}>{detail}</p>}
        {sub && <p className="text-gray-500 text-[10px] mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800 hover:bg-gray-750 text-left"
      >
        <span className="text-gray-300 text-xs font-semibold uppercase tracking-wider">{title}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.5"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="p-4 bg-gray-900 text-xs text-gray-300 space-y-1.5">{children}</div>}
    </div>
  );
}

function KV({ k, v, mono, highlight }) {
  const valClass = highlight
    ? highlight === 'ok' ? 'text-emerald-400' : highlight === 'warn' ? 'text-yellow-400' : 'text-red-400'
    : 'text-gray-300';
  return (
    <div className="flex gap-2 items-start">
      <span className="text-gray-500 shrink-0 w-40">{k}</span>
      <span className={`${valClass} ${mono ? 'font-mono' : ''} break-all`}>{String(v)}</span>
    </div>
  );
}

function ActionBtn({ label, variant = 'default', onClick, result }) {
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState(null);

  async function handle() {
    setLoading(true);
    setRes(null);
    try {
      const r = await onClick();
      setRes(r);
    } catch (e) {
      setRes({ ok: false, error: e.message });
    }
    setLoading(false);
  }

  const base = 'px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50';
  const styles = {
    default:   'bg-gray-700 hover:bg-gray-600 text-gray-200',
    danger:    'bg-red-900/60 hover:bg-red-800 text-red-300 border border-red-700',
    primary:   'bg-blue-800 hover:bg-blue-700 text-blue-100',
  };

  return (
    <div className="flex flex-col gap-1">
      <button onClick={handle} disabled={loading} className={`${base} ${styles[variant]}`}>
        {loading ? '…' : label}
      </button>
      {res && (
        <span className={`text-[10px] ${res.ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {res.ok ? (res.message || res.cleared?.join(', ') || 'Done') : (res.error || 'Failed')}
        </span>
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────

export default function DebugPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logEntries, setLogEntries] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [backend, full, sw, caches] = await Promise.all([
      D.checkBackendHealth(),
      D.checkFullHealth(),
      D.checkServiceWorker(),
      D.checkCaches(),
    ]);
    const auth = D.checkAuthState();
    const env  = D.checkEnvironment();
    setData({ backend, full, sw, caches, auth, env, checkedAt: new Date().toISOString() });
    setLogEntries(logger.getEntries(80));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const db = data?.full?.data?.database;
  const mem = data?.full?.data?.memory;
  const envVars = data?.full?.data?.env || {};

  function statusItems() {
    if (!data) return [];
    const { backend, full, sw, auth, env } = data;
    return [
      {
        label: 'Backend API',
        ok: backend?.ok,
        detail: backend?.ok ? `${backend.latency}ms` : backend?.error || 'Unreachable',
        sub: D.API_BASE,
      },
      {
        label: 'Database',
        ok: db?.ok ?? null,
        detail: db ? (db.ok ? `Connected (${db.latency}ms)` : 'Connection failed') : full?.ok ? 'Query failed' : 'Backend down',
      },
      {
        label: 'Service Worker',
        ok: sw?.registered && sw?.state === 'activated',
        warn: sw?.registered && sw?.state !== 'activated',
        detail: sw?.registered ? `${sw.state}${sw.hasWaiting ? ' (update waiting)' : ''}` : (sw?.error || 'Not registered'),
        sub: sw?.version ? `v${sw.version} · ${sw.cacheName}` : null,
      },
      {
        label: 'Network',
        ok: env?.online,
        detail: env?.online ? 'Online' : 'Offline',
        sub: env?.origin,
      },
      {
        label: 'Auth / Session',
        ok: auth?.loggedIn && !auth?.isExpired,
        warn: auth?.loggedIn && auth?.isExpired,
        detail: !auth?.loggedIn ? 'Not logged in' : auth?.isExpired ? 'Token expired' : `${auth.role || 'user'} · valid`,
        sub: auth?.expiresAt ? `Expires: ${new Date(auth.expiresAt).toLocaleString()}` : null,
      },
      {
        label: 'Caches',
        ok: (data?.caches?.total ?? 0) > 0,
        warn: (data?.caches?.total ?? 0) === 0,
        detail: data?.caches?.caches?.map(c => `${c.name} (${c.count})`).join(', ') || 'Empty',
      },
    ];
  }

  const levelColor = { info: 'text-blue-400', warn: 'text-yellow-400', error: 'text-red-400', debug: 'text-gray-500' };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 font-mono text-xs">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-200 font-semibold text-sm">MCT Bank — Debug Console</span>
          {loading && <span className="text-yellow-400 text-[10px]">Checking…</span>}
          {data && !loading && (
            <span className="text-gray-600 text-[10px]">
              {new Date(data.checkedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs disabled:opacity-50 transition-colors"
          >
            {loading ? 'Checking…' : 'Refresh'}
          </button>
          <a href="/" className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors">
            ← Back
          </a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">

        {/* Status grid */}
        <div>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-2">System Status</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {data
              ? statusItems().map(item => <StatusCard key={item.label} {...item} />)
              : Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3 h-14 animate-pulse" />
                ))
            }
          </div>
        </div>

        {/* DNS / Domain explanation */}
        <Section title="DNS &amp; Domain — Why Android works but web fails">
          <div className="space-y-2 text-gray-400 leading-relaxed">
            <p className="text-yellow-300 font-semibold">Root cause: DNS_PROBE_FINISHED_NXDOMAIN</p>
            <p>
              <span className="text-emerald-400">Android APK works</span> because the app binary has
              {' '}<span className="text-gray-200 font-mono bg-gray-800 px-1">https://core-wallet.onrender.com/api</span>{' '}
              baked in at build time. The Capacitor WebView calls Render directly — it never needs
              to resolve <span className="font-mono text-gray-200">mctbank.online</span>.
            </p>
            <p>
              <span className="text-red-400">Web browser fails</span> because the browser must resolve
              the DNS for <span className="font-mono text-gray-200">mctbank.online</span> to reach the
              Vercel CDN. NXDOMAIN means that lookup returns "no such domain" — this happens
              before any HTTP request is made, so the Service Worker never activates.
            </p>
            <p className="text-gray-300 font-semibold">Checklist to fix:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-400 pl-2">
              <li>Log into your domain registrar — verify domain has not expired</li>
              <li>Log into Vercel dashboard → Settings → Domains → re-add mctbank.online</li>
              <li>Add CNAME: <span className="font-mono text-gray-200">mctbank.online → cname.vercel-dns.com</span></li>
              <li>Or add A records per Vercel's domain instructions</li>
              <li>Wait for DNS propagation (usually &lt;1h, up to 48h)</li>
              <li>Verify: <span className="font-mono text-gray-200">nslookup mctbank.online</span> should return Vercel IPs</li>
            </ol>
            <p className="text-gray-500">
              The Service Worker only protects against network failures and server errors — it
              cannot intercept a navigation that fails at DNS level on a cold load.
            </p>
          </div>
        </Section>

        {/* Service Worker */}
        <Section title="Service Worker" defaultOpen>
          {data?.sw ? (
            <>
              <KV k="Supported"    v={String(data.sw.supported)} />
              <KV k="Registered"   v={String(data.sw.registered)} highlight={data.sw.registered ? 'ok' : 'error'} />
              {data.sw.registered && <>
                <KV k="State"      v={data.sw.state} highlight={data.sw.state === 'activated' ? 'ok' : 'warn'} />
                <KV k="Version"    v={data.sw.version || 'unknown'} mono />
                <KV k="Cache Name" v={data.sw.cacheName || 'unknown'} mono />
                <KV k="Scope"      v={data.sw.scope || '—'} mono />
                <KV k="Script"     v={data.sw.scriptURL || '—'} mono />
                {data.sw.hasWaiting && (
                  <p className="text-yellow-400 mt-1">A new SW version is waiting — use Force Update below.</p>
                )}
                {data.sw.error && <KV k="Error" v={data.sw.error} highlight="error" />}
              </>}
            </>
          ) : <p className="text-gray-500">Loading…</p>}
        </Section>

        {/* Cache contents */}
        <Section title="Cache Storage">
          {data?.caches ? (
            data.caches.supported ? (
              data.caches.caches?.length > 0 ? (
                data.caches.caches.map(c => (
                  <div key={c.name} className="mb-3">
                    <p className="text-emerald-400 font-semibold">{c.name} ({c.count} entries)</p>
                    <div className="mt-1 space-y-0.5 pl-2">
                      {c.urls.map((url, i) => (
                        <p key={i} className="text-gray-500 break-all">{url}</p>
                      ))}
                      {c.count > 30 && <p className="text-gray-600">…and {c.count - 30} more</p>}
                    </div>
                  </div>
                ))
              ) : <p className="text-gray-500">No caches found</p>
            ) : <p className="text-red-400">CacheStorage not supported</p>
          ) : <p className="text-gray-500">Loading…</p>}
        </Section>

        {/* Auth state */}
        <Section title="Auth &amp; Session">
          {data?.auth ? (
            <>
              <KV k="Logged In"    v={String(data.auth.loggedIn)} highlight={data.auth.loggedIn ? 'ok' : 'warn'} />
              <KV k="Token Present" v={String(data.auth.tokenPresent)} />
              {data.auth.loggedIn && <>
                <KV k="User ID"   v={data.auth.userId || '—'} mono />
                <KV k="Role"      v={data.auth.role || '—'} />
                <KV k="Storage"   v={data.auth.storage || '—'} />
                <KV k="Expires"   v={data.auth.expiresAt || '—'} mono />
                <KV k="Expired"   v={String(data.auth.isExpired)} highlight={data.auth.isExpired ? 'error' : 'ok'} />
                {data.auth.decodeError && <KV k="Decode Error" v={data.auth.decodeError} highlight="warn" />}
              </>}
            </>
          ) : <p className="text-gray-500">Loading…</p>}
        </Section>

        {/* Environment */}
        <Section title="Environment &amp; Build">
          {data?.env ? (
            <>
              <KV k="API URL (VITE_API_URL)" v={data.env.apiUrl} mono />
              <KV k="Build Mode"   v={data.env.mode} />
              <KV k="Production"   v={String(data.env.isProd)} />
              <KV k="Online"       v={String(data.env.online)} highlight={data.env.online ? 'ok' : 'error'} />
              <KV k="Origin"       v={data.env.origin} mono />
              <KV k="SW Supported" v={String(data.env.swSupported)} />
              <KV k="Cache API"    v={String(data.env.cacheSupported)} />
              <KV k="Notifications" v={data.env.notificationPermission} />
              <KV k="Language"     v={data.env.language} />
              <KV k="Platform"     v={data.env.platform} />
              <KV k="Build Time"   v={data.env.buildTime || '(not set)'} mono />
              <p className="text-gray-600 mt-2 break-all">UA: {data.env.userAgent}</p>
            </>
          ) : <p className="text-gray-500">Loading…</p>}
        </Section>

        {/* Backend full health */}
        <Section title="Backend Details (Render)">
          {data?.full ? (
            data.full.ok ? (
              <>
                <KV k="Latency"    v={`${data.full.latency}ms`} />
                <KV k="Status"     v={data.full.data?.status || '—'} highlight={data.full.data?.status === 'ok' ? 'ok' : 'warn'} />
                <KV k="Version"    v={data.full.data?.version || '—'} mono />
                <KV k="Uptime"     v={data.full.data?.uptime ? `${Math.round(data.full.data.uptime)}s` : '—'} />
                <KV k="Node.js"    v={data.full.data?.node || '—'} mono />
                <KV k="Env"        v={data.full.data?.env_name || '—'} />
                {mem && <>
                  <KV k="Heap Used"  v={`${Math.round(mem.heapUsed / 1e6)}MB / ${Math.round(mem.heapTotal / 1e6)}MB`} />
                  <KV k="RSS"        v={`${Math.round(mem.rss / 1e6)}MB`} />
                </>}
                {db && <>
                  <KV k="DB Connected" v={String(db.ok)} highlight={db.ok ? 'ok' : 'error'} />
                  {db.latency != null && <KV k="DB Latency" v={`${db.latency}ms`} />}
                  {db.error && <KV k="DB Error" v={db.error} highlight="error" />}
                </>}
                {Object.keys(envVars).length > 0 && (
                  <div className="mt-2">
                    <p className="text-gray-500 mb-1">Env Vars (presence only — values hidden):</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                      {Object.entries(envVars).map(([k, v]) => (
                        <div key={k} className="flex items-center gap-1.5">
                          <Dot ok={v} />
                          <span className="text-gray-400 font-mono text-[10px]">{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <KV k="Error" v={data.full.error || 'Backend /health/full unreachable'} highlight="error" />
            )
          ) : <p className="text-gray-500">Loading…</p>}
        </Section>

        {/* Console log */}
        <Section title={`Console Log (${logEntries.length} entries)`}>
          {logEntries.length === 0 ? (
            <p className="text-gray-600">
              No entries yet. Import and use <span className="font-mono text-gray-400">logger</span> from
              {' '}<span className="font-mono text-gray-400">utils/logger.js</span> in your modules to capture logs here.
            </p>
          ) : (
            <div className="space-y-0.5 max-h-64 overflow-y-auto">
              {logEntries.slice().reverse().map((e, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-gray-600 shrink-0 w-20">{e.ts.slice(11, 23)}</span>
                  <span className={`shrink-0 w-10 ${levelColor[e.level] || 'text-gray-400'}`}>{e.level}</span>
                  <span className="text-gray-400 break-all">{e.msg}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* Recovery actions */}
        <Section title="Recovery Actions" defaultOpen>
          <p className="text-gray-500 mb-3">
            Use these when the app is behaving strangely, showing stale content, or after a deployment.
            Destructive actions are highlighted in red.
          </p>
          <div className="flex flex-wrap gap-2">
            <ActionBtn
              label="Force SW Update"
              variant="primary"
              onClick={D.forceSWUpdate}
            />
            <ActionBtn
              label="Clear All Caches"
              variant="danger"
              onClick={D.clearAllCaches}
            />
            <ActionBtn
              label="Unregister Service Worker"
              variant="danger"
              onClick={D.unregisterServiceWorkers}
            />
            <ActionBtn
              label="Force Hard Reload"
              variant="default"
              onClick={() => { window.location.reload(true); return Promise.resolve({ ok: true }); }}
            />
            <ActionBtn
              label="Clear App Storage (logout)"
              variant="danger"
              onClick={() => Promise.resolve(D.clearAppStorage())}
            />
            <ActionBtn
              label="FULL RESET (clear all + reload)"
              variant="danger"
              onClick={async () => {
                await D.clearAllCaches();
                await D.unregisterServiceWorkers();
                D.clearAppStorage();
                setTimeout(() => window.location.replace('/'), 500);
                return { ok: true, message: 'Resetting in 500ms…' };
              }}
            />
          </div>
          <div className="mt-4 pt-3 border-t border-gray-700 space-y-1 text-gray-500">
            <p>Commands to run in browser DevTools (F12 → Console):</p>
            <pre className="text-[10px] text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto mt-1 leading-5">{`// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));

// Clear all caches
caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))));

// Clear storage
localStorage.clear(); sessionStorage.clear();

// Hard reload (bypass cache)
location.reload(true);`}</pre>
          </div>
        </Section>

        <p className="text-center text-gray-700 text-[10px] pb-4">
          MCT Bank Debug Console · Access via <span className="font-mono">/debug</span> or <span className="font-mono">Ctrl+Shift+D</span>
        </p>
      </div>
    </div>
  );
}
