import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Influence Connect — India's Creator & Brand Collaboration Platform",
    short_name: 'Influence Connect',
    description:
      'Influence Connect matches Indian creators with GST-verified brands for influencer marketing campaigns.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0E1B2E',
    // Neutral app-chrome navy, NOT a role colour. An installed PWA gets one
    // manifest and one status-bar colour, but the app serves two palettes
    // (creator ruby #E0115F, brand green #228B22) — so baking either one in
    // here paints it wrong for the other half. Android/WebAPK locks the
    // status bar to this value in standalone mode (runtime <meta
    // name="theme-color"> updates from useThemeColor() are honoured only by
    // some Chrome versions and not on many Samsung builds), so it stays
    // role-agnostic and matches the navy boot splash / dark surface.
    theme_color: '#0E1B2E',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      // 512px "any" + a padded "maskable" variant — Android's install splash
      // and home-screen adaptive icon both pick from these, and upscaling
      // the 32px favicon for that made the splash logo blurry.
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
