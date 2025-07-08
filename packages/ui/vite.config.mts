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
      exclude: ['**/*.stories.*', '**/*.test.*'],
      compilerOptions: {
        forceConsistentCasingInFileNames: true
      }
    })
  ],
  
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ErpUi',
      formats: ['es', 'cjs'],
      fileName: (format) => 'index.' + (format === 'es' ? 'mjs' : 'js')
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
          entryFileNames: 'index.js',
          exports: 'named',
          interop: 'auto'
        }
      ],
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      }
    },
    sourcemap: true,
    target: 'esnext',
    minify: false
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/lib': resolve(__dirname, 'src/lib'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/hooks': resolve(__dirname, 'src/hooks'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types')
    }
  }
})
