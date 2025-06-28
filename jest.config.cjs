// jest.config.cjs - Configuration finale TopSteel ERP
module.exports = {
  testEnvironment: "node",
  
  // Patterns optimisés pour trouver les tests d'intégration
  testMatch: [
    "<rootDir>/apps/*/src/**/*.integration.test.{js,ts,tsx}",
    "<rootDir>/test/**/*.integration.test.{js,ts}"
  ],
  
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/dist/"
  ],
  
  // Transform TypeScript avec config optimisée
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: "commonjs",
        jsx: "react"
      }
    }]
  },
  
  moduleFileExtensions: ["js", "json", "ts", "tsx"],
  
  // Module mapping pour monorepo
  moduleNameMapper: {
    "^@erp/types/(.*)$": "<rootDir>/packages/types/src/$1",
    "^@erp/utils/(.*)$": "<rootDir>/packages/utils/src/$1",
    "^@erp/ui/(.*)$": "<rootDir>/packages/ui/src/$1"
  },
  
  testTimeout: 30000,
  verbose: true,
  
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: [
    "apps/*/src/**/*.{js,ts,tsx}",
    "!**/*.d.ts",
    "!**/*.{test,spec}.{js,ts,tsx}"
  ],
  
  reporters: ["default"]
};
