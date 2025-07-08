// apps/web/.eslintrc.js - Configuration optimisée TopSteel Web
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ['@erp/config/eslint/next'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
  rules: {
    // Règles spécifiques app web TopSteel
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',

    // Import organization
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
        },
      },
    ],
  },
  overrides: [
    {
      files: ['src/components/**/*.{ts,tsx}'],
      rules: {
        // Composants UI stricts
        'react/jsx-no-leaked-render': 'error',
        'react/no-array-index-key': 'warn',
      },
    },
  ],
}
