/**
 * Inline, render-blocking script injected into the homepage's HTML (see
 * app/(marketing)/page.tsx). It runs synchronously as the browser parses the
 * document — before the hero/nav below it paint — so a logged-in
 * influencer/brand is sent straight to their dashboard with no visible flash
 * of the marketing homepage. Token expiry (7d) is what backs the "logged in
 * within 7 days" requirement; admin sessions (sessionStorage) are excluded.
 */
export const homeAuthRedirectScript = `
(function () {
  try {
    var token = localStorage.getItem('token');
    var stored = localStorage.getItem('user');
    if (!token || !stored) return;

    var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp || payload.exp * 1000 <= Date.now()) return;

    var role = JSON.parse(stored).role;
    if (role === 'influencer') location.replace('/influencer/dashboard');
    else if (role === 'brand') location.replace('/brand/dashboard');
  } catch (e) {}
})();
`;
