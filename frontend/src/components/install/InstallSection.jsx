import { useState } from 'react';
import { useInstallDetection } from '../../hooks/useInstallDetection';
import { QRCodeDisplay } from './QRCodeDisplay';
import { InstallModal } from './InstallModal';

// ── Icons ─────────────────────────────────────────────────────────────────────

function AndroidIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.523 15.341A7 7 0 006.477 15.34M12 3l-1.5 2.6M12 3l1.5 2.6M7.5 5.6l1.5 2.6M16.5 5.6l-1.5 2.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <rect x="4" y="8" width="16" height="10" rx="2" fill="currentColor" opacity="0.9"/>
      <circle cx="8.5" cy="13" r="1" fill="white"/>
      <circle cx="15.5" cy="13" r="1" fill="white"/>
      <path d="M2 11h2M20 11h2M7 18v2M17 18v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

function DownloadIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

// ── Download button with loading state ───────────────────────────────────────

function APKDownloadButton({ version, loading, downloading, onClick }) {
  if (loading) return <Skeleton className="h-12 w-full" />;
  const unavailable = !version?.apk;
  return (
    <button
      onClick={onClick}
      disabled={downloading || unavailable}
      className={`w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-semibold text-sm transition-all
        ${unavailable
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : downloading
            ? 'bg-[#003087]/80 text-white cursor-wait'
            : 'bg-[#003087] hover:bg-[#002070] text-white shadow-sm hover:shadow-md active:scale-[0.98]'
        }`}
    >
      {downloading ? (
        <>
          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
            <path d="M21 12a9 9 0 00-9-9"/>
          </svg>
          Starting download…
        </>
      ) : (
        <>
          <DownloadIcon />
          {unavailable ? 'APK coming soon' : `Download MCTBank.apk`}
        </>
      )}
    </button>
  );
}

// ── Update badge ─────────────────────────────────────────────────────────────

function UpdateBadge({ version }) {
  return (
    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
      </svg>
      <div className="flex-1 min-w-0">
        <p className="text-amber-700 text-xs font-semibold">Update available — v{version?.version}</p>
        <p className="text-amber-600 text-[10px]">A newer version is ready to download</p>
      </div>
    </div>
  );
}

// ── iOS instructions ──────────────────────────────────────────────────────────

