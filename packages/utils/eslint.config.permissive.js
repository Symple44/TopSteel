import baseConfig from "@erp/config/eslint/base.js";

export default [
  ...baseConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"]
  },
  
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        // Toutes les globales communes
        ...Object.fromEntries([
          'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
          'window', 'document', 'localStorage', 'sessionStorage',
          'process', 'Buffer', 'console', 'Promise', 'globalThis'
        ].map(name => [name, 'readonly']))
      }
    },
    rules: {
      // Règles permissives pour le développement
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn", 
      "no-console": "off", // Désactiver temporairement
      "no-undef": "error" // Garder pour éviter les vraies erreurs
    }
  }
];
