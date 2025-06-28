// apps/web/jest.config.cjs - Configuration Jest finale pour TopSteel Web
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  displayName: "TopSteel Web",
  testEnvironment: "jest-environment-jsdom",
  
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@erp/ui/(.*)$": "<rootDir>/../../packages/ui/src/$1",
    "^@erp/types/(.*)$": "<rootDir>/../../packages/types/src/$1",
    "^@erp/utils/(.*)$": "<rootDir>/../../packages/utils/src/$1",
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",
    "^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i": "<rootDir>/__mocks__/fileMock.js",
  },
  
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)",
    "<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)",
  ],
  
  testPathIgnorePatterns: [
    "<rootDir>/node_modules/", 
    "<rootDir>/.next/",
    "<rootDir>/dist/"
  ],
  
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  
  collectCoverageFrom: [
    "src/**/*.(js|jsx|ts|tsx)",
    "!src/**/*.d.ts",
    "!src/**/*.stories.(js|jsx|ts|tsx)",
    "!src/**/__tests__/**",
  ],
  
  testTimeout: 10000,
  verbose: false,
  clearMocks: true,
  restoreMocks: true,
  
  // Configuration spécifique pour éviter les problèmes de cache et de chemins
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",
  passWithNoTests: true
};

module.exports = createJestConfig(customJestConfig);
