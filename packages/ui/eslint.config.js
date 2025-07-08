import reactConfig from '@erp/config/eslint/react.js'

export default [
  ...reactConfig,

  {
    ignores: ['dist/**', 'storybook-static/**', 'node_modules/**', '.turbo/**'],
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/no-empty-interface': 'off',
    },
  },
]
