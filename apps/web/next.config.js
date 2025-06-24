/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [
    "@erp/ui",
    "@erp/types", 
    "@erp/utils",
    "@erp/config"
  ],
  compress: true,
};

module.exports = nextConfig;

