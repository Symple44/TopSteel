import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  typescript: {
    // TypeScript strict mode is enabled in tsconfig.base.json
    // Build errors must be fixed for production builds
    ignoreBuildErrors: false,
  },
  eslint: {
    // Re-enabled ESLint checks - configuration has been fixed
    ignoreDuringBuilds: false,
  },
  // Transpile workspace packages for Next.js 15 (excluding domains which has server dependencies)
  transpilePackages: ['@erp/api-client', '@erp/ui', '@erp/utils', '@erp/types'],

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Optimize image loading
    unoptimized: false,
    loader: 'default',
  },

  // API rewrites - proxy vers le backend NestJS
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3002'

    return [
      // Proxy tous les appels API vers le backend NestJS
      {
        source: '/api/backend/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      // Proxy les appels directs à /api/* vers le backend NestJS
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },

  // Skip static generation
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    // Remove React DevTools in production
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Bundle and performance optimizations
  productionBrowserSourceMaps: false,
  compress: true,

  // Additional optimizations to reduce bundle size
  poweredByHeader: false,
  generateEtags: true,

  // Cache optimization - reduce .next folder size
  distDir: '.next',

  // Optimisation des modules avec tree-shaking amélioré
  modularizeImports: {
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/dist/{{member}}',
      preventFullImport: true,
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
      preventFullImport: true,
    },
    '@tanstack/react-query': {
      transform: '@tanstack/react-query/build/modern/{{member}}',
      preventFullImport: true,
    },
    recharts: {
      transform: 'recharts/es6/{{member}}',
      preventFullImport: true,
    },
    '@dnd-kit/core': {
      transform: '@dnd-kit/core/dist/{{member}}',
      preventFullImport: true,
    },
    '@dnd-kit/sortable': {
      transform: '@dnd-kit/sortable/dist/{{member}}',
      preventFullImport: true,
    },
    'date-fns': {
      transform: 'date-fns/{{member}}',
      preventFullImport: true,
    },
    'lodash-es': {
      transform: 'lodash-es/{{member}}',
      preventFullImport: true,
    },
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
    // Fix for params readonly issue in Next.js 15
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
    // Re-enable component caching for better performance
    // cacheComponents: true, // Disabled - requires Next.js canary
    // Disable static optimization that causes params readonly issues
    ppr: false,
    // Bundle optimization packages with automatic tree-shaking
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@tanstack/react-query',
      'recharts',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'date-fns',
      'lodash-es',
    ],
    // Cache optimizations
    webVitalsAttribution: ['CLS', 'LCP'],
    // Memory usage optimization
    memoryBasedWorkersCount: true,
    // Optimize CSS
    optimizeCss: true,
    // Modern builds
    esmExternals: true,
  },

  // Production optimizations
  output: undefined,
  trailingSlash: false,

  // Static asset optimization
  assetPrefix: process.env.ASSET_PREFIX || '',

  // Headers for caching optimization
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year
          },
        ],
      },
    ]
  },

  // External packages for server-side only
  serverExternalPackages: [
    'sharp',
    '@img/sharp-wasm32',
    '@img/sharp-libvips-dev',
    '@img/sharp-darwin-x64',
    '@img/sharp-darwin-arm64',
    '@img/sharp-linux-x64',
    '@img/sharp-win32-x64',
    '@img/sharp-linuxmusl-x64',
    '@opentelemetry/api',
  ],

  webpack: (config, { isServer, dev, webpack }) => {
    // Add resolution for @erp/ui subpaths
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@erp/ui/data-display': path.resolve(__dirname, '../../packages/ui/dist/data-display'),
        '@erp/ui/layout': path.resolve(__dirname, '../../packages/ui/dist/layout'),
        '@erp/ui/navigation': path.resolve(__dirname, '../../packages/ui/dist/navigation'),
        '@erp/ui/forms': path.resolve(__dirname, '../../packages/ui/dist/forms'),
        '@erp/ui/feedback': path.resolve(__dirname, '../../packages/ui/dist/feedback'),
        '@erp/ui/business': path.resolve(__dirname, '../../packages/ui/dist/business'),
        '@erp/ui': path.resolve(__dirname, '../../packages/ui/dist'),
      },
    }

    // Cache optimizations to reduce .next folder size
    if (!dev) {
      // Re-enable filesystem cache for better performance
      config.cache = {
        type: 'filesystem',
        cacheDirectory: path.join(__dirname, '.next/cache'),
        buildDependencies: {
          config: [__filename],
        },
      }

      // Optimize chunk sizes and reduce bundle size
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        minimize: true,
        moduleIds: 'deterministic',
        runtimeChunk: {
          name: 'runtime',
        },
        splitChunks: {
          chunks: 'all',
          minSize: 10000, // Reduced for better splitting
          maxSize: 150000, // Target 150KB chunks instead of 200KB
          maxAsyncRequests: 20, // Reduced from 25
          maxInitialRequests: 20, // Reduced from 25
          automaticNameDelimiter: '.',
          enforceSizeThreshold: 50000,
          cacheGroups: {
            // Framework chunks (React, Next.js)
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler|next)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // Radix UI components in separate chunk
            radixui: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix-ui',
              chunks: 'all',
              priority: 30,
              enforce: true,
            },
            // TanStack Query in separate chunk
            tanstack: {
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              name: 'tanstack',
              chunks: 'all',
              priority: 25,
              enforce: true,
            },
            // Charts and visualization
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3|chart\\.js|@univerjs)[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Icons
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react|@radix-ui\/react-icons)[\\/]/,
              name: 'icons',
              chunks: 'all',
              priority: 18,
              enforce: true,
            },
            // Common utilities
            utils: {
              test: /[\\/]node_modules[\\/](zod|class-variance-authority|clsx|tailwind-merge|date-fns|lodash-es)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 15,
              enforce: true,
            },
            // Common vendor packages
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              minChunks: 1,
            },
            // Common application code
            common: {
              minChunks: 2,
              chunks: 'all',
              name: 'common',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      }

      // Add compression plugins
      config.plugins.push(
        // Compression plugin for smaller output
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify('production'),
        })
      )
    }

    // Handle Sharp properly - only on server
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        sharp: false,
        fs: false,
        path: false,
        os: false,
      }

      // Exclude Sharp modules from client bundle
      config.externals = [...(config.externals || []), 'sharp']

      // Ignore Sharp-related modules
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^sharp$/,
        })
      )
    }

    // Suppress remaining Sharp warnings during build
    config.ignoreWarnings = [
      /Module not found: Can't resolve '@img\/.*'/,
      /Critical dependency: the request of a dependency is an expression/,
      // Suppress common warnings to reduce build output
      /export .* was not found in/,
      /Critical dependency: require function is used in a way/,
    ]

    // Configuration webpack de base
    config.resolve.alias = config.resolve.alias || {}

    // OpenTelemetry conditionnel basé sur ENABLE_TELEMETRY
    const enableTelemetry = process.env.ENABLE_TELEMETRY === 'true'
    const otelPolyfill = path.resolve(__dirname, './src/utils/otel-polyfill-universal.js')

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
    }

    // For edge runtime and middleware - également conditionnel
    if (!enableTelemetry && (config.name === 'edge-runtime' || config.name === 'middleware')) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@opentelemetry/api': otelPolyfill,
      }
    }

    // Force single React instance and resolve duplicates
    config.resolve.alias = {
      ...config.resolve.alias,
      // Force single React instance
      react: path.resolve(__dirname, '../../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../../node_modules/react-dom'),
      scheduler: path.resolve(__dirname, '../../node_modules/scheduler'),
      // Force TanStack Query core resolution
      '@tanstack/query-core': path.resolve(__dirname, '../../node_modules/@tanstack/query-core'),
      '@tanstack/react-query': path.resolve(__dirname, '../../node_modules/@tanstack/react-query'),
      // Force single Radix UI instances
      '@radix-ui/primitive': path.resolve(__dirname, '../../node_modules/@radix-ui/primitive'),
      '@radix-ui/react-compose-refs': path.resolve(
        __dirname,
        '../../node_modules/@radix-ui/react-compose-refs'
      ),
      '@radix-ui/react-context': path.resolve(
        __dirname,
        '../../node_modules/@radix-ui/react-context'
      ),
      '@radix-ui/react-slot': path.resolve(__dirname, '../../node_modules/@radix-ui/react-slot'),
    }

    // Handle ESM modules properly
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
      '.mjs': ['.mjs', '.js', '.ts'],
    }

    // Ensure proper module resolution for polyfills
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      debug: path.resolve(__dirname, './src/utils/debug-polyfill.js'),
      'socket.io-parser': path.resolve(__dirname, './src/utils/socket-io-parser-polyfill.js'),
      'engine.io-client': path.resolve(__dirname, './src/utils/engine-io-client-polyfill.js'),
      '@socket.io/component-emitter': path.resolve(
        __dirname,
        './src/utils/component-emitter-polyfill.js'
      ),
      'socket.io-client/build/esm-debug/url': path.resolve(
        __dirname,
        './src/utils/socket-io-url-polyfill.js'
      ),
    }

    // Handle server-only modules in browser
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'apache-arrow/Arrow.node': false,
        'apache-arrow': false,
        '@elastic/elasticsearch': false,
        '@elastic/transport': false,
        sharp: false,
        // Exclure les modules d'images qui utilisent sharp
        '@erp/domains/image': false,
        '@erp/domains/image/service': false,
        '@erp/domains/server': false,
        // Exclure toutes les dépendances de sharp
        '@img/sharp-wasm32': false,
        '@img/sharp-wasm32/versions': false,
        '@img/sharp-libvips-dev': false,
        '@img/sharp-libvips-dev/include': false,
        '@img/sharp-libvips-dev/cplusplus': false,
        '@img/sharp-linuxmusl-x64': false,
        '@img/sharp-linux-x64': false,
        '@img/sharp-win32-x64': false,
        '@img/sharp-darwin-x64': false,
        '@img/sharp-darwin-arm64': false,
        '@img': false,
        // Exclure undici côté client (uniquement pour Node.js)
        undici: false,
        // Fix Socket.IO client dependencies avec polyfills
        debug: path.resolve(__dirname, './src/utils/debug-polyfill.js'),
        'socket.io-parser': path.resolve(__dirname, './src/utils/socket-io-parser-polyfill.js'),
        'engine.io-client': path.resolve(__dirname, './src/utils/engine-io-client-polyfill.js'),
        '@socket.io/component-emitter': path.resolve(
          __dirname,
          './src/utils/component-emitter-polyfill.js'
        ),
        'socket.io-client/build/esm-debug/url': path.resolve(
          __dirname,
          './src/utils/socket-io-url-polyfill.js'
        ),
      }
    }

    // Disable symlinks resolution for workspace packages
    config.resolve.symlinks = false

    // Add workspace packages as external if needed
    if (isServer) {
      config.externals = config.externals || []
      // Externalize Sharp and all its platform-specific dependencies
      config.externals.push('sharp', /^@img\//)
    } else {
      // For client builds, explicitly exclude Sharp and server modules
      const clientExternals = [
        'sharp',
        '@img/sharp-wasm32',
        '@img/sharp-libvips-dev',
        '@img/sharp-linuxmusl-x64',
        '@img/sharp-linux-x64',
        '@img/sharp-win32-x64',
        '@img/sharp-darwin-x64',
        '@img/sharp-darwin-arm64',
        '@erp/domains/server',
      ]

      config.externals = config.externals || []
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals
        config.externals = async (
          ...args: [
            context: { request?: string; getResolve?: () => unknown },
            request: string | undefined,
            callback?: (
              err?: Error | null,
              result?: string | boolean | string[] | Record<string, unknown>
            ) => void,
          ]
        ) => {
          const isExternal = await originalExternals(...args)
          if (isExternal) return isExternal

          const [, request] = args
          // Ensure request is a string before calling string methods
          const requestStr = typeof request === 'string' ? request : String(request || '')
          if (
            clientExternals.some((ext) => requestStr === ext || requestStr.startsWith(`${ext}/`))
          ) {
            return requestStr
          }
          return false
        }
      } else {
        config.externals.push(
          (
            ...args: [
              context: { request?: string; getResolve?: () => unknown },
              request: string | undefined,
              callback?: (
                err?: Error | null,
                result?: string | boolean | string[] | Record<string, unknown>
              ) => void,
            ]
          ) => {
            const [, request] = args
            // Ensure request is a string before calling string methods
            const requestStr = typeof request === 'string' ? request : String(request || '')
            if (
              clientExternals.some((ext) => requestStr === ext || requestStr.startsWith(`${ext}/`))
            ) {
              return requestStr
            }
            return false
          }
        )
      }
    }

    // Ensure React is resolved consistently
    config.resolve.modules = [path.resolve(__dirname, '../../node_modules'), 'node_modules']

    return config
  },
}

export default nextConfig
