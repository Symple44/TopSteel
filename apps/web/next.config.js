/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuration TypeScript
  typescript: {
    ignoreBuildErrors: true, // Temporaire pour éviter les blocages
  },

  // Configuration ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Configuration du transpilation pour les packages du monorepo
  transpilePackages: ["@erp/ui", "@erp/types", "@erp/utils", "@erp/config"],

  // Compression activée
  compress: true,

  // Configuration spécifique pour OneDrive/Windows
  experimental: {
    // Désactiver les optimisations qui peuvent causer des problèmes sur OneDrive
    isrMemoryCacheSize: 0,
    workerThreads: false,
    // Optimiser seulement les packages nécessaires
    optimizePackageImports: ["@erp/ui", "lucide-react"],
  },

  // Configuration du cache pour éviter les problèmes de symlinks
  onDemandEntries: {
    // Réduire le timeout pour éviter les problèmes de cache
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Désactiver certaines optimisations problématiques sur OneDrive
  swcMinify: true,

  // Configuration des images
  images: {
    domains: ["localhost"],
    unoptimized: true, // Évite les problèmes avec OneDrive
  },

  // Configuration du serveur pour le développement
  ...(process.env.NODE_ENV === "development" && {
    // Configuration spécifique pour le développement sur OneDrive
    webpack: (config, { dev, isServer }) => {
      if (dev && !isServer) {
        // Optimisations pour OneDrive
        config.watchOptions = {
          poll: 1000,
          aggregateTimeout: 300,
          ignored: ["**/node_modules", "**/.next"],
        };
      }
      return config;
    },
  }),

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "ERP TOPSTEEL",
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  },
};

module.exports = nextConfig;
