// apps/web/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['localhost', 'your-api-domain.com'],
    minimumCacheTTL: 60,
  },
  
  // Optimisation des bundles
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@erp/ui', 'lucide-react'],
  },
  
  // Compression
  compress: true,
  
  // Headers de cache
  async headers() {
    return [
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}