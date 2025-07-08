import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  splitting: false,
  treeshake: true,
  target: 'es2022',
  platform: 'neutral',

  // Configuration TypeScript optimisée
  tsconfig: './tsconfig.json',

  // Dossier de sortie
  outDir: 'dist',

  // Pas de validation TypeScript par tsup (fait par type-check séparément)
  skipNodeModulesBundle: true,

  // Messages de succès
  onSuccess: 'echo "✅ @erp/utils build réussi"',

  // Gestion d'erreurs gracieuse
  onFailure: 'echo "❌ @erp/utils build échoué"',
})
