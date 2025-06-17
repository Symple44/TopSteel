// packages/config/eslint/next.js - Configuration ESLint 9 pour Next.js 15
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import reactConfig from "./react.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...reactConfig,

  // Configuration Next.js avec FlatCompat pour la compatibilité
  ...compat.extends("next/core-web-vitals"),
  ...compat.extends("next/typescript"),

  // Configuration spécifique Next.js
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Règles Next.js
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "error",

      // Pages Next.js nécessitent default export
      "import/no-default-export": "off",
    },
  },

  // Configuration pour les pages Next.js
  {
    files: [
      "**/app/**/*.{js,ts,tsx}",
      "**/src/app/**/*.{js,ts,tsx}",
      "**/pages/**/*.{js,ts,tsx}",
      "next.config.{js,mjs,ts}",
    ],
    rules: {
      "import/no-default-export": "off",
      "@typescript-eslint/no-var-requires": "off", // next.config.js
    },
  },
];
