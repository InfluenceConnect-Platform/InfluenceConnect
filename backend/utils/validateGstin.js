// Validates an Indian GSTIN (Goods & Services Tax Identification Number).
//
// Format (15 chars): 22 AAAAA0000A 1 Z 5
//   • 2 digits   — state code
//   • 5 letters  — PAN holder's first five (entity) characters
//   • 4 digits   — PAN sequence
//   • 1 letter   — PAN check letter
//   • 1 alnum    — registration count for the PAN in the state
//   • 'Z'        — fixed by design
//   • 1 alnum    — checksum character
//
// We validate the structure (not the checksum digit) which is enough to reject
// typos and obviously-bogus values before a human reviews them.
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

// Normalise to the canonical form admins/brands expect: trimmed, no spaces,
// upper-cased. Returns '' for empty input.
function normalizeGstin(value) {
  return String(value || '').replace(/\s+/g, '').toUpperCase();
}

function isValidGstin(value) {
  return GSTIN_REGEX.test(normalizeGstin(value));
}

module.exports = { isValidGstin, normalizeGstin, GSTIN_REGEX };
