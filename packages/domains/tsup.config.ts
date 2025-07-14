import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'sales/index': 'src/sales/index.ts',
    'production/index': 'src/production/index.ts',
    'cross-cutting/index': 'src/cross-cutting/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['react', 'react-dom'],
})