import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.stories.*', '**/*.test.*'],
      outDir: 'dist'
    })
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ErpUi',
      formats: ['es'],
      fileName: () => 'index.js'  // Force .js extension
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
        'class-variance-authority'
      ],
      output: {
        format: 'es',
        exports: 'named',
        preserveModules: false
      }
    },
    sourcemap: true,
    target: 'esnext',
    minify: false,
    emptyOutDir: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})