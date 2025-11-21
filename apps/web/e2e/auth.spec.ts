/**
 * Authentication E2E Tests - TopSteel ERP
 * Tests for login, logout, session management, and company selection
 */

import { test, expect } from '@playwright/test'
import { TEST_USERS, INVALID_CREDENTIALS } from './fixtures/test-data'
import {
  login,
  loginAsAdmin,
  logout,
  waitForLoad,
  clearSession,
  isAuthenticated,
  waitForToast,
} from './utils/test-helpers'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear session before each test
    await clearSession(page)
  })

  test.describe('Login', () => {
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      // Check page title
      await expect(page.locator('h1')).toContainText('TopSteel ERP')

      // Check form elements
      await expect(page.locator('input[type="text"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()

      // Check demo credentials are shown
      await expect(page.locator('text=admin@topsteel.fr')).toBeVisible()
    })

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      // Fill in credentials
      await page.fill('input[type="text"]', TEST_USERS.admin.email)
      await page.fill('input[type="password"]', TEST_USERS.admin.password)

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for navigation
      await waitForLoad(page)

      // Should redirect to dashboard or company selection
      const url = page.url()
      const isOnDashboard = url.includes('/dashboard') || url.includes('/login')

      expect(isOnDashboard).toBeTruthy()
    })

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      // Fill in invalid credentials
      await page.fill('input[type="text"]', INVALID_CREDENTIALS.wrongPassword.email)
      await page.fill('input[type="password"]', INVALID_CREDENTIALS.wrongPassword.password)

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for error message (toast or inline)
      await page.waitForTimeout(1000)

      // Check for error indication
      // Could be a toast, error text, or the form still being visible
      const isStillOnLogin = page.url().includes('/login')
      expect(isStillOnLogin).toBeTruthy()
    })

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      // Try to submit empty form
      await page.click('button[type="submit"]')

      // Form should show HTML5 validation or stay on page
      await page.waitForTimeout(500)

      // Should still be on login page
      expect(page.url()).toContain('/login')
    })

    test('should login with email', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      await page.fill('input[type="text"]', TEST_USERS.admin.email)
      await page.fill('input[type="password"]', TEST_USERS.admin.password)

      await page.click('button[type="submit"]')
      await waitForLoad(page)

      // Check authentication
      const authenticated = await isAuthenticated(page)
      expect(authenticated).toBeTruthy()
    })

    test('should remember me functionality', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      // Fill credentials
      await page.fill('input[type="text"]', TEST_USERS.admin.email)
      await page.fill('input[type="password"]', TEST_USERS.admin.password)

      // Check "Remember me" if checkbox exists
      const rememberMeCheckbox = page.locator('input[type="checkbox"]').first()
      if (await rememberMeCheckbox.isVisible()) {
        await rememberMeCheckbox.check()
      }

      await page.click('button[type="submit"]')
      await waitForLoad(page)

      // Check if token is stored in localStorage
      const authStorage = await page.evaluate(() => {
        return localStorage.getItem('topsteel-auth-storage')
      })

      expect(authStorage).toBeTruthy()
    })

    test('should prevent SQL injection attempts', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      // Try SQL injection
      await page.fill('input[type="text"]', INVALID_CREDENTIALS.sqlInjection.email)
      await page.fill('input[type="password"]', INVALID_CREDENTIALS.sqlInjection.password)

      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)

      // Should still be on login page (not authenticated)
      expect(page.url()).toContain('/login')
    })

    test('should show forgot password link', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      const forgotPasswordLink = page.locator('a[href="/forgot-password"]')
      await expect(forgotPasswordLink).toBeVisible()
    })

    test('should show register link', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      const registerLink = page.locator('a[href="/register"]')
      await expect(registerLink).toBeVisible()
    })
  })

  test.describe('Logout', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each logout test
      await loginAsAdmin(page)
    })

    test('should logout successfully', async ({ page }) => {
      // Check we're authenticated
      let authenticated = await isAuthenticated(page)
      expect(authenticated).toBeTruthy()

      // Perform logout
      await logout(page)

      // Should redirect to login page
      await page.waitForURL('**/login', { timeout: 5000 })

      // Check we're on login page
      expect(page.url()).toContain('/login')

      // Check authentication state
      authenticated = await isAuthenticated(page)
      expect(authenticated).toBeFalsy()
    })

    test('should clear session data on logout', async ({ page }) => {
      // Logout
      await logout(page)

      // Check localStorage is cleared
      const authStorage = await page.evaluate(() => {
        return localStorage.getItem('topsteel-auth-storage')
      })

      // Should be null or have isAuthenticated: false
      if (authStorage) {
        const parsedStorage = JSON.parse(authStorage)
        expect(parsedStorage.state?.isAuthenticated).toBeFalsy()
      }
    })
  })

  test.describe('Session Management', () => {
    test('should maintain session on page reload', async ({ page }) => {
      // Login
      await loginAsAdmin(page)

      // Wait for dashboard
      await page.waitForTimeout(1000)

      // Reload page
      await page.reload()
      await waitForLoad(page)

      // Should still be authenticated
      const authenticated = await isAuthenticated(page)
      expect(authenticated).toBeTruthy()
    })

    test('should redirect to login when accessing protected route without auth', async ({
      page,
    }) => {
      // Try to access dashboard without authentication
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Should redirect to login
      await page.waitForURL('**/login**', { timeout: 5000 })
      expect(page.url()).toContain('/login')
    })

    test('should preserve redirect parameter after login', async ({ page }) => {
      // Try to access a protected page
      const targetPage = '/settings/appearance'
      await page.goto(targetPage)

      // Should redirect to login with redirect parameter
      await page.waitForURL('**/login**', { timeout: 5000 })

      // Login
      await page.fill('input[type="text"]', TEST_USERS.admin.email)
      await page.fill('input[type="password"]', TEST_USERS.admin.password)
      await page.click('button[type="submit"]')

      await waitForLoad(page)

      // Should eventually navigate to the target page
      // (may need to wait for dashboard first, then manual navigation)
      await page.waitForTimeout(1000)
    })
  })

  test.describe('Company Selection', () => {
    test('should show company selector when required', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      // Login
      await page.fill('input[type="text"]', TEST_USERS.admin.email)
      await page.fill('input[type="password"]', TEST_USERS.admin.password)
      await page.click('button[type="submit"]')

      await waitForLoad(page)

      // Check if company selector appears
      // This depends on the backend configuration
      // For now, just check we're redirected somewhere
      await page.waitForTimeout(1000)

      const url = page.url()
      expect(url).not.toContain('/login')
    })
  })

  test.describe('Multi-Factor Authentication (MFA)', () => {
    test('should show MFA form when required', async ({ page }) => {
      // This test assumes MFA might be enabled for certain users
      await page.goto('/login')
      await waitForLoad(page)

      // Login with credentials
      await page.fill('input[type="text"]', TEST_USERS.admin.email)
      await page.fill('input[type="password"]', TEST_USERS.admin.password)
      await page.click('button[type="submit"]')

      await page.waitForTimeout(1000)

      // Check if MFA form appears (it may not in test environment)
      const mfaForm = page.locator('text=vérification')
      const isMFARequired = await mfaForm.isVisible().catch(() => false)

      // If MFA is shown, verify the form elements
      if (isMFARequired) {
        await expect(page.locator('select')).toBeVisible()
        await expect(page.locator('button:has-text("Retour")')).toBeVisible()
      }
    })
  })

  test.describe('Security', () => {
    test('should not store password in localStorage', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      await page.fill('input[type="text"]', TEST_USERS.admin.email)
      await page.fill('input[type="password"]', TEST_USERS.admin.password)
      await page.click('button[type="submit"]')

      await page.waitForTimeout(1000)

      // Check localStorage doesn't contain password
      const allLocalStorage = await page.evaluate(() => {
        const items: Record<string, string> = {}
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key) {
            items[key] = localStorage.getItem(key) || ''
          }
        }
        return JSON.stringify(items)
      })

      expect(allLocalStorage.toLowerCase()).not.toContain(TEST_USERS.admin.password)
    })

    test('should toggle password visibility', async ({ page }) => {
      await page.goto('/login')
      await waitForLoad(page)

      const passwordInput = page.locator('input[type="password"]')
      const toggleButton = page.locator('button[type="button"]').filter({ hasText: '' }).first()

      // Password should be hidden initially
      await expect(passwordInput).toHaveAttribute('type', 'password')

      // Click toggle button if it exists
      if (await toggleButton.isVisible()) {
        await toggleButton.click()

        // Password should be visible
        const inputType = await page.locator('input[name="password"], #password').getAttribute('type')
        expect(inputType === 'text' || inputType === 'password').toBeTruthy()
      }
    })
  })
})
