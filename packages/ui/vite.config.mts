import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { preserveUseClientDirective } from './vite-rollup-preserve-directives.mts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.stories.*', '**/*.test.*', '**/*.spec.*', '**/test-examples/**/*'],
      outDir: 'dist',
    }),
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
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        /^@radix-ui\/.*/,
        'clsx',
        'tailwind-merge',
        'lucide-react',
        'class-variance-authority',
      ],
      plugins: [preserveUseClientDirective()],
    },
    sourcemap: false,
    minify: false,
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
