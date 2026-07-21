import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/login', '/reset-password', '/auth/', '/api/'],
      },
    ],
    sitemap: 'https://tracktar.com/sitemap.xml',
  }
}