import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Minimarket ARAMAC',
    short_name: 'ARAMAC',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    icons: [
      { src: '/gfav.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/gfav.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  }
}

