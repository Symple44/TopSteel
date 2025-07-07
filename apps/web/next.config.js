/**
 * 🔧 CONFIGURATION NEXT.JS 15 COMPATIBLE - TopSteel ERP
 * Configuration corrigée pour Next.js 15 avec chargement env depuis la racine
 * Fichier: apps/web/next.config.js
 */

const path = require('path')
const { config } = require('dotenv')

// ===== CHARGEMENT VARIABLES D'ENVIRONNEMENT DEPUIS LA RACINE =====
// Identique à la logique de l'API NestJS
const rootDir = path.join(__dirname, '../..')
const envLocalPath = path.join(rootDir, '.env.local')

console.log('🔧 Loading .env from root:', envLocalPath)

// Charger les variables depuis la racine (comme l'API)
config({ path: envLocalPath })
config({ path: path.join(rootDir, '.env') })

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ===== CONFIGURATION DE BASE =====
  
  /**
   * Mode strict pour React - Détecte les problèmes en développement
   */
  reactStrictMode: true,

  /**
   * Experimental features pour Next.js 15
   */
  experimental: {
    // Server Actions pour les formulaires (objet requis en Next.js 15)
    serverActions: {
      allowedOrigins: ['localhost:3000', 'topsteel.fr']
    },
    
    // Optimisation des polyfills
    esmExternals: true,
    
    // Optimisations diverses
    optimizePackageImports: ['lucide-react', 'date-fns'],
    
    // Streaming SSR amélioré
    ppr: false // Partial Prerendering - expérimental
  },

  /**
   * Packages externes côté serveur (nouvelle syntaxe Next.js 15)
   */
  serverExternalPackages: [
    'sharp',
    'canvas',
    'jsdom'
  ],

  /**
   * Configuration Turbopack (stable en Next.js 15)
   */
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js'
      }
    }
  },

  // ===== GESTION DES ERREURS SSR =====
  
  /**
   * Configuration webpack pour éviter les erreurs "window is not defined"
   */
  webpack: (config, { dev, isServer, webpack }) => {
    // Configuration pour les modules qui utilisent des APIs browser
    if (!isServer) {
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
        path: false,
      }
    }

    // Plugin pour ignorer les modules problématiques côté serveur
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^electron$/
      })
    )

    // Optimisations pour la production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            
            // Chunk séparé pour les bibliothèques
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10
            },
            
            // Chunk pour les composants UI
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 20
            }
          }
        }
      }
    }

    // Alias pour simplifier les imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/hooks': path.resolve(__dirname, 'src/hooks'),
      '@/stores': path.resolve(__dirname, 'src/stores'),
      '@/types': path.resolve(__dirname, 'src/types'),
      '@/styles': path.resolve(__dirname, 'src/styles')
    }

    return config
  },

  // ===== OPTIMISATIONS D'IMAGES =====
  
  images: {
    // Formats d'images optimisés
    formats: ['image/avif', 'image/webp'],
    
    // Domaines autorisés pour les images externes
    domains: [
      'localhost',
      'topsteel.fr',
      'assets.topsteel.fr'
    ],
    
    // Patterns d'URLs autorisés
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.topsteel.fr',
        port: '',
        pathname: '/images/**'
      }
    ],
    
    // Tailles d'images prédéfinies
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Optimisations
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 jours
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // ===== HEADERS ET SÉCURITÉ =====
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Sécurité
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
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'),
              "frame-src 'none'",
              "object-src 'none'"
            ].join('; ')
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      
      // Headers spécifiques pour les assets statiques
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      
      // Headers pour les API routes
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate'
          }
        ]
      }
    ]
  },

  // ===== REDIRECTIONS =====
  
  async redirects() {
    return [
      // Redirections legacy
      {
        source: '/old-stock',
        destination: '/stock',
        permanent: true
      },
      
      // Redirections pour les URLs sans trailing slash
      {
        source: '/stock/mouvements/',
        destination: '/stock/mouvements',
        permanent: true
      }
    ]
  },

  // ===== REWRITES CORRIGÉS =====
  
  async rewrites() {
    // Vérifier que l'URL de l'API existe
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001'
    
    return [
      // Proxy vers l'API backend
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`
      }
    ]
  },

  // ===== GESTION DES ENVIRONNEMENTS =====
  
  env: {
    // Variables d'environnement personnalisées
    CUSTOM_BUILD_TIME: new Date().toISOString(),
    CUSTOM_NODE_ENV: process.env.NODE_ENV,
    
    // Exposer les variables chargées depuis la racine pour debugging
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME
  },

  // ===== CONFIGURATION ESLint =====
  
  eslint: {
    // Répertoires à ignorer
    ignoreDuringBuilds: false,
    dirs: ['src', 'pages', 'components', 'lib', 'hooks']
  },

  // ===== CONFIGURATION TypeScript =====
  
  typescript: {
    // Ignorer les erreurs TypeScript en production (à éviter en général)
    ignoreBuildErrors: false,
    
    // Chemin vers le fichier tsconfig
    tsconfigPath: './tsconfig.json'
  },

  // ===== COMPRESSION ET OPTIMISATIONS =====
  
  compress: true,
  
  poweredByHeader: false,
  
  generateEtags: true,

  // ===== OPTIMISATIONS DE BUNDLE =====
  
  modularizeImports: {
    // Optimisation des imports de lodash
    'lodash': {
      transform: 'lodash/{{member}}'
    },
    
    // Optimisation des imports d'icônes
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}'
    }
  },

  // ===== CONFIGURATION OUTPUT =====
  
  output: process.env.DOCKER ? 'standalone' : undefined,

  // ===== LOGGING =====
  
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development'
    }
  }
}

// ===== PLUGINS ET MIDDLEWARES =====

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
})

// ===== CONFIGURATION CONDITIONNELLE =====

/**
 * Configuration pour Vercel (si déployé sur Vercel)
 */
if (process.env.VERCEL) {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    
    // Optimisations spécifiques Vercel
    isrMemoryCacheSize: 0
  }
}

/**
 * Configuration pour Docker
 */
if (process.env.DOCKER) {
  nextConfig.outputFileTracingRoot = path.join(__dirname, '../../')
}

/**
 * Configuration de développement avancée
 */
if (process.env.NODE_ENV === 'development') {
  nextConfig.experimental = {
    ...nextConfig.experimental,
    
    // Debugging amélioré
    logging: {
      level: 'verbose'
    }
  }
}

// ===== EXPORT FINAL =====

module.exports = withBundleAnalyzer(nextConfig)

// ===== VALIDATION DE LA CONFIGURATION =====

// Vérification des variables d'environnement essentielles
const requiredEnvVars = ['NEXT_PUBLIC_API_URL']
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])

if (missingEnvVars.length > 0) {
  console.warn('⚠️  Variables d\'environnement manquantes:', missingEnvVars.join(', '))
  console.warn('⚠️  Vérifiez le fichier .env.local à la racine du projet')
  console.warn('⚠️  Chemin .env.local:', envLocalPath)
} else {
  console.log('✅ Variables d\'environnement chargées depuis la racine')
}

// Log de la configuration en développement
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Next.js Config:', {
    rootDir,
    envLocalPath,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'NOT_FOUND',
    nodeEnv: process.env.NODE_ENV,
    turbopack: !!nextConfig.turbopack
  })
}