// jest.config.js
module.exports = {
  projects: [
    "<rootDir>/apps/web/jest.config.js",
    "<rootDir>/apps/api/jest.config.js",
    "<rootDir>/packages/*/jest.config.js",
  ],
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: [
    "apps/*/src/**/*.{ts,tsx}",
    "packages/*/src/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/dist/**",
    "!**/coverage/**",
    "!**/*.config.{js,ts}",
    "!**/test/**",
    "!**/__tests__/**",
    "!**/__mocks__/**",
  ],
};
