/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== CONFIGURATION DE BASE =====
  reactStrictMode: true,
  compress: true,

  // ===== CORRECTION WINDOWS - DÉSACTIVER STANDALONE =====
  output: undefined, // Supprime les problèmes de symlinks sur Windows

  // ===== OPTIMISATIONS PERFORMANCE =====
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ===== CONFIGURATION EXPERIMENTALE =====
  experimental: {
    optimizePackageImports: [
      '@erp/ui',
      '@erp/types',
      '@erp/utils',
      'lucide-react',
      '@radix-ui/react-icons',
    ],
    // Désactivé pour éviter les problèmes Windows
    // turbo: false,
  },

  // ===== WEBPACK CONFIGURATION =====
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimisation pour éviter les crashes
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    }

    // Gestion gracieuse des erreurs de build
    config.optimization = {
      ...config.optimization,
      minimize: !dev,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            chunks: 'all',
            test: /node_modules/,
            name: 'vendor',
            enforce: true,
          },
        },
      },
    }

    // Configuration pour Windows
    if (process.platform === 'win32') {
      config.resolve.symlinks = false
    }

    return config
  },

  // ===== TRANSPILATION =====
  transpilePackages: ['@erp/ui', '@erp/types', '@erp/utils'],

  // ===== GESTION DES IMAGES =====
  images: {
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // ===== ENVIRONNEMENT =====
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ERP TopSteel',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // ===== GESTION DES ERREURS BUILD =====
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ===== POWEREDBYHEADER =====
  poweredByHeader: false,

  // ===== REDIRECTS =====
  async redirects() {
    return [
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
