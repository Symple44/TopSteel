/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Environment variables
  env: {
    MARKETPLACE_API_URL: process.env.MARKETPLACE_API_URL || 'http://localhost:3006/api',
  },

  // Redirect root to tenant resolution
  async redirects() {
    return [
      {
        source: '/',
        destination: '/storefront',
        permanent: false,
      },
    ]
  },

  // Headers for tenant resolution
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Transpile workspace packages
  transpilePackages: ['@erp/ui', '@erp/utils', '@erp/api-client', '@erp/types'],

  // Experimental features
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  },
}

export default nextConfig