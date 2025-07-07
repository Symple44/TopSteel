// apps/web/eslint.config.mjs - Configuration ESLint permissive pour développement
import nextConfig from "@erp/config/eslint/next.js";

export default [
  ...nextConfig,

  // Ignorer les dossiers générés et caches
  {
    ignores: [
      ".next/**",
      "out/**", 
      "node_modules/**",
      ".turbo/**",
      "coverage/**",
      "storybook-static/**",
      "dist/**",
      ".vscode/**",
      ".idea/**"
    ],
  },

  // Configuration principale pour les fichiers source
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
    rules: {
      // ===== RÈGLES DE DÉVELOPPEMENT ASSOUPLIES =====
      
      // Variables non utilisées - plus permissif
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }],
      
      // Types any - warnings seulement
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // JSX et React - règles assouplies
      "react/no-unescaped-entities": "off", // Permet les apostrophes
      "react/no-array-index-key": "warn", // Warning au lieu d'erreur
      "jsx-a11y/alt-text": "warn", // Warning pour alt manquant
      
      // Console - permis en développement
      "no-console": "off",
      
      // Hooks React
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // Next.js
      "@next/next/no-img-element": "warn",
      
      // Interface vide - autorisée temporairement
      "@typescript-eslint/no-empty-object-type": "off",
      
      // Type imports - warning seulement
      "@typescript-eslint/consistent-type-imports": ["warn", {
        "prefer": "type-imports",
        "fixStyle": "separate-type-imports"
      }],
    },
  },

  // Configuration spécifique pour les composants UI
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "jsx-a11y/alt-text": "off",
      "@next/next/no-img-element": "off",
    },
  },

  // Configuration ULTRA-PERMISSIVE pour les tests
  {
    files: [
      "**/__tests__/**/*.{ts,tsx,js,jsx}",
      "**/*.test.{ts,tsx,js,jsx}",
      "**/*.spec.{ts,tsx,js,jsx}",
      "src/__tests__/**/*.{ts,tsx,js,jsx}",
      "src/components/__tests__/**/*.{ts,tsx,js,jsx}",
      "**/setupTests.{ts,js}",
      "**/test-setup.{ts,js}",
      "**/jest.config.{js,ts,mjs,cjs}",
      "**/vitest.config.{js,ts,mjs}"
    ],
    languageOptions: {
      parserOptions: {
        project: null, // Pas de parsing TypeScript pour tests
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
        global: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        console: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        location: "readonly"
      }
    },
    rules: {
      // TOUTES LES RÈGLES DÉSACTIVÉES POUR LES TESTS
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-console": "off",
      "import/no-extraneous-dependencies": "off",
      "react-hooks/rules-of-hooks": "off",
      "react/no-unescaped-entities": "off",
      "jsx-a11y/alt-text": "off",
    },
  },

  // Configuration pour les fichiers de configuration
  {
    files: [
      "*.config.{js,mjs,ts,cjs}",
      "*.setup.{js,ts,mjs}",
      "next.config.{js,mjs,ts}",
      "tailwind.config.{js,ts,mjs}",
      "postcss.config.{js,mjs}",
      ".storybook/**/*.{js,ts,mjs}"
    ],
    languageOptions: {
      parserOptions: {
        project: null,
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
];
