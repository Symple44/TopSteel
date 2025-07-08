// packages/config/eslint/base.js - Configuration ESLint 9 unifiée pour monorepo
import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'

/**
 * Configuration ESLint centralisée pour TopSteel ERP
 * ✅ Support ESLint 9 + TypeScript 5.5+
 * ✅ Règles cohérentes monorepo
 * ✅ Performance optimisée
 * ✅ Évolutivité garantie
 */
export default [
  // ===== BASE JAVASCRIPT =====
  js.configs.recommended,

  // ===== CONFIGURATION TYPESCRIPT PRINCIPALE =====
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        // ✅ ROBUSTESSE : project conditionnel pour éviter les erreurs de parsing
        project: true,
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        globalThis: 'readonly',
        window: 'readonly',
        document: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // ===== VARIABLES NON UTILISÉES - RÈGLE STRICTE =====
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          // ✅ SOLUTION PRINCIPALE : Convention de nommage pour ignorer
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
          // ✅ ÉVOLUTIVITÉ : Ignore les imports de types
          varsIgnorePattern: '^(_|React$|Component$)',
        },
      ],

      // ===== TYPES TYPESCRIPT STRICTS =====
      '@typescript-eslint/no-explicit-any': [
        'warn',
        {
          fixToUnknown: true,
          ignoreRestArgs: true,
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: false,
        },
      ],

      // ===== INTERFACES ET TYPES =====
      '@typescript-eslint/no-empty-interface': [
        'warn',
        {
          allowSingleExtends: true,
        },
      ],
      '@typescript-eslint/no-namespace': [
        'error',
        {
          allowDeclarations: true,
          allowDefinitionFiles: true,
        },
      ],

      // ===== RÈGLES JAVASCRIPT FONDAMENTALES =====
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error', 'info'],
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off', // Géré par TypeScript
      'object-shorthand': 'error',
      'prefer-template': 'error',
      'no-duplicate-imports': 'error',

      // ===== QUALITÉ DE CODE =====
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        {
          blankLine: 'any',
          prev: ['const', 'let', 'var'],
          next: ['const', 'let', 'var'],
        },
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'any', prev: 'directive', next: 'directive' },
      ],

      // ===== IMPORTS OPTIMISÉS =====
      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        },
      ],
    },
  },

  // ===== CONFIGURATION JAVASCRIPT PUR =====
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': 'warn',
    },
  },

  // ===== FICHIERS DE TEST - CONFIGURATION PERMISSIVE =====
  {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
      '**/test/**/*.{ts,tsx,js,jsx}',
      '**/tests/**/*.{ts,tsx,js,jsx}',
    ],
    languageOptions: {
      parserOptions: {
        project: null, // ✅ PERFORMANCE : Pas de parsing TS strict pour tests
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
        vi: 'readonly',
        vitest: 'readonly',
        global: 'readonly',
      },
    },
    rules: {
      // ✅ DÉVELOPPEMENT : Règles assouplies pour tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
      'prefer-const': 'off',
    },
  },

  // ===== FICHIERS DE CONFIGURATION =====
  {
    files: [
      '*.config.{js,ts,mjs,cjs}',
      '*.setup.{js,ts,mjs}',
      'next.config.{js,mjs,ts}',
      'tailwind.config.{js,ts,mjs}',
      'postcss.config.{js,mjs}',
      'vite.config.{js,ts,mjs}',
      'vitest.config.{js,ts,mjs}',
      'jest.config.{js,ts,mjs,cjs}',
      'turbo.json',
      '.storybook/**/*.{js,ts,mjs}',
      '**/eslint.config.{js,mjs,ts}',
    ],
    languageOptions: {
      parserOptions: {
        project: null, // ✅ PERFORMANCE : Pas de TS strict pour configs
      },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'import/no-default-export': 'off',
      'no-console': 'off',
    },
  },

  // ===== FICHIERS DE TYPES (.d.ts) =====
  {
    files: ['**/*.d.ts'],
    rules: {
      // ✅ SPÉCIALISATION : Règles adaptées aux déclarations de types
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // ✅ ROBUSTESSE : Ignore les paramètres de fonction dans les types
          args: 'after-used',
        },
      ],
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      'import/no-default-export': 'off',
    },
  },

  // ===== STORYBOOK =====
  {
    files: ['.storybook/**/*', '**/*.stories.{ts,tsx,js,jsx}'],
    rules: {
      'import/no-default-export': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },

  // ✅ PRETTIER : DOIT être en dernier pour override les conflits
  prettier,

  // ===== IGNORES GLOBAUX =====
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/storybook-static/**',
      '**/.vscode/**',
      '**/.idea/**',
      '**/tmp/**',
      '**/temp/**',
      '**/*.min.js',
      '**/*.bundle.js',
    ],
  },
]
