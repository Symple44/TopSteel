import baseConfig from '@erp/config/eslint/base.js'

export default [
  ...baseConfig,

  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**'],
  },

  // Configuration principale pour les fichiers source
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Configuration spécifique pour les fichiers de test
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: null, // Désactive le parsing avec project pour les tests
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Permet 'any' dans les tests
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
]
