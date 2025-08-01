import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'infrastructure/index': 'src/infrastructure/index.ts',
    // 'domains/index': 'src/domains/index.ts', // DEPRECATED: Migré vers @erp/domains
    'ui/index': 'src/ui/index.ts',
    'cross-cutting/index': 'src/cross-cutting/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['@erp/config'],
})
