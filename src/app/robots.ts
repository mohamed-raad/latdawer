import { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/', '/dashboard/'] }], sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'https://latdawer.mr991199.workers.dev'}/sitemap.xml` }
}
