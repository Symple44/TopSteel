import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['cjs'],
  dts: false,
  clean: true,
  sourcemap: true,
  minify: false,
  target: 'node18',
  platform: 'node',

  // NestJS spécifique
  external: [
    '@nestjs/core',
    '@nestjs/common',
    '@nestjs/platform-express',
    'reflect-metadata',
    'rxjs',
  ],

  // Préservation métadonnées pour decorators
  keepNames: true,
  treeshake: false,

  // Gestion assets & ressources
  publicDir: 'public',

  onSuccess: 'echo "✅ API build réussi"',
})
