/**
 * AES-256-GCM encryption for sensitive card fields (card_number, cvv).
 *
 * Storage format: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 * All three segments are hex-encoded. A colon (:) inside any segment is
 * impossible (hex only uses 0-9, a-f), so splitting on ':' is unambiguous.
 *
 * Legacy plaintext rows (no ':' in the value) pass through decrypt() unchanged
 * — this ensures backward compatibility with any rows written before encryption
 * was introduced.
 *
 * KEY SETUP (generate once, store in .env):
 *   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 * Then set: CARD_ENCRYPTION_KEY=<64-char-hex-output>
 */

const crypto    = require('crypto');
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES  = 12; // 96-bit IV — NIST recommended for GCM

const getKey = () => {
  const hex = process.env.CARD_ENCRYPTION_KEY;
  if (hex && hex.length === 64) return Buffer.from(hex, 'hex');
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'CARD_ENCRYPTION_KEY is required in production. ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  // Dev-only deterministic fallback — never reaches production due to guard above
  console.warn('[Security] CARD_ENCRYPTION_KEY not set — using dev-only fallback key. Set it in .env');
  return Buffer.alloc(32, 0x5c);
};

const encrypt = (plaintext) => {
  if (plaintext === null || plaintext === undefined) return null;
  const key    = getKey();
  const iv     = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc    = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
};

/**
 * Decrypts a value produced by encrypt().
 * Returns null if decryption fails (wrong key, tampered data).
 * Returns the input unchanged if it doesn't look like an encrypted value
 * (legacy plaintext backward compatibility).
 */
const decrypt = (value) => {
  if (!value) return null;
  const str   = String(value);
  const parts = str.split(':');
  if (parts.length !== 3) return str; // legacy plaintext — pass through
  const [ivHex, tagHex, encHex] = parts;
  try {
    const key      = getKey();
    const iv       = Buffer.from(ivHex,  'hex');
    const tag      = Buffer.from(tagHex, 'hex');
    const enc      = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(enc) + decipher.final('utf8');
  } catch {
    return null; // tampered or wrong key — surface as missing data, not garbage
  }
};

module.exports = { encrypt, decrypt };
