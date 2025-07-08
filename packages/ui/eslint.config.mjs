// packages/ui/eslint.config.mjs - Configuration corrigée avec plugin React
import baseConfig from '@erp/config/eslint/base.js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  ...baseConfig,
  
  {
    // IGNORER COMPLÈTEMENT LES STORIES
    ignores: [
      'dist/**',
      'node_modules/**', 
      '.turbo/**',
      'storybook-static/**',
      '**/*.stories.ts',
      '**/*.stories.tsx',
      '**/stories/**/*',
      'src/stories/**/*',
      'stories/**',
      '*.stories.*',
    ],
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.*'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname || process.cwd(),
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly', 
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        globalThis: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Types et variables
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_' 
      }],
      
      // Console et debugging
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      
      // React rules (maintenant que le plugin est configuré)
      'react/no-array-index-key': 'warn',
      'react/jsx-no-leaked-render': 'warn',
      'react/no-unescaped-entities': 'warn',
      
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Autres règles importantes
      'no-undef': 'error',
    },
  },
]
