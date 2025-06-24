import baseConfig from "@erp/config/eslint/base.js";

export default [
  ...baseConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"]
  },
  
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
