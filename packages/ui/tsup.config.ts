import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'hooks/index': 'src/hooks/index.ts',
    'primitives/index': 'src/components/primitives/index.ts',
    'layout/index': 'src/components/layout/index.ts',
    'forms/index': 'src/components/forms/index.ts',
    'data-display/index': 'src/components/data-display/index.ts',
    'feedback/index': 'src/components/feedback/index.ts',
    'navigation/index': 'src/components/navigation/index.ts',
    'business/index': 'src/components/business/index.ts',
    'theme/index': 'src/components/theme/index.ts',
  },
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    /^@radix-ui\/.*/,
    'clsx',
    'tailwind-merge',
    'lucide-react',
    'class-variance-authority',
    'next-themes',
  ],
  treeshake: true,
  minify: false,
  target: 'esnext',
  platform: 'neutral',
  noExternal: [],
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = 'react'
    options.format = 'esm'
    options.packages = 'external'
  },
  tsconfig: './tsconfig.json',
})
