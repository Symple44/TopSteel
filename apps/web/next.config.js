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

  // Optimisation des bundles
  experimental: {
    optimizePackageImports: [
      "@erp/ui",
      "lucide-react",
      "recharts",
      "date-fns",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-button",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-select",
      "@radix-ui/react-switch",
      "@radix-ui/react-tabs",
      "@radix-ui/react-textarea",
      "@radix-ui/react-toast",
    ],
  },

  // Imports modulaires pour réduire la taille du bundle
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}",
    },
    "date-fns": {
      transform: "date-fns/{{member}}",
    },
  },

  // Configuration du transpilation pour les packages du monorepo
  transpilePackages: ["@erp/ui", "@erp/types", "@erp/utils", "@erp/config"],

  // Compression activée
  compress: true,

  // Configuration des headers
  async headers() {
    return [
      {
        source: "/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Configuration des redirections (si nécessaire)
  async redirects() {
    return [
      // Exemple: redirection de l'ancienne route vers la nouvelle
      // {
      //   source: '/old-dashboard',
      //   destination: '/dashboard',
      //   permanent: true,
      // },
    ];
  },

  // Variables d'environnement publiques
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "ERP TOPSTEEL",
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
  },

  // Configuration pour le développement
  ...(process.env.NODE_ENV === "development" && {
    logging: {
      fetches: {
        fullUrl: true,
      },
    },
  }),
};

module.exports = nextConfig;
