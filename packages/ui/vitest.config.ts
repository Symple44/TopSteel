import path from 'node:path'
import react from '@vitejs/plugin-react'
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov', 'json-summary'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.tsx',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/**/__mocks__/**',
        'src/**/types.ts',
        'src/test/**',
        'src/index.ts'
      ],
      thresholds: {
        global: { 
          branches: 80, 
          functions: 80, 
          lines: 80, 
          statements: 80 
        },
      },
      clean: true,
      all: true,
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
