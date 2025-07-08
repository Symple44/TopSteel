/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15.1 optimisations stables
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    }
  },
  
  // Turbo optimisations
  transpilePackages: ['@erp/ui', '@erp/utils', '@erp/types'],
  
  // Performance & Bundle optimisations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  
  // Webpack optimisations
  webpack: (config, { dev, isServer }) => {
    // Optimisations pour le monorepo
    config.resolve.symlinks = false
    
    // Support des packages workspace
    config.module.rules.push({
      test: /\.tsx?$/,
      include: [
        /packages\/ui/,
        /packages\/utils/,
        /packages\/types/
      ],
      use: [
        {
          loader: 'next-swc-loader',
          options: {
            sourceMaps: dev,
          },
        },
      ],
    })
    
    return config
  },
  
  // Images optimisations
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },
  
  // ESLint config
  eslint: {
    dirs: ['src', 'pages', 'components', 'lib']
  }
}

module.exports = nextConfig
