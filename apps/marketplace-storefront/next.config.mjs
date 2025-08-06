/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations - disable standalone mode on Windows to avoid symlink issues
  output: undefined, // Disabled to prevent symlink errors on Windows

  // Origines autorisées pour les ressources cross-origin en développement
  allowedDevOrigins: [
    'http://localhost:3007',
    'http://127.0.0.1:3007',
    'https://localhost:3007',
    'https://127.0.0.1:3007',
    'localhost:3007',
    '127.0.0.1:3007',
  ],

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
    // Permettre les SVG et désactiver l'optimisation pour les images démo
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Images non optimisées pour les API locales
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Environment variables
  env: {
    MARKETPLACE_API_URL: process.env.MARKETPLACE_API_URL || 'http://localhost:3004/api',
  },

  // Pas de redirection automatique - laisser la page d'accueil gérer la sélection des tenants
  // async redirects() {
  //   return [
  //     {
  //       source: '/',
  //       destination: '/storefront',
  //       permanent: false,
  //     },
  //   ]
  // },

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
