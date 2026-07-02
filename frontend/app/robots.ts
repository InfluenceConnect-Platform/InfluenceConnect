import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://influenceconnect.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the logged-in app and auth flows out of search results
      disallow: ['/admin/', '/brand/', '/influencer/', '/auth/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
