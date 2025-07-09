/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@erp/ui', '@erp/utils', '@erp/types'],
  experimental: {
    esmExternals: 'loose',
    turbotrace: {
      contextDirectory: require('path').join(__dirname, '../..'),
    },
  },
  webpack: (config, { isServer, webpack }) => {
    // Force resolve workspace packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@erp/ui': require('path').resolve(__dirname, '../../packages/ui/dist'),
      '@erp/utils': require('path').resolve(__dirname, '../../packages/utils/dist'),
      '@erp/types': require('path').resolve(__dirname, '../../packages/types/dist'),
    }
    
    // Handle ESM modules properly
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
      '.mjs': ['.mjs', '.js', '.ts'],
    }
    
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    }
    
    // Add workspace packages as external if needed
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@erp/ui': '@erp/ui',
        '@erp/utils': '@erp/utils', 
        '@erp/types': '@erp/types',
      })
    }
    
    return config
  },
}

export default nextConfig