function IOSInstructions() {
  const steps = [
    { n: '1', text: 'Open mctbank.online in Safari' },
    { n: '2', text: 'Tap the Share button' },
    { n: '3', text: 'Scroll down and tap "Add to Home Screen"' },
    { n: '4', text: 'Tap "Add" in the top-right corner' },
  ];
  return (
    <div className="space-y-3">
      {steps.map(s => (
        <div key={s.n} className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#003087] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {s.n}
          </div>
          <p className="text-gray-600 text-sm">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────

export default function InstallSection() {
  const {
    platform, isPWA, canPWAInstall, triggerPWAInstall,
    latestVersion, versionLoading, hasUpdate, recordDownload,
  } = useInstallDetection();

  const [showModal,   setShowModal]   = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [pwaInstalling, setPwaInstalling] = useState(false);

  const apkUrl  = `${window.location.origin}/downloads/MTCBank.apk`;
  const apkInfo = latestVersion;

  function handleAPKDownload() {
    if (!apkInfo?.apk) return;
    setDownloading(true);
    recordDownload(apkInfo.build);

    const a = document.createElement('a');
    a.href = apkInfo.apk;
    a.download = 'MCTBank.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setDownloading(false);
      setShowModal(true);
    }, 900);
  }

  async function handlePWAInstall() {
    setPwaInstalling(true);
    await triggerPWAInstall();
    setPwaInstalling(false);
  }

  return (
    <section id="install" className="py-20 px-5 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-12">
          <p className="text-[#003087] font-semibold text-sm tracking-widest uppercase mb-3">Download &amp; Install</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight mb-4">
            Get the MCT Bank app
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Available as a native Android app or as an installable web app on any device.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">

          {/* ── Android / APK card ──────────────────────────────────────────── */}
          <div className="relative border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#003087]/5 to-transparent rounded-2xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#003087]/8 flex items-center justify-center text-[#003087]">
                <AndroidIcon size={28} />
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">Android App</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {versionLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : apkInfo ? (
                    <>
                      <span className="text-xs text-gray-400 font-mono">v{apkInfo.version}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{apkInfo.size}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">Android {apkInfo.minAndroid}+</span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400">Direct APK install</span>
                  )}
                </div>
              </div>
            </div>

            {/* Update banner */}
            {hasUpdate && <UpdateBadge version={apkInfo} />}

            {/* Platform-specific content */}
            {platform === 'android' ? (
              <div className="space-y-3">
                <APKDownloadButton
                  version={apkInfo}
                  loading={versionLoading}
                  downloading={downloading}
                  onClick={handleAPKDownload}
                />
                <p className="text-[11px] text-gray-400 text-center">
                  Tap to download · Free · No subscription required
                </p>
              </div>
            ) : (
              /* Desktop or iOS — show QR code */
              <div className="flex flex-col sm:flex-row gap-5 items-center">
                <div className="shrink-0">
                  <QRCodeDisplay url={apkUrl} size={140} />
                  <p className="text-[10px] text-gray-400 text-center mt-2">Scan on Android</p>
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <p className="text-gray-500 text-sm">
                    {platform === 'ios'
                      ? 'The Android app is for Android devices. See web app option below.'
                      : 'Scan the QR code with your Android phone camera to open the download page.'}
                  </p>
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Direct URL</p>
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                      <code className="flex-1 text-[11px] font-mono text-gray-500 truncate">{apkUrl}</code>
                      <button
                        onClick={() => navigator.clipboard?.writeText(apkUrl)}
                        className="text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-400 px-1.5 py-0.5 rounded transition-colors shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  {platform !== 'ios' && (
                    <APKDownloadButton
                      version={apkInfo}
                      loading={versionLoading}
                      downloading={downloading}
                      onClick={handleAPKDownload}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Changelog (collapsed) */}
            {apkInfo?.changelog && (
              <details className="mt-4">
                <summary className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer select-none transition-colors">
                  What's new in v{apkInfo.version}
                </summary>
                <ul className="mt-2 space-y-1 pl-3">
                  {apkInfo.changelog.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-500">
                      <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* ── iOS / PWA card ───────────────────────────────────────────────── */}
          <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
                {platform === 'ios' ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                ) : (
                  <GlobeIcon />
                )}
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-base">
                  {platform === 'ios' ? 'iOS / iPhone' : 'Web App'}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {platform === 'ios' ? 'Add to Home Screen' : 'Install on any device'}
                </p>
              </div>
              {isPWA && (
                <span className="ml-auto text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  Installed ✓
                </span>
              )}
            </div>

            {platform === 'ios' ? (
              <IOSInstructions />
            ) : canPWAInstall && !isPWA ? (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm leading-relaxed">
                  Install MCT Bank as a web app for a native-like experience with offline access and faster loading.
                </p>
                <button
                  onClick={handlePWAInstall}
                  disabled={pwaInstalling}
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm transition-all shadow-sm disabled:opacity-60"
                >
                  {pwaInstalling ? (
                    <>
                      <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/>
                        <path d="M21 12a9 9 0 00-9-9"/>
                      </svg>
                      Installing…
                    </>
                  ) : (
                    <>
                      <PhoneIcon />
                      Install Web App
                    </>
                  )}
                </button>
                <ul className="space-y-1.5">
                  {['Works offline', 'Instant loading', 'No app store required', 'Auto-updates silently'].map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ) : isPWA ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-gray-800 font-semibold">App is installed</p>
                <p className="text-gray-400 text-sm mt-1">MCT Bank is already on your home screen</p>
              </div>
            ) : (
              /* Desktop without PWA prompt — show usage info */
              <div className="space-y-4">
                <p className="text-gray-500 text-sm leading-relaxed">
                  Open mctbank.online in Chrome or Edge on your phone to install the web app, or scan the QR code to the left to download the Android APK.
                </p>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-600">Features of the web app:</p>
                  {['Runs on iOS, Android & Desktop', 'Works offline (core features)', 'Push notifications', 'No storage needed'].map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-gray-400 mt-8 max-w-lg mx-auto leading-relaxed">
          <svg className="inline-block mr-1 mb-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          The MCTBank.apk is signed with our production certificate and served directly from mctbank.online.
          Always download from this site only.
        </p>

      </div>

      {showModal && <InstallModal onClose={() => setShowModal(false)} />}
    </section>
  );
}
