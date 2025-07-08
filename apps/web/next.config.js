/** @type {import('next').NextConfig} */
const nextConfig = {
  // SUPPRIMÉ: transpilePackages (cause le problème)
  // Next.js doit utiliser les packages buildés, pas les sources
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  webpack: (config) => {
    config.resolve.symlinks = false
    return config
  },
  
  images: {
    formats: ['image/avif', 'image/webp']
  },
  
  eslint: {
    dirs: ['src', 'app']
  }
}

module.exports = nextConfig
