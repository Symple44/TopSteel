import path from 'node:path'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { createRequire } from 'node:module'

const execAsync = promisify(exec)
const require = createRequire(import.meta.url)

// Fonction pour résoudre les modules de manière sécurisée
function safeResolve(moduleName) {
  try {
    return require.resolve(moduleName)
  } catch (error) {
    console.warn(`Module ${moduleName} non trouvé, utilisation de fallback`)
    return false
  }
}

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
  
  // API rewrites - proxy vers le backend NestJS
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'
    
    return [
      // Proxy tous les appels API vers le backend NestJS avec versioning
      {
        source: '/api/backend/:path*',
        destination: `${apiUrl}/api/v1/:path*`
      }
    ]
  },
  
  // Disable static generation to avoid context issues during build
  // output: 'standalone', // Disabled for Windows compatibility
  
  // Skip static generation
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Add dev origins
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  
  // OpenTelemetry contrôlé - réactivation progressive
  env: {
    // Réactiver progressivement OpenTelemetry
    OTEL_ENABLED: process.env.ENABLE_TELEMETRY === 'true' ? 'true' : 'false',
    // Garder les désactivations Next.js pour éviter les conflits
    NEXT_OTEL_DISABLED: process.env.ENABLE_TELEMETRY === 'true' ? '0' : '1',
    NEXT_TRACING_DISABLED: process.env.ENABLE_TELEMETRY === 'true' ? '0' : '1',
    // SDK externe contrôlé
    OTEL_SDK_DISABLED: process.env.ENABLE_TELEMETRY === 'true' ? 'false' : 'true',
  },
  
  // Disable experimental features that might cause issues
  experimental: {
    // Next.js 15 with React 19 support
    reactCompiler: false, // Disable React Compiler for now
  },
  
  // External packages for server-side only
  serverExternalPackages: ['sharp', '@img/sharp-wasm32', '@opentelemetry/api'],
  
  // Disable image optimization during build
  images: {
    unoptimized: true,
  },

  webpack: (config, { isServer }) => {
    // OpenTelemetry conditionnel basé sur ENABLE_TELEMETRY
    const enableTelemetry = process.env.ENABLE_TELEMETRY === 'true'
    const otelPolyfill = path.resolve(import.meta.dirname, './src/utils/otel-polyfill-universal.js')
    
    if (!enableTelemetry) {
      // Désactiver OpenTelemetry avec polyfill universel
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/api': otelPolyfill,
        '@opentelemetry/sdk-node': false,
        '@opentelemetry/resources': false,
        '@opentelemetry/auto-instrumentations-node': false,
        '@opentelemetry/core': false,
        '@opentelemetry/instrumentation': false,
      }
    } else {
      // OpenTelemetry activé - configuration minimale
      console.log('🔧 OpenTelemetry ACTIVÉ en mode contrôlé')
    }
    
    // For edge runtime and middleware - également conditionnel
    if (!enableTelemetry && (config.name === 'edge-runtime' || config.name === 'middleware')) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/api': otelPolyfill,
      }
    }

    // Mock Sharp pour le côté client
    if (!isServer) {
      const clientAliases = {
        ...config.resolve.alias,
        'sharp$': path.resolve(import.meta.dirname, './src/mocks/sharp.js'),
      }
      
      // Désactiver OpenTelemetry côté client seulement si télémétrie désactivée
      if (!enableTelemetry) {
        clientAliases['@opentelemetry/api'] = otelPolyfill
        clientAliases['@opentelemetry/sdk-node'] = false
      }
      
      config.resolve.alias = clientAliases
    }
    
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
      debug: path.resolve(import.meta.dirname, './src/utils/debug-polyfill.js'),
      'socket.io-parser': path.resolve(import.meta.dirname, './src/utils/socket-io-parser-polyfill.js'),
      'engine.io-client': path.resolve(import.meta.dirname, './src/utils/engine-io-client-polyfill.js'),
      '@socket.io/component-emitter': path.resolve(import.meta.dirname, './src/utils/component-emitter-polyfill.js'),
      'socket.io-client/build/esm-debug/url': path.resolve(import.meta.dirname, './src/utils/socket-io-url-polyfill.js'),
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
        '@img': false,
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
        // Exclure undici côté client (uniquement pour Node.js)
        'undici': false,
        // Fix Socket.IO client dependencies avec polyfills
        'debug': path.resolve(import.meta.dirname, './src/utils/debug-polyfill.js'),
        'socket.io-parser': path.resolve(import.meta.dirname, './src/utils/socket-io-parser-polyfill.js'),
        'engine.io-client': path.resolve(import.meta.dirname, './src/utils/engine-io-client-polyfill.js'),
        '@socket.io/component-emitter': path.resolve(import.meta.dirname, './src/utils/component-emitter-polyfill.js'),
        'socket.io-client/build/esm-debug/url': path.resolve(import.meta.dirname, './src/utils/socket-io-url-polyfill.js'),
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