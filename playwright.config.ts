import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

/**
 * Configuration Playwright pour les tests E2E TopSteel
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  
  // Timeout global pour chaque test
  timeout: 30 * 1000,
  
  // Configuration des attentes
  expect: {
    timeout: 10 * 1000,
  },
  
  // Parallélisation
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  
  // Retry sur échec
  retries: process.env.CI ? 2 : 0,
  
  // Reporter
  reporter: process.env.CI 
    ? [['html'], ['github']] 
    : [['html'], ['list']],
  
  // Configuration globale
  use: {
    // URL de base
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Traces pour debug
    trace: 'on-first-retry',
    
    // Screenshots sur échec
    screenshot: 'only-on-failure',
    
    // Vidéo sur échec
    video: 'retain-on-failure',
    
    // Options de navigation
    navigationTimeout: 15000,
    actionTimeout: 10000,
    
    // Headers par défaut
    extraHTTPHeaders: {
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'fr-FR,fr;q=0.9',
    },
  },

  // Projets pour différents navigateurs
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // Serveur de développement local
  webServer: process.env.CI ? undefined : {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_API_URL: 'http://localhost:4000',
    },
  },

  // Dossier de sortie
  outputDir: 'test-results/',
})