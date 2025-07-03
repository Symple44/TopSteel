/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ CONFIGURATION SÉCURITÉ ENTERPRISE
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Sécurité générale
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.topsteel.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: [
              'camera=()',
              'microphone=()',
              'geolocation=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'accelerometer=()',
              'gyroscope=()'
            ].join(', ')
          }
        ]
      }
    ]
  },

  // ✅ OPTIMISATIONS PERFORMANCE - NEXT.JS 15 COMPATIBLE
  experimental: {
    optimizeCss: true,
    scrollRestoration: true
  },

  // ✅ CONFIGURATION NEXT.JS 15
  serverExternalPackages: ['@prisma/client'],

  // ✅ COMPRESSION ET CACHE
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // ✅ IMAGES OPTIMISÉES
  images: {
    domains: ['api.topsteel.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: false
  },

  // ✅ WEBPACK OPTIMIZATIONS
  webpack: (config, { isServer, dev }) => {
    // Bundle analyzer en développement
    if (!isServer && !dev && process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false
        })
      )
    }

    // Optimisations production
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          },
          common: {
            minChunks: 2,
            priority: -5,
            chunks: 'all',
            name: 'common'
          }
        }
      }
    }

    return config
  },

  // ✅ REDIRECTIONS SÉCURISÉES
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false
      }
    ]
  }
}

module.exports = nextConfig
