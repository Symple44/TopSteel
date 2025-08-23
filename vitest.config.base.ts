import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Enable coverage
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'lcov', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      
      // Coverage thresholds
      thresholds: {
        lines: 80,
        functions: 75,
        branches: 70,
        statements: 80,
      },
      
      // Files to include in coverage
      include: [
        'src/**/*.{ts,tsx,js,jsx}',
      ],
      
      // Files to exclude from coverage
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__mocks__/**',
        '**/__tests__/**',
        '**/test/**',
        '**/*.test.*',
        '**/*.spec.*',
        '**/index.{ts,tsx,js,jsx}',
        '**/types/**',
      ],
      
      // Clean coverage before running
      clean: true,
      
      // Skip files with no tests
      skipFull: false,
      
      // Watermarks for coverage reporting
      watermarks: {
        statements: [80, 95],
        functions: [75, 90],
        branches: [70, 85],
        lines: [80, 95],
      },
    },
    
    // Global test configuration
    globals: true,
    environment: 'node',
    
    // Test patterns
    include: [
      '**/*.{test,spec}.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
    ],
    
    // Exclude patterns
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '**/*.config.*',
      '**/mockData/**',
    ],
    
    // Setup files
    setupFiles: ['./vitest.setup.ts'],
    
    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 4,
      },
    },
    
    // Reporter configuration
    reporters: process.env.CI 
      ? ['default', 'junit', 'json'] 
      : ['default', 'verbose'],
    
    // Output file for CI
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json',
    },
    
    // Retry failed tests
    retry: process.env.CI ? 2 : 0,
    
    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,
    
    // Cache
    cache: {
      dir: '.vitest-cache',
    },
    
    // Watch mode configuration
    watch: !process.env.CI,
    
    // Isolate tests for better reliability
    isolate: true,
    
    // Thread configuration
    threads: true,
    
    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@erp/types': path.resolve(__dirname, './packages/types/src'),
      '@erp/utils': path.resolve(__dirname, './packages/utils/src'),
      '@erp/ui': path.resolve(__dirname, './packages/ui/src'),
      '@erp/domains': path.resolve(__dirname, './packages/domains/src'),
      '@erp/api-client': path.resolve(__dirname, './packages/api-client/src'),
    },
  },
});