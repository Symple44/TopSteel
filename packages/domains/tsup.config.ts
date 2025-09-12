import { defineConfig } from 'tsup'

export default defineConfig({
  // Skip DTS in tsup - use tsc for declarations to avoid memory issues
  dts: false,
  entry: {
    index: 'src/index.ts',
    server: 'src/server.ts',
    'core/index': 'src/core/index.ts',
    'sales/index': 'src/sales/index.ts',
    'production/index': 'src/production/index.ts',
    'cross-cutting/index': 'src/cross-cutting/index.ts',
    'search/index': 'src/search/index.ts',
    'image/index': 'src/image/index.ts',
  },
  format: ['cjs', 'esm'],
  clean: true,
  sourcemap: process.env.NODE_ENV !== 'production',
  minify: process.env.NODE_ENV === 'production',
  target: 'es2022',
  external: [
    'react',
    'react-dom',
    '@elastic/elasticsearch',
    '@elastic/transport',
    'apache-arrow',
    'sharp',
    /^@img\//,
    'fs',
    'path',
    'crypto',
    'util',
    'stream',
    'buffer',
    'os',
    'worker_threads',
    'child_process',
  ],
  // Configuration spécifique pour éviter les problèmes avec Sharp
  noExternal: [],
  splitting: false,
  // Configuration pour exclure Sharp du bundle
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})
