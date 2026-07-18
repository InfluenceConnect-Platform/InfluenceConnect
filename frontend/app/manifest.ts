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
    theme_color: '#5D8A8F',
    icons: [
      { src: '/icon', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
