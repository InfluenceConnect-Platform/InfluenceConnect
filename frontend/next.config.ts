import type { NextConfig } from "next";

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Content-Security-Policy, shipped Report-Only for now: a misconfigured
// directive shows up as a console warning instead of silently breaking
// Razorpay checkout, Cloudflare Turnstile, or Cloudinary uploads. Once a
// production pass confirms a clean console (no CSP violation reports) across
// login/signup, checkout, and chat/portfolio uploads, rename the header below
// to `Content-Security-Policy` to start enforcing it.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  `connect-src 'self' ${API_URL} https://res.cloudinary.com https://api.cloudinary.com https://api.razorpay.com https://lumberjack.razorpay.com https://challenges.cloudflare.com`,
  "frame-src https://checkout.razorpay.com https://api.razorpay.com https://challenges.cloudflare.com",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    // Skipped in dev: LAN IPs vary per machine (see lib/api.ts) and Next's
    // dev server needs eval/inline allowances the policy above doesn't grant.
    if (!IS_PRODUCTION) return [];
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Content-Security-Policy-Report-Only', value: CSP }],
      },
    ];
  },
};

export default nextConfig;
