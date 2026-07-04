const crypto = require('crypto');

// AES-256-GCM field-level encryption for payout details (bank account number,
// IFSC, UPI ID) — the first at-rest-encrypted field in this codebase, since
// these are the specific values the chat moderation regex blocks from being
// shared any other way. Key is a 32-byte value, hex or base64, from env.
const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const raw = process.env.PAYOUT_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('PAYOUT_ENCRYPTION_KEY is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  const key = Buffer.from(raw, raw.length === 64 ? 'hex' : 'base64');
  if (key.length !== 32) {
    throw new Error('PAYOUT_ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }
  return key;
}

// Returns "iv:authTag:ciphertext", all hex-encoded, as a single string field.
function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined || plaintext === '') return '';
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

function decrypt(payload) {
  if (!payload) return '';
  const [ivHex, tagHex, dataHex] = payload.split(':');
  if (!ivHex || !tagHex || !dataHex) return '';
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]);
  return plaintext.toString('utf8');
}

module.exports = { encrypt, decrypt };
