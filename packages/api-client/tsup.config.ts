import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'clients/index': 'src/clients/index.ts',
    'projects/index': 'src/projects/index.ts',
    'quotes/index': 'src/quotes/index.ts',
    'inventory/index': 'src/inventory/index.ts',
    'auth/index': 'src/auth/index.ts',
    'users/index': 'src/users/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: false, // Disabled - will use tsc instead
  clean: true,
  sourcemap: true,
  target: 'es2022',
  external: ['@erp/domains', '@erp/utils', 'axios', 'zod'],
})
