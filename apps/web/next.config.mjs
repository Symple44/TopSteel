/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@erp/ui'],
  experimental: {
    externalDir: true
  }
}

export default nextConfig
