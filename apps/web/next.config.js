/**
 * 🚀 NEXT.JS CONFIG CORRIGÉ - TopSteel ERP
 * Configuration compatible Next.js 15.3.4
 * Fichier: apps/web/next.config.js
 */

const path = require('path')

// ===== GESTION DES VARIABLES D'ENVIRONNEMENT =====

const rootDir = path.resolve(__dirname, '../..')
const envLocalPath = path.join(rootDir, '.env.local')

// Charger les variables d'environnement depuis la racine
try {
  require('dotenv').config({ path: envLocalPath })
  console.log('✅ Variables d\'environnement chargées depuis la racine')
} catch (error) {
  console.warn('⚠️ Impossible de charger .env.local depuis la racine:', error.message)
}

// ===== CONFIGURATION PRINCIPALE =====

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== CONFIGURATION MONOREPO =====
  
  transpilePackages: [
    '@erp/types',
    '@erp/config'
  ],

  // ===== PACKAGES EXTERNES SERVEUR (Next.js 15) =====
  
  serverExternalPackages: [
    '@erp/ui',
    '@erp/utils'
  ],

  // ===== CONFIGURATION EXPERIMENTAL =====
  
  experimental: {
    // Optimisations pour éviter les erreurs de build
    optimizeCss: true,
    
    // Optimisations bundle
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'lodash'
    ]
  },

  // ===== CONFIGURATION TURBOPACK (Stable dans Next.js 15) =====
  
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },

  // ===== CORRECTIONS COMPILATION =====

  webpack: (config, { buildId, dev, isServer, defaultLoaders, nextRuntime, webpack }) => {
    // Fix pour les erreurs de module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/stores': path.resolve(__dirname, 'src/stores'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/styles': path.resolve(__dirname, 'src/styles'),
      '@/app': path.resolve(__dirname, 'src/app'),
      '@/services': path.resolve(__dirname, 'src/services'),
      '@/utils': path.resolve(__dirname, 'src/utils')
    }

    // Configuration pour éviter les erreurs de module non trouvé
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false
    }

    // Optimisations pour les builds
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true
            },
            ui: {
              test: /[\\/]packages[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 20
            }
          }
        }
      }
    }

    // Configuration pour les SVG
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    })

    // Suppression des warnings inutiles
    config.infrastructureLogging = {
      level: 'error'
    }

    // Désactiver les warnings de chunks critiques
    config.optimization.realContentHash = false

    return config
  },

  // ===== CONFIGURATION COMPILER =====
  
  compiler: {
    // Supprimer console.log en production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    
    // Optimisations React
    reactRemoveProperties: process.env.NODE_ENV === 'production'
  },

  // ===== OPTIMISATIONS D'IMAGES =====
  
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [
      'localhost',
      'topsteel.fr',
      'assets.topsteel.fr'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.topsteel.fr',
        port: '',
        pathname: '/images/**'
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // ===== HEADERS DE SÉCURITÉ =====
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Sécurité de base
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          
          // Performance
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },

          // CSP pour la sécurité
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
              "frame-src 'none'",
              "object-src 'none'"
            ].join('; ')
          }
        ]
      },
      
      // Headers pour les assets statiques
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },

  // ===== REDIRECTIONS =====
  
  async redirects() {
    return [
      // Redirection de la racine vers login si pas connecté
      {
        source: '/',
        destination: '/login',
        permanent: false
      },
      
      // Redirections pour éviter les URLs en double
      {
        source: '/register/',
        destination: '/register',
        permanent: true
      },
      {
        source: '/login/',
        destination: '/login', 
        permanent: true
      }
    ]
  },

  // ===== CONFIGURATION API =====
  
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`
      }
    ]
  },

  // ===== VARIABLES D'ENVIRONNEMENT =====
  
  env: {
    CUSTOM_BUILD_TIME: new Date().toISOString(),
    CUSTOM_NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'TopSteel ERP'
  },

  // ===== CONFIGURATION BUILD =====
  
  // Optimisations de build
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  
  // Configuration TypeScript
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json'
  },

  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['src', 'pages', 'components', 'lib', 'hooks']
  },

  // ===== OPTIMISATIONS IMPORT =====
  
  modularizeImports: {
    'lodash': {
      transform: 'lodash/{{member}}'
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}'
    },
    'date-fns': {
      transform: 'date-fns/{{member}}'
    }
  },

  // ===== GESTION OUTPUT =====
  
  output: process.env.DOCKER ? 'standalone' : undefined,
  
  // Configuration de tracing pour docker
  outputFileTracingRoot: process.env.DOCKER ? path.join(__dirname, '../../') : undefined,

  // ===== OPTIMISATIONS RUNTIME =====
  
  // Configuration logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development'
    }
  },

  // ===== CONFIGURATION PAGES =====
  
  // Augmenter les timeouts pour éviter les erreurs de build
  staticPageGenerationTimeout: 120,
  
  // Configuration des pages d'erreur
  pageExtensions: ['tsx', 'ts', 'jsx', 'js']
}

// ===== PLUGINS ET MIDDLEWARES =====

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

// ===== CONFIGURATION CONDITIONNELLE =====

// Configuration pour Vercel
if (process.env.VERCEL) {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    isrMemoryCacheSize: 0
  }
}

// Configuration de développement
if (process.env.NODE_ENV === 'development') {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    logging: {
      level: 'verbose'
    }
  }
}

// ===== EXPORT FINAL =====

module.exports = withBundleAnalyzer(nextConfig)

// ===== VALIDATION ET LOGGING =====

// Validation des variables d'environnement
const requiredEnvVars = ['NEXT_PUBLIC_API_URL']
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.warn('⚠️  Variables d\'environnement manquantes:', missingEnvVars.join(', '))
  console.warn('⚠️  Certaines fonctionnalités peuvent ne pas fonctionner')
} else {
  console.log('✅ Toutes les variables d\'environnement requises sont présentes')
}

// Logging en développement
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Next.js Config Debug:', {
    rootDir,
    envLocalPath,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'NOT_CONFIGURED',
    nodeEnv: process.env.NODE_ENV,
    turbopack: !!nextConfig.turbopack
  })
}