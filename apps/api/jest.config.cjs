// apps/api/jest.config.cjs - Configuration Jest moderne pour TopSteel API
module.exports = {
  displayName: 'TopSteel API',
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './',

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.ts',
    '<rootDir>/src/**/*.{test,spec}.ts',
    '<rootDir>/test/**/*.{test,spec}.ts',
  ],

  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Configuration ts-jest moderne (pas de globals deprecated)
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
        },
      },
    ],
  },

  moduleFileExtensions: ['js', 'json', 'ts'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.{test,spec}.ts',
    '!src/main.ts',
  ],

  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  coverageDirectory: 'coverage',
  testTimeout: 30000,
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,
}
