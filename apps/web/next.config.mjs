/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployments
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
  // Disable Turbopack to fix workspace resolution issues
  turbopack: {
    resolveAlias: {
      '@erp/ui': '../../packages/ui/src/index.ts',
    },
  },
  // Minimal transpile packages
  transpilePackages: ['@erp/types', '@erp/ui', '@erp/api-client', '@erp/utils'],

  // Simple rewrites
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3002'
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
