import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard/', '/admin/', '/api/', '/auth/callback', '/auth/forgot-password', '/auth/reset-password', '/checkout/', '/onboarding/'],
      },
    ],
    sitemap: 'https://snap-r.com/sitemap.xml',
  };
}
