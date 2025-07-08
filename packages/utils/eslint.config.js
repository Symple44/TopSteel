import baseConfig from '@erp/config/eslint/base.js'

export default [
  ...baseConfig,
  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        // Environnement Node.js
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        NodeJS: 'readonly',

        // Environnement Browser
        window: 'readonly',
        document: 'readonly',

        // Communs
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': 'off',
    },
  },
]
