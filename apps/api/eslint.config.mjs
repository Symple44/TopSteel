// apps/api/eslint.config.js - Configuration ESLint corrigée pour NestJS
import baseConfig from "@erp/config/eslint/base.js";

export default [
  ...baseConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**", "coverage/**"]
  },
  
  // Configuration principale pour les fichiers source NestJS
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"]
      },
      globals: {
        // Globales Node.js essentielles
        global: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        // Globales pour timers
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
        clearImmediate: "readonly",
        // Console
        console: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "@typescript-eslint/consistent-type-imports": ["error", { 
        prefer: "type-imports",
        fixStyle: "separate-type-imports"
      }],
      // Règles spécifiques NestJS
      "@typescript-eslint/no-empty-function": "off", // Constructeurs vides NestJS
      "@typescript-eslint/no-inferrable-types": "off", // Types explicites pour clarté
      "@typescript-eslint/no-var-requires": "off", // Pour require conditionnel
      // Règles pour Node.js
      "no-undef": "error", // Garder pour éviter les vraies erreurs
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
      "no-useless-escape": "error",
      "no-empty": "error"
    }
  },

  // Configuration spécifique pour TOUS les fichiers de test
  {
    files: [
      "test/**/*.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "src/__tests__/**/*.{ts,tsx}"
    ],
    languageOptions: {
      parserOptions: {
        project: null, // Désactive le parsing avec project pour les tests
      },
      globals: {
        // Globales Jest/Testing
        describe: "readonly",
        it: "readonly", 
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly",
        test: "readonly",
        // Globales Node.js pour les tests
        global: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Permet 'any' dans les tests
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "no-undef": "off", // Désactiver pour les tests
      "no-console": "off" // Permettre console dans les tests
    }
  },

  // Configuration pour les fichiers JavaScript (comme eslint.config.js)
  {
    files: ["*.{js,mjs,cjs}", "scripts/**/*.{js,mjs,cjs}"],
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
        exports: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "no-undef": "error"
    }
  }
];