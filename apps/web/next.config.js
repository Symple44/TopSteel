/** @type {import('next').NextConfig} */

const nextConfig = {
  // Mode strict pour production
  reactStrictMode: process.env.NODE_ENV === 'production',
  
  // Configuration Turbopack pour Next.js 15
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },
  
  // Experimental features
  experimental: {
    optimizeCss: false, // Désactivé pour éviter critters
    workerThreads: false, // Éviter les crashes workers
    cpus: Math.max(1, require('os').cpus().length - 1)
  },
  
  // TypeScript permissif en développement
  typescript: {
    ignoreBuildErrors: process.env.NODE_ENV === 'development'
  },
  
  // ESLint permissif en développement  
  eslint: {
    ignoreDuringBuilds: process.env.NODE_ENV === 'development'
  },
  
  // Configuration Webpack optimisée
  webpack: (config, { dev, isServer }) => {
    // Optimisation mémoire
    config.optimization = config.optimization || {}
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
        }
      }
    }
    
    // Fallbacks pour modules
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      }
    }
    
    return config
  },
  
  // Images
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Headers sécurisés
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff'
          }
        ]
      }
    ]
  },
  
  // Configuration par environnement
  compiler: process.env.NODE_ENV === 'production' ? {
    removeConsole: {
      exclude: ['error', 'warn']
    }
  } : {},
  
  // Sortie standalone
  output: 'standalone',
  
  // Pas de trailing slashes
  trailingSlash: false,
  
  // Désactiver X-Powered-By
  poweredByHeader: false
}

module.exports = nextConfig
