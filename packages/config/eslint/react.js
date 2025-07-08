// packages/config/eslint/react.js - Configuration ESLint 9 pour React
import jsxA11y from 'eslint-plugin-jsx-a11y'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import baseConfig from './base.js'

export default [
  ...baseConfig,

  // Configuration React
  {
    files: ['**/*.{jsx,tsx}'],
    languageOptions: {
      globals: {
        React: 'readonly',
        JSX: 'readonly',
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Règles React
      'react/prop-types': 'off', // TypeScript gère les props
      'react/react-in-jsx-scope': 'off', // React 17+
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'warn',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'warn',

      // Règles React Hooks (v5.0.0 pour React 19)
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibilité
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',

      // Console autorisée en dev React
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
]
