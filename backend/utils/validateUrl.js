// ─────────────────────────────────────────
// URL validation for user-supplied links.
//
// Media endpoints (profile picture, brand logo, cover photo, portfolio items,
// chat attachments, payout receipts) all follow the same pattern: the browser
// uploads straight to Cloudinary with a short-lived signature, then POSTs the
// resulting URL back here to be stored. Nothing verified that the URL posted
// back actually came from Cloudinary — so any authenticated user could store
// an arbitrary link and have the app render it to other users as if it were
// their own uploaded media (hotlinked malware, a tracking pixel that harvests
// every viewer's IP, or a look-alike phishing image).
//
// React neutralises `javascript:` in href/src, so this is not script
// execution — it's about not letting the platform serve attacker-chosen
// third-party content under its own UI.
// ─────────────────────────────────────────

const CLOUDINARY_HOST = 'res.cloudinary.com';

// A Cloudinary delivery URL for THIS account. Falls back to accepting any
// Cloudinary host path when the cloud name isn't configured (local dev without
// upload credentials) rather than blocking uploads outright.
function isCloudinaryUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  let parsed;
  try { parsed = new URL(value); } catch { return false; }
  if (parsed.protocol !== 'https:') return false;
  if (parsed.hostname !== CLOUDINARY_HOST) return false;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return true;
  return parsed.pathname.startsWith(`/${cloudName}/`);
}

// A plain external web link (brand website, social profile URL). Restricted to
// http/https so stored values can never be `javascript:`, `data:` or `file:`.
function isSafeHttpUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  let parsed;
  try { parsed = new URL(value); } catch { return false; }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

module.exports = { isCloudinaryUrl, isSafeHttpUrl };
