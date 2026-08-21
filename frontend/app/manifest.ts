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
    theme_color: '#228B22',
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
