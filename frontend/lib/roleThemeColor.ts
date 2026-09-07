// The mobile status-bar / address-bar colour for each role, as served in the
// SSR'd <meta name="theme-color">.
//
// Auth pages sit *outside* /influencer and /brand — the role lives in a
// `?role=` query param, not the path — so they can't inherit a role-aware
// `viewport` from a layout the way the in-app routes do. Their server
// `page.tsx` reads the param and calls resolveRoleThemeColor() instead.
//
// Kept server-side deliberately: an installed PWA (Android WebAPK) reads the
// theme-color tag from the HTML as it loads, and does not reliably repaint
// the system status bar for a later JS mutation. useThemeColor() still runs
// for client-side navigation, but the SSR value is what has to be right.

/** Creator ruby — see [[brand-palette-rebrand]]. */
export const CREATOR_THEME_COLOR = '#E0115F';
/** Brand forest green — see [[brand-palette-rebrand]]. */
export const BRAND_THEME_COLOR = '#228B22';

// Neither role: the role-chooser screen, which leans toward neither. Matches
// the manifest's neutral chrome navy and AuthLayout's slate NEUTRAL palette.
export const NEUTRAL_THEME_COLOR = '#0E1B2E';

/**
 * Maps a raw `?role=` query value to the status-bar colour for that screen.
 * Anything other than the two known roles (missing, misspelt, an array from a
 * repeated param) falls back to neutral — the same thing AuthLayout renders
 * when it gets no role, so the bar always matches the page chrome.
 */
export function resolveRoleThemeColor(role: string | string[] | undefined): string {
  if (role === 'influencer') return CREATOR_THEME_COLOR;
  if (role === 'brand') return BRAND_THEME_COLOR;
  return NEUTRAL_THEME_COLOR;
}
