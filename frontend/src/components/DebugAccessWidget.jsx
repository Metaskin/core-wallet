import { useState } from 'react';

function CopyBtn({ url, label = 'Copy' }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(url)
      .then(() => { setDone(true); setTimeout(() => setDone(false), 1800); })
      .catch(() => {
        // Clipboard API blocked (e.g. HTTP) — select + execCommand fallback
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setDone(true);
        setTimeout(() => setDone(false), 1800);
      });
  }
  return (
    <button
      onClick={copy}
      className="shrink-0 text-[10px] px-1.5 py-0.5 rounded border border-gray-200 hover:border-gray-400
                 text-gray-400 hover:text-gray-700 transition-colors font-medium"
    >
      {done ? '✓ Copied' : label}
    </button>
  );
}

function UrlRow({ label, url, primary }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <div className={`flex items-center gap-2 bg-white rounded-lg px-3 py-2 border ${primary ? 'border-blue-200' : 'border-gray-200'}`}>
        <code className={`flex-1 text-xs font-mono truncate ${primary ? 'text-blue-600' : 'text-gray-500'}`}>
          {url}
        </code>
        <CopyBtn url={url} />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`shrink-0 text-[10px] px-2 py-1 rounded font-medium transition-colors ${
            primary
              ? 'bg-[#003087] text-white hover:bg-[#002070]'
              : 'border border-gray-200 text-gray-400 hover:text-gray-600 hover:border-gray-400'
          }`}
        >
          Open ↗
        </a>
      </div>
    </div>
  );
}

export default function DebugAccessWidget() {
  const origin       = window.location.origin;
  const currentDebug = `${origin}/debug`;
  const canonicalUrl = 'https://mctbank.online/debug';
  const renderHealth = 'https://core-wallet.onrender.com/health';
  const renderFull   = 'https://core-wallet.onrender.com/health/full';

  const isOnCanonical = origin === 'https://mctbank.online';
  const isOnVercel    = origin.includes('vercel.app');
  const isLocal       = origin.includes('localhost') || origin.includes('127.0.0.1');

  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span className="text-xs font-semibold text-gray-700">Debug Console</span>
        </span>
        <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
          No auth required
        </span>
        <span className="text-[10px] text-gray-400 ml-auto font-mono">Ctrl+Shift+D</span>
      </div>

      {/* Always show the URL for the current origin first */}
      <UrlRow
        label={isLocal ? 'Local URL' : isOnVercel ? 'Vercel Deployment URL' : 'Current URL'}
        url={currentDebug}
        primary
      />

      {/* Canonical URL (only if we're not already on it) */}
      {!isOnCanonical && (
        <UrlRow label="Canonical URL (mctbank.online)" url={canonicalUrl} />
      )}

      {/* Fallback URLs when domain is unreachable */}
      <details className="mt-1 mb-3">
        <summary className="text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer select-none transition-colors">
          ▸ DNS broken? Direct backend URLs
        </summary>
        <div className="mt-2 space-y-2">
          <UrlRow label="Backend health (direct Render)" url={renderHealth} />
          <UrlRow label="Backend full diagnostics"       url={renderFull}   />
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-[10px] text-amber-700 leading-relaxed">
            <strong>If mctbank.online returns NXDOMAIN:</strong> open your Vercel dashboard →
            find this project → copy the <code className="bg-amber-100 px-0.5 rounded">.vercel.app</code> deployment URL →
            append <code className="bg-amber-100 px-0.5 rounded">/debug</code>.
            The Vercel URL always works even when the custom domain's DNS is broken.
          </div>
        </div>
      </details>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        {isOnCanonical
          ? 'You are on the canonical domain. DNS is resolving correctly.'
          : isOnVercel
            ? 'You are on a Vercel deployment URL. The debug page is live at this address.'
            : isLocal
              ? 'Running locally. All debug features are available.'
              : `You are on ${origin}. Canonical domain: mctbank.online.`}
      </p>
    </div>
  );
}
