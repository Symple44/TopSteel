/**
 * 🔧 VITE CONFIG - TOPSTEEL ERP UI PACKAGE
 * Configuration optimisée pour le build du package UI
 *
 * Fonctionnalités:
 * - Build optimisé pour library
 * - Tree-shaking et code splitting
 * - Support TypeScript complet
 * - External dependencies
 * - Multiple formats (ESM, CJS)
 * - Bundle analysis
 */

import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),

    // Génération des types TypeScript
    dts({
      insertTypesEntry: true,
      copyDtsFiles: true,
      outDir: 'dist',
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.stories.ts',
        '**/*.stories.tsx',
        '**/tests/**/*',
        '**/__tests__/**/*',
        '**/node_modules/**/*',
      ],
      compilerOptions: {
        declaration: true,
        declarationMap: true,
        emitDeclarationOnly: false,
      },
    }),

    // Analyse du bundle (en mode production uniquement)
    ...(process.env.ANALYZE
      ? [
          visualizer({
            filename: 'dist/stats.html',
            open: true,
            gzipSize: true,
            brotliSize: true,
          }),
        ]
      : []),
  ],

  // Configuration du build
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TopSteelUI',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.js'),
    },

    rollupOptions: {
      // Dépendances externes (ne pas les bundler)
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@radix-ui/react-accordion',
        '@radix-ui/react-alert-dialog',
        '@radix-ui/react-avatar',
        '@radix-ui/react-checkbox',
        '@radix-ui/react-collapsible',
        '@radix-ui/react-context-menu',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-hover-card',
        '@radix-ui/react-label',
        '@radix-ui/react-menubar',
        '@radix-ui/react-navigation-menu',
        '@radix-ui/react-popover',
        '@radix-ui/react-progress',
        '@radix-ui/react-radio-group',
        '@radix-ui/react-scroll-area',
        '@radix-ui/react-select',
        '@radix-ui/react-separator',
        '@radix-ui/react-slider',
        '@radix-ui/react-slot',
        '@radix-ui/react-switch',
        '@radix-ui/react-tabs',
        '@radix-ui/react-toast',
        '@radix-ui/react-toggle',
        '@radix-ui/react-tooltip',
      ],

      output: {
        // Configuration pour les globals (UMD)
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'ReactJSXRuntime',
        },

        // Préservation des modules pour le tree-shaking
        preserveModules: false,

        // Configuration des exports
        exports: 'named',

        // Chunking intelligent (seulement pour les modules non-externes)
        manualChunks: (id) => {
          // Regrouper les utilitaires CSS
          if (
            id.includes('clsx') ||
            id.includes('tailwind-merge') ||
            id.includes('class-variance-authority')
          ) {
            return 'utils'
          }

          // Regrouper les hooks React
          if (id.includes('src/hooks/')) {
            return 'hooks'
          }

          // Regrouper les composants par catégorie
          if (id.includes('src/components/')) {
            if (id.includes('button') || id.includes('badge')) {
              return 'basic-components'
            }
            if (id.includes('card') || id.includes('slider')) {
              return 'complex-components'
            }
            return 'components'
          }

          // Chunk par défaut pour les autres modules
          return undefined
        },
      },
    },

    // Optimisations
    minify: 'esbuild',
    sourcemap: true,
    target: 'esnext',

    // Configuration CSS
    cssCodeSplit: true,

    // Nettoyage du répertoire de sortie
    emptyOutDir: true,

    // Configuration des chunks
    chunkSizeWarningLimit: 500,

    // Optimisations des dependencies
    commonjsOptions: {
      esmExternals: true,
    },
  },

  // Résolution des modules
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/lib': resolve(__dirname, 'src/lib'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
    },

    // Extensions de fichiers
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },

  // Configuration CSS
  css: {
    modules: {
      localsConvention: 'camelCase',
    },

    postcss: {
      plugins: [],
    },
  },

  // Optimisation des dépendances (seulement pour le dev)
  optimizeDeps: {
    include: ['clsx', 'tailwind-merge', 'class-variance-authority'],

    // Exclure toutes les dépendances externes
    exclude: ['react', 'react-dom', 'react/jsx-runtime'],
  },

  // Configuration du serveur de développement
  server: {
    port: 5173,
    open: false,
    cors: true,
  },

  // Configuration de preview
  preview: {
    port: 4173,
    open: false,
    cors: true,
  },

  // Variables d'environnement
  define: {
    __UI_PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version || '2.1.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Configuration des workers
  worker: {
    format: 'es',
  },

  // Configuration de l'analyse
  esbuild: {
    // Optimisations pour la production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],

    // Support des decorators
    target: 'esnext',

    // JSX
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },

  // Configuration du JSON
  json: {
    namedExports: true,
    stringify: false,
  },
})
