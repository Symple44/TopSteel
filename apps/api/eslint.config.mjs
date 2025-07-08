// apps/api/eslint.config.mjs - Configuration spécifique NestJS
export default [
  {
    files: ['src/**/*.{ts}'],
    rules: {
      // Règles spécifiques NestJS
      '@typescript-eslint/no-empty-function': 'off', // Constructeurs vides OK
      '@typescript-eslint/no-inferrable-types': 'off', // Types explicites OK
      '@typescript-eslint/no-empty-object-type': 'off', // Interfaces vides OK

      // Imports NestJS
      'import/no-extraneous-dependencies': 'off',
    },
  },

  // Configuration pour les tests NestJS
  {
    files: ['test/**/*.{ts}', 'src/**/*.spec.{ts}', 'e2e/**/*.{ts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
]
