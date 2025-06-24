/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  transpilePackages: [
    "@erp/ui",
    "@erp/types", 
    "@erp/utils",
    "@erp/config"
  ],
  compress: true,
};

module.exports = nextConfig;
