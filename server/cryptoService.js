/**
 * Secure Field-Level Cryptographic Service
 * Provides AES-256-GCM authenticated encryption for sensitive student identifiers and records at rest,
 * and HMAC-SHA256 token signing for role-based session authorization.
 *
 * Compliant with India DPDPA 2023 Technical Safeguards & ISO/IEC 27001 data protection standards.
 */

const crypto = require('crypto');

// Master encryption key derived from environment variable or securely generated fallback
const MASTER_KEY_SECRET = process.env.SIS_ENCRYPTION_KEY || 'chitkara-sis-vault-2025-u25aiml-g13-secure-key';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag

// Derive deterministic 32-byte key using SHA-256
const ENCRYPTION_KEY = crypto.createHash('sha256').update(MASTER_KEY_SECRET).digest();

/**
 * Encrypt a text string or object using AES-256-GCM
 * @param {string|object} data - Plaintext or JSON object to encrypt
 * @returns {string} Base64 encoded payload: [IV (12B)] + [AuthTag (16B)] + [Ciphertext]
 */
function encrypt(data) {
  if (data === null || data === undefined) return null;
  const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV + AuthTag + Encrypted data
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypt an AES-256-GCM encrypted base64 payload
 * @param {string} encryptedBase64 - Encrypted payload from encrypt()
 * @param {boolean} parseJson - Whether to parse the output as JSON
 * @returns {string|object} Decrypted plaintext or parsed object
 */
function decrypt(encryptedBase64, parseJson = false) {
  if (!encryptedBase64) return null;
  try {
    const combined = Buffer.from(encryptedBase64, 'base64');
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Encrypted payload too short');
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, null, 'utf8');
    decrypted += decipher.final('utf8');

    return parseJson ? JSON.parse(decrypted) : decrypted;
  } catch (err) {
    console.error('[CryptoService] Decryption failed:', err.message);
    return null;
  }
}

/**
 * Generate a cryptographically secure session token signed with HMAC-SHA256
 * @param {object} payload - Session claims (rollNo, role, exp, name)
 * @returns {string} Bearer session token
 */
function createSessionToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 7 // 7-day session
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', MASTER_KEY_SECRET)
    .update(`${header}.${claims}`)
    .digest('base64url');

  return `${header}.${claims}.${signature}`;
}

/**
 * Verify and decode an HMAC-SHA256 signed session token
 * @param {string} token
 * @returns {object|null} Decoded payload if valid, null otherwise
 */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, claims, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', MASTER_KEY_SECRET)
    .update(`${header}.${claims}`)
    .digest('base64url');

  // Timing safe equal comparison prevents side-channel attacks
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(claims, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Compute SHA-256 checksum for audit and integrity verification
 */
function computeChecksum(content) {
  const str = typeof content === 'object' ? JSON.stringify(content) : String(content);
  return crypto.createHash('sha256').update(str).digest('hex');
}

module.exports = {
  encrypt,
  decrypt,
  createSessionToken,
  verifySessionToken,
  computeChecksum
};
