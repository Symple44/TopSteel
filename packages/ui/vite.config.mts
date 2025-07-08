import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*'],
      exclude: ['**/*.stories.*', '**/*.test.*']
    })
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ErpUi'
    },
    rollupOptions: {
      external: [
        'react', 
        'react-dom', 
        /^@radix-ui\/.*/, 
        'clsx', 
        'tailwind-merge', 
        'lucide-react', 
        'class-variance-authority'
      ],
      output: [
        {
          format: 'es',
          entryFileNames: 'index.mjs',
          exports: 'named'
        },
        {
          format: 'cjs',
          entryFileNames: 'index.cjs',
          exports: 'named',
          interop: 'auto'
        }
      ]
    },
    sourcemap: true,
    target: 'esnext',
    minify: false
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
