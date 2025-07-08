import { dirname } from 'path'
import { fileURLToPath } from 'url'
// packages/config/eslint/next.js - ESLint 9 optimisé TopSteel ERP
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  // Configuration de base ESLint 9
  js.configs.recommended,

  // Next.js avec compatibilité
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('next/typescript'),

  // Configuration globale
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        global: 'readonly',
        NodeJS: 'readonly',
      },
    },
    rules: {
      // Qualité de code stricte TopSteel
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'no-debugger': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],

      // React Hooks strictes
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/rules-of-hooks': 'error',

      // Next.js optimisé
      '@next/next/no-img-element': 'warn',
      '@next/next/no-html-link-for-pages': 'error',

      // Sécurité renforcée
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Performance
      'no-await-in-loop': 'warn',
      'require-atomic-updates': 'error',
    },
  },

  // Configuration spécifique pages Next.js
  {
    files: [
      '**/app/**/*.{js,ts,tsx}',
      '**/src/app/**/*.{js,ts,tsx}',
      '**/pages/**/*.{js,ts,tsx}',
      'next.config.{js,mjs,ts}',
    ],
    rules: {
      'import/no-default-export': 'off',
    },
  },

  // Configuration API routes
  {
    files: ['**/api/**/*.{js,ts}'],
    rules: {
      'no-console': 'off', // Logs nécessaires en API
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Configuration tests
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
