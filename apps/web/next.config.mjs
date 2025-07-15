import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

// Fonction pour exécuter Biome
async function runBiome() {
  try {
    const { stdout, stderr } = await execAsync('npx biome check src/ --reporter=summary')
    if (stderr && !stderr.includes('warnings')) {
      console.error('❌ Biome found issues:')
      console.error(stderr)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Biome check failed:', error.message)
    process.exit(1)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpiler les packages @erp pour permettre l'utilisation depuis dist/
  transpilePackages: ['@erp/domains', '@erp/types', '@erp/ui', '@erp/utils', '@erp/api-client'],

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    // Removed esmExternals and turbotrace as they're causing warnings
  },

  webpack: (config, { isServer }) => {
    // Force resolve workspace packages
    config.resolve.alias = {
      ...config.resolve.alias,
      '@erp/ui': path.resolve(import.meta.dirname, '../../packages/ui/dist'),
      '@erp/utils': path.resolve(import.meta.dirname, '../../packages/utils/dist'),
      '@erp/types': path.resolve(import.meta.dirname, '../../packages/types/dist'),
      '@erp/domains': path.resolve(import.meta.dirname, '../../packages/domains/dist'),
      '@erp/api-client': path.resolve(import.meta.dirname, '../../packages/api-client/dist'),
      // Force single React instance
      'react': path.resolve(import.meta.dirname, '../../node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, '../../node_modules/react-dom'),
      'scheduler': path.resolve(import.meta.dirname, '../../node_modules/scheduler'),
      // Force TanStack Query core resolution
      '@tanstack/query-core': path.resolve(import.meta.dirname, '../../node_modules/@tanstack/query-core'),
      '@tanstack/react-query': path.resolve(import.meta.dirname, '../../node_modules/@tanstack/react-query'),
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

    // Disable symlinks resolution for workspace packages
    config.resolve.symlinks = false

    // Add workspace packages as external if needed
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@erp/ui': '@erp/ui',
        '@erp/utils': '@erp/utils',
        '@erp/types': '@erp/types',
        '@erp/domains': '@erp/domains',
        '@erp/api-client': '@erp/api-client',
      })
    }

    // Ensure React is resolved consistently
    config.resolve.modules = [
      path.resolve(import.meta.dirname, '../../node_modules'),
      'node_modules'
    ]

    // Add scheduler to fallback for better compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'scheduler': path.resolve(import.meta.dirname, '../../node_modules/scheduler'),
    }

    // Ensure scheduler is properly resolved
    if (!config.resolve.alias['scheduler']) {
      config.resolve.alias['scheduler'] = path.resolve(import.meta.dirname, '../../node_modules/scheduler')
    }

    return config
  },

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig