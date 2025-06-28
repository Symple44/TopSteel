import baseConfig from "@erp/config/eslint/base.js";

export default [
  ...baseConfig,
  
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"]
  },
  
  // Configuration principale pour les fichiers source NestJS
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"]
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_" 
      }],
      // Règles spécifiques NestJS
      "@typescript-eslint/no-empty-function": "off", // Constructeurs vides NestJS
      "@typescript-eslint/no-inferrable-types": "off" // Types explicites pour clarté
    }
  },

  // Configuration spécifique pour les fichiers de test
  {
    files: ["test/**/*.{ts,tsx}", "src/**/*.spec.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: null,
      },
      globals: {
        describe: "readonly",
        it: "readonly", 
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        jest: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off"
    }
  }
];
