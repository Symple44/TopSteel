// packages/config/eslint/base.js - Configuration ESLint 9 améliorée
import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  // Configuration de base JavaScript recommandée
  js.configs.recommended,

  // Configuration TypeScript principale
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: ["./tsconfig.json"],
      },
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
    },
    rules: {
      // ===== RÈGLES TYPESCRIPT STRICTES =====
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-empty-interface": "warn",
      // Règles strictes supprimées pour éviter les conflits de parsing
      // "@typescript-eslint/prefer-nullish-coalescing": "error",
      // "@typescript-eslint/prefer-optional-chain": "error", 
      // "@typescript-eslint/no-unnecessary-type-assertion": "error",

      // ===== RÈGLES JAVASCRIPT GÉNÉRALES =====
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "off", // Désactivé car géré par TypeScript
      "object-shorthand": "error",
      "prefer-template": "error",
      "no-duplicate-imports": "error",

      // ===== RÈGLES DE STYLE ET QUALITÉ =====
      "padding-line-between-statements": [
        "error",
        { blankLine: "always", prev: "*", next: "return" },
        { blankLine: "always", prev: ["const", "let", "var"], next: "*" },
        { 
          blankLine: "any", 
          prev: ["const", "let", "var"], 
          next: ["const", "let", "var"] 
        },
        { blankLine: "always", prev: "directive", next: "*" },
        { blankLine: "any", prev: "directive", next: "directive" },
      ],
    },
  },

  // Configuration pour fichiers JavaScript purs
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // Configuration pour fichiers de test
  {
    files: [
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "**/__tests__/**/*.{ts,tsx,js,jsx}",
    ],
    languageOptions: {
      parserOptions: {
        project: null, // Pas de parsing TypeScript strict pour les tests
      },
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      // Règles plus laxistes pour les tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "no-console": "off",
    },
  },

  // Configuration pour fichiers de configuration
  {
    files: [
      "*.config.{js,ts,mjs,cjs}",
      "*.setup.{js,ts,mjs}",
      "next.config.{js,mjs,ts}",
      "tailwind.config.{js,ts,mjs}",
      "postcss.config.{js,mjs}",
      ".storybook/**/*.{js,ts,mjs}",
    ],
    languageOptions: {
      parserOptions: {
        project: null, // Pas de parsing TypeScript strict pour configs
      },
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "import/no-default-export": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  // Configuration Prettier (DOIT être en dernier)
  prettier,
];