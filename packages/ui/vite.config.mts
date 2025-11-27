import { cpus } from 'node:os'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig, loadEnv } from 'vite'
import dts from 'vite-plugin-dts'
import { compressionPlugin } from './vite-compression.mts'
import { reactOptimizer } from './vite-react-optimizer.mts'
import { preserveUseClientDirective } from './vite-rollup-preserve-directives.mts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'
  const isAnalyze = env.ANALYZE === 'true'
  const skipTypes = env.SKIP_TYPES === 'true'

  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }),
      ...(skipTypes
        ? []
        : [
            dts({
              insertTypesEntry: true,
              include: ['src/**/*'],
              exclude: ['**/*.stories.*', '**/*.test.*', '**/*.spec.*', '**/test-examples/**/*'],
              outDir: 'dist',
              copyDtsFiles: false,
              skipDiagnostics: !isDev,
              logDiagnostics: false,
              rollupTypes: false,
              bundledPackages: [],
              compilerOptions: {
                declarationMap: false,
                preserveSymlinks: false,
              },
            }),
          ]),
      reactOptimizer(),
      ...(isAnalyze
        ? [
            visualizer({
              filename: 'dist/bundle-analysis.html',
              open: true,
              gzipSize: true,
              brotliSize: true,
            }),
          ]
        : []),
      ...(isDev ? [] : [compressionPlugin()]),
    ],

    build: {
      lib: {
        entry: {
          index: resolve(__dirname, 'src/index.ts'),
          'hooks/index': resolve(__dirname, 'src/hooks/index.ts'),
          'primitives/index': resolve(__dirname, 'src/components/primitives/index.ts'),
          'layout/index': resolve(__dirname, 'src/components/layout/index.ts'),
          'forms/index': resolve(__dirname, 'src/components/forms/index.ts'),
          'data-display/index': resolve(__dirname, 'src/components/data-display/index.ts'),
          'feedback/index': resolve(__dirname, 'src/components/feedback/index.ts'),
          'navigation/index': resolve(__dirname, 'src/components/navigation/index.ts'),
          'business/index': resolve(__dirname, 'src/components/business/index.ts'),
          'theme/index': resolve(__dirname, 'src/components/theme/index.ts'),
        },
        formats: isDev ? ['es'] : ['es', 'cjs'], // Only build ES modules in dev
        fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
      },
      rollupOptions: {
        external: [
          'react',
          'react-dom',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
          'react-hook-form',
          /^@radix-ui\/.*/,
          'clsx',
          'tailwind-merge',
          'lucide-react',
          'class-variance-authority',
          'next-themes',
          'dompurify',
          'isomorphic-dompurify',
          /^next\/.*/,
          'next',
        ],
        plugins: [preserveUseClientDirective()],
        output: {
          // Optimize chunk splitting for better caching
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'vendor') {
              return '[name]-[hash].js'
            }
            return '[name]-[hash].js'
          },
          manualChunks: (id) => {
            // Split heavy dependencies into separate chunks
            if (id.includes('@radix-ui')) {
              return 'radix-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'icons'
            }
            if (
              id.includes('class-variance-authority') ||
              id.includes('clsx') ||
              id.includes('tailwind-merge')
            ) {
              return 'utils'
            }
            // Split business components into smaller chunks
            if (id.includes('business/dialogs')) {
              return 'business-dialogs'
            }
            if (id.includes('business/displays')) {
              return 'business-displays'
            }
            if (id.includes('business/filters')) {
              return 'business-filters'
            }
            if (id.includes('business/forms')) {
              return 'business-forms'
            }
            if (id.includes('business/metallurgy')) {
              return 'business-metallurgy'
            }
            if (id.includes('business/notifications')) {
              return 'business-notifications'
            }
            if (id.includes('business/pricing')) {
              return 'business-pricing'
            }
            if (id.includes('business/tables')) {
              return 'business-tables'
            }
            if (id.includes('business/workflows')) {
              return 'business-workflows'
            }
            // Split large components
            if (id.includes('TaskWorkflow') || id.includes('reorderable-list-example')) {
              return 'heavy-components'
            }
            if (id.includes('datatable') && id.includes('components/data-display')) {
              return 'datatable'
            }
            if (id.includes('forms') && id.includes('components')) {
              return 'forms'
            }
            return undefined
          },
          // Minimize wrapper code
          hoistTransitiveImports: false,
          compact: !isDev,
          // Enable advanced minification for better tree shaking
          minifyInternalExports: !isDev,
        },
        // Advanced tree shaking
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
          unknownGlobalSideEffects: false,
          preset: 'recommended',
        },
        // Enable parallel processing
        maxParallelFileOps: Math.max(1, cpus().length - 1),
      },
      target: 'es2020',
      sourcemap: false, // Disable sourcemaps for faster builds
      minify: isDev ? false : 'terser', // Use terser for better compression
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      emptyOutDir: true,
      cssMinify: !isDev,
      cssCodeSplit: true, // Enable CSS code splitting
      reportCompressedSize: false, // Disable for faster builds
      chunkSizeWarningLimit: 1000, // Increase limit for library builds
      assetsInlineLimit: 0, // Don't inline any assets

      // Enable build cache for faster subsequent builds
      commonjsOptions: {
        include: [],
        exclude: ['**'],
      },
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },

    // Optimize dependencies for faster builds
    optimizeDeps: {
      include: ['react', 'react-dom/client', 'clsx', 'tailwind-merge', 'class-variance-authority'],
      exclude: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', 'lucide-react'],
    },

    // Development server optimizations
    server: {
      hmr: {
        overlay: false,
        port: 5174,
      },
      watch: {
        ignored: [
          'node_modules/**',
          'dist/**',
          '**/*.test.*',
          '**/*.spec.*',
          '**/*.stories.*',
          'coverage/**',
        ],
      },
      fs: {
        allow: ['..'],
      },
    },

    // Performance optimizations
    esbuild: {
      target: 'es2020',
      treeShaking: true,
      minifyIdentifiers: !isDev,
      minifyWhitespace: !isDev,
      minifySyntax: !isDev,
      // Remove console.log in production
      drop: isDev ? [] : ['console', 'debugger'],
      legalComments: 'none',
    },

    define: {
      __DEV__: isDev,
    },
  }
})
