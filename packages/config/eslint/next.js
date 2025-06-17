// packages/config/eslint/nextjs.js - Configuration ESLint 9.x pour Next.js
import baseConfig from "./base.js";

export default [
  ...baseConfig,

  // Configuration spécifique Next.js
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        React: "readonly",
        JSX: "readonly",
      },
    },
    rules: {
      // Règles Next.js
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-img-element": "warn",
      "@next/next/no-sync-scripts": "error",
      "@next/next/no-title-in-document-head": "error",

      // Règles React
      "react/react-in-jsx-scope": "off", // Next.js auto-import React
      "react/prop-types": "off", // TypeScript gère les props
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Désactiver les règles conflictuelles
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },

  // Configuration pour les fichiers de pages Next.js
  {
    files: ["**/pages/**/*.{js,ts,tsx}", "**/app/**/*.{js,ts,tsx}"],
    rules: {
      "import/no-default-export": "off", // Les pages Next.js nécessitent des exports par défaut
    },
  },
];
