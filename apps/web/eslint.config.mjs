// apps/web/eslint.config.mjs
import nextConfig from "@erp/config/eslint/next.js";

export default [
  ...nextConfig,

  {
    ignores: [
      ".next/**",
      "out/**", 
      "node_modules/**",
      ".turbo/**",
      "coverage/**",
      "storybook-static/**",
    ],
  },

  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Règles strictes pour la qualité
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // Warnings non-bloquants
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-namespace": "warn",
      "no-useless-catch": "warn",
      
      // Règles désactivées temporairement
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "jsx-a11y/alt-text": "off",
      "react/no-array-index-key": "off",
      "no-console": "off",
    },
  },

  // Composants UI - règles plus souples
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "jsx-a11y/alt-text": "off",
      "@next/next/no-img-element": "off", // OK pour composants UI génériques
    },
  },

  // Tests - règles adaptées
  {
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}", "**/setupTests.ts"],
    rules: {
      "@typescript-eslint/no-namespace": "off", // OK pour extend Jest
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },

  // Configuration files
  {
    files: ["*.config.{js,mjs,ts}", "*.setup.{js,ts}"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "import/no-default-export": "off",
    },
  },
];
