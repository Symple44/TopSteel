import nextConfig from "@erp/config/eslint/next.js";

export default [
  ...nextConfig,

  // Dossiers à ignorer
  {
    ignores: [".next/**", "out/**", "node_modules/**", ".turbo/**", "dist/**"],
  },

  // Règles spécifiques à l'app web
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Ajoutez ici vos règles spécifiques
    },
  },
];
