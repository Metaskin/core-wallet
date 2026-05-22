const RING_SIZE = 200;
const _ring = [];

const REDACT_RULES = [
  [/Bearer\s+[\w\-=]+\.[\w\-=]+\.[\w\-_.+/=]*/gi, 'Bearer [redacted]'],
  [/eyJ[\w\-=]+\.[\w\-=]+\.[\w\-_.+/=]*/g, '[jwt-redacted]'],
  [/"(password|secret|token|key|authorization|privatekey)"\s*:\s*"[^"]*"/gi,
    (_, k) => `"${k}":"[redacted]"`],
];

function redact(v) {
  let s = typeof v === 'string' ? v
    : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();
  for (const [re, rep] of REDACT_RULES) s = s.replace(re, rep);
  return s;
}

function push(level, args) {
  const msg = args.map(a => redact(a)).join(' ');
  if (_ring.length >= RING_SIZE) _ring.shift();
  _ring.push({ t: Date.now(), level, msg });
}

const logger = {
  info:  (...a) => { if (import.meta.env.DEV) console.info('[MCT]',  ...a); push('info',  a); },
  warn:  (...a) => { if (import.meta.env.DEV) console.warn('[MCT]',  ...a); push('warn',  a); },
  error: (...a) => { if (import.meta.env.DEV) console.error('[MCT]', ...a); push('error', a); },
  debug: (...a) => { if (import.meta.env.DEV) console.debug('[MCT]', ...a); push('debug', a); },
  getEntries: (n = 100) => _ring.slice(-n).map(e => ({ ...e, ts: new Date(e.t).toISOString() })),
  clear: () => { _ring.length = 0; },
};

export default logger;
