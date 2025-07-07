/**
 * 🔧 ESLINT CONFIG CORRIGÉ - TopSteel ERP
 * Configuration ESLint simple sans projet TypeScript pour éviter les erreurs
 * Fichier: apps/web/.eslintrc.js
 */

module.exports = {
  extends: [
    "next/core-web-vitals"
  ],
  rules: {
    // Règles personnalisées pour TopSteel ERP
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": "off", // Désactivé car on n'utilise plus @typescript-eslint
    "@next/next/no-img-element": "off"
  },
  env: {
    browser: true,
    es2022: true,
    node: true
  }
}