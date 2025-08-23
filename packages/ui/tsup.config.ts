import { defineConfig } from 'tsup'
import fs from 'fs'
import path from 'path'

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
  dts: {
    only: false,
    resolve: true,
    compilerOptions: {
      preserveSymlinks: true,
      composite: false,
      incremental: false,
    },
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
  },
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
  treeshake: false,
  minify: false,
  bundle: true,
  target: 'esnext',
  platform: 'neutral',
  noExternal: [],
  esbuildOptions(options) {
    options.jsx = 'automatic'
    options.jsxImportSource = 'react'
    options.format = 'esm'
    options.packages = 'external'
    options.keepNames = true
    options.minifyIdentifiers = false
    options.minifySyntax = false
    options.minifyWhitespace = false
  },
  tsconfig: './tsconfig.json',
  onSuccess: async () => {
    // Add "use client" directive to all built JavaScript files
    const distDir = path.resolve('dist')
    
    const addUseClientToFiles = (dir: string) => {
      const files = fs.readdirSync(dir)
      
      for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
          addUseClientToFiles(filePath)
        } else if (file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf-8')
          
          // Check if "use client" is already present at the beginning
          if (!content.match(/^['"]use client['"];?\s*/)) {
            const newContent = `'use client';\n${content}`
            fs.writeFileSync(filePath, newContent, 'utf-8')
          }
        }
      }
    }
    
    if (fs.existsSync(distDir)) {
      addUseClientToFiles(distDir)
      console.log('✅ Added "use client" directive to all JavaScript files')
    }
  },
})
