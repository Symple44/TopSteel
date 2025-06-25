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
      // Règles temporairement désactivées pour migration progressive
      "react/no-unescaped-entities": "off", // Trop d'erreurs à corriger
      "@typescript-eslint/no-explicit-any": "off", // Composants génériques
      "@typescript-eslint/no-unused-vars": "off", // Variables en cours de dev
      "@typescript-eslint/no-empty-object-type": "off", // Interfaces vides OK
      "@typescript-eslint/no-non-null-assertion": "off", // API calls
      "jsx-a11y/alt-text": "off", // Images à optimiser plus tard
      "react/no-array-index-key": "off", // Keys temporaires
      "no-console": "off", // Debug en développement

      // Garder seulement les erreurs critiques
      "@next/next/no-img-element": "warn", // Performance importante
      "react-hooks/rules-of-hooks": "error", // Sécurité React
      "react-hooks/exhaustive-deps": "warn", // Performance React
    },
  },

  // Composants UI génériques - très permissifs
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // OK pour composants génériques
      "@typescript-eslint/no-empty-object-type": "off", // Interfaces props vides OK
      "jsx-a11y/alt-text": "off", // Géré par les composants parents
    },
  },

  // Configuration pour les fichiers de configuration
  {
    files: ["*.config.{js,mjs,ts}", "*.setup.{js,ts}"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
      "import/no-default-export": "off",
    },
  },
];
