import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

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
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ErpUI',
      formats: ['es'],
      fileName: 'index',
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
