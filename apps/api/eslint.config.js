import nodeConfig from "@erp/config/eslint/node.js";

export default [
  ...nodeConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**", "coverage/**"]
  },
  
  {
    files: ["src/**/*.{ts,js}", "test/**/*.{ts,js}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/explicit-function-return-type": "off"
    }
  }
];
