/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration TypeScript stricte
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Configuration des images
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ["localhost"],
    minimumCacheTTL: 60,
  },

  // Configuration Turbopack (nouvelle syntaxe stable)
  turbopack: {
    resolveAlias: {
      '@': './src',
    },
  },

  // Optimisations
  experimental: {
    optimizePackageImports: [
      "@erp/ui", 
      "lucide-react", 
      "recharts", 
      "date-fns"
    ],
  },

  // Configuration du transpilation pour les packages du monorepo
  transpilePackages: [
    "@erp/ui",
    "@erp/types", 
    "@erp/utils",
    "@erp/config"
  ],

  // Compression activée
  compress: true,

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ERP TOPSTEEL',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },

  // Configuration des redirections
  async redirects() {
    return [
      {
        source: '/auth',
        destination: '/login',
        permanent: true,
      },
    ]
  },
};

module.exports = nextConfig;
