import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'format/index': 'src/format/index.ts',
    'validation/index': 'src/validation/index.ts',
    'calculation/index': 'src/calculation/index.ts',
    'helpers/index': 'src/helpers/index.ts',
    'constants/index': 'src/constants/index.ts',
    'lib/index': 'src/lib/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: false, // Disabled - will use tsc instead
  clean: true,
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
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
})
