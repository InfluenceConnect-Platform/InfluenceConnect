// Server-side verification for Cloudflare Turnstile tokens.
// The frontend widget produces a one-time token that only proves the browser
// passed Cloudflare's challenge; it must always be redeemed here before the
// action it's gating (signup) is allowed to happen — never trust the token
// itself as evidence of success.

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * @param {string} token - the `cf-turnstile-response` token from the client widget
 * @param {string} [remoteIp] - the requester's IP, passed through for Cloudflare's risk scoring
 * @returns {Promise<boolean>} true only if Cloudflare confirms the token is valid
 */
async function verifyTurnstileToken(token, remoteIp) {
  if (!token) return false;

  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.error('TURNSTILE_SECRET_KEY is not set — rejecting Turnstile verification.');
    return false;
  }

  try {
    const body = new URLSearchParams();
    body.append('secret', process.env.TURNSTILE_SECRET_KEY);
    body.append('response', token);
    if (remoteIp) body.append('remoteip', remoteIp);

    const response = await fetch(TURNSTILE_VERIFY_URL, { method: 'POST', body });
    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error('Turnstile verification request failed:', err.message);
    return false;
  }
}

module.exports = { verifyTurnstileToken };
