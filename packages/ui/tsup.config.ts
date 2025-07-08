import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  minify: false,
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom'],
  tsconfig: './tsconfig.json',
  outDir: 'dist',
  target: 'es2020',
  platform: 'neutral',

  // Banner pour compatibilité client React
  banner: {
    js: '"use client";',
  },

  // Gestion des erreurs gracieuse
  skipNodeModulesBundle: true,

  // Pas de validation stricte au build
  onSuccess: 'echo "✅ Build UI réussi"',
})
