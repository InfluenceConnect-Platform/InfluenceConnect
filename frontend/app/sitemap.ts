import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://influenceconnect.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: siteUrl, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/for-creators`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/for-brands`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/pricing`, lastModified, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${siteUrl}/about`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/contact`, lastModified, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${siteUrl}/legal/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/legal/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/legal/refund`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
