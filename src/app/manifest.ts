import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'لاتدور - كل مراكز قطع السيارات في العراق بمكان واحد',
    short_name: 'لاتدور',
    description: 'ابحث عن أي قطعة غيار في ثوانٍ - كل مراكز قطع السيارات في العراق بمكان واحد',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/svg+xml' },
    ],
  }
}
