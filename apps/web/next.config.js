/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@erp/ui', '@erp/types', '@erp/utils'],
  eslint: {
    // Permet le build même avec des warnings ESLint
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Permet le build même avec des erreurs TypeScript mineures
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['@erp/ui'],
  },
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
