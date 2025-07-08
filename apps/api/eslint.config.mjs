// apps/api/eslint.config.mjs - Configuration ESLint permissive pour NestJS
import baseConfig from '@erp/config/eslint/base.js'

export default [
  ...baseConfig,

  {
    ignores: ['dist/**', 'node_modules/**', '.turbo/**', 'coverage/**', 'test-results/**'],
  },

  // Configuration principale pour les fichiers source NestJS
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
      },
    },
    rules: {
      // ===== RÈGLES ASSOUPLIES POUR DÉVELOPPEMENT =====

      // Variables non utilisées - warnings seulement
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // Types - warnings au lieu d'erreurs
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // Type imports - warning seulement
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],

      // Règles spécifiques NestJS - permissives
      '@typescript-eslint/no-empty-function': 'off', // Constructeurs vides OK
      '@typescript-eslint/no-inferrable-types': 'off', // Types explicites OK
      '@typescript-eslint/no-empty-object-type': 'off', // Interfaces vides OK

      // Console permis en développement
      'no-console': 'off',

      // Imports
      'import/no-extraneous-dependencies': 'off', // Permis pour dev
    },
  },

  // Configuration ULTRA-PERMISSIVE pour les tests
  {
    files: [
      'test/**/*.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      '**/__tests__/**/*.{ts,tsx}',
      '**/setupTests.{ts,js}',
      '**/jest.config.{js,ts,mjs,cjs}',
      'e2e/**/*.{ts,tsx}',
    ],
    languageOptions: {
      parserOptions: {
        project: null, // Pas de parsing TypeScript pour tests
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        global: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // TOUTES LES RÈGLES DÉSACTIVÉES POUR LES TESTS
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-console': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },

  // Configuration pour les fichiers de configuration
  {
    files: ['*.config.{js,mjs,ts,cjs}', '*.setup.{js,ts,mjs}'],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'import/no-default-export': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
]
