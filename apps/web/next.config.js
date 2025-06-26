/** @type {import('next').NextConfig} */
const path = require('path');

// Chargement optionnel de dotenv
try {
  const dotenv = require('dotenv');
  const rootDir = path.join(__dirname, '../..');
  dotenv.config({ path: path.join(rootDir, '.env.local') });
  dotenv.config({ path: path.join(rootDir, '.env') });
} catch (error) {
  console.warn('dotenv non disponible');
}

const nextConfig = {
  typescript: { ignoreBuildErrors: false },
  eslint: { ignoreDuringBuilds: false },
  images: {
    formats: ["image/avif", "image/webp"],
    domains: ["localhost"],
  },
  transpilePackages: ["@erp/ui", "@erp/types", "@erp/utils", "@erp/config"],
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'ERP TopSteel',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

module.exports = nextConfig;
