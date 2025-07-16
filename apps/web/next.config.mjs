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
  // Transpile workspace packages for Next.js 15
  transpilePackages: ['@erp/ui', '@erp/utils', '@erp/types', '@erp/domains', '@erp/api-client'],
  
  // Disable static generation to avoid context issues during build
  // output: 'standalone', // Disabled for Windows compatibility
  
  // Skip static generation
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    // Next.js 15 with React 19 support
    reactCompiler: false, // Disable React Compiler for now
  },
  
  // Disable image optimization during build
  images: {
    unoptimized: true,
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

    // Handle server-only modules in browser
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'apache-arrow/Arrow.node': false,
        'apache-arrow': false,
        '@elastic/elasticsearch': false,
        '@elastic/transport': false,
        'sharp': false,
        // Exclure les modules d'images qui utilisent sharp
        '@erp/domains/image': false,
        '@erp/domains/image/service': false,
        '@erp/domains/server': false,
        // Exclure toutes les dépendances wasm de sharp
        '@img/sharp-wasm32': false,
        '@img/sharp-wasm32/versions': false,
        // Exclure axios et ses dépendances node-only
        'axios': false,
        'proxy-from-env': false,
        'follow-redirects': false,
        'form-data': false,
        'combined-stream': false,
        'mime-types': false,
        'asynckit': false,
        'es-set-tostringtag': false,
        'hasown': false,
      }
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

  // Images config moved above

  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig