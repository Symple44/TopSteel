import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disable DTS
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['@erp/config'],
})
