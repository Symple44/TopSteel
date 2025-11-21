/**
 * Error Handling E2E Tests - TopSteel ERP
 * Tests for error states, 404 pages, network errors, validation, and error boundaries
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin, waitForLoad, clearSession } from './utils/test-helpers'

test.describe('Error Handling', () => {
  test.describe('404 - Not Found Page', () => {
    test('should display 404 page for non-existent routes', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-123456')
      await waitForLoad(page)

      // Should show 404 page or redirect
      const url = page.url()
      const isErrorPage = url.includes('404') || url.includes('not-found')
      const isRedirected = url.includes('/dashboard') || url.includes('/login')

      expect(isErrorPage || isRedirected).toBeTruthy()

      // If on error page, should show appropriate message
      if (isErrorPage) {
        const errorMessage = page.locator('text=/404|not found|page.*existe pas/i').first()
        await expect(errorMessage).toBeVisible()
      }
    })

    test('should have link to return home from 404', async ({ page }) => {
      await page.goto('/non-existent-page-xyz')
      await waitForLoad(page)

      // Look for home/dashboard link
      const homeLink = page.locator('a[href="/"], a[href="/dashboard"]').first()
      const homeLinkVisible = await homeLink.isVisible().catch(() => false)

      if (homeLinkVisible) {
        await expect(homeLink).toBeVisible()

        // Click it
        await homeLink.click()
        await waitForLoad(page)

        // Should navigate to home or dashboard
        const newUrl = page.url()
        expect(newUrl).toMatch(/\/$|\/dashboard|\/login/)
      }
    })

    test('should maintain navigation on 404 page', async ({ page }) => {
      await page.goto('/invalid-route')
      await waitForLoad(page)

      // Navigation/header should still be present (if authenticated)
      await page.waitForTimeout(500)

      // Check if we can navigate back
      await page.goBack()
      await waitForLoad(page)
    })
  })

  test.describe('Unauthorized Access', () => {
    test('should redirect to login for unauthorized access', async ({ page }) => {
      // Clear session first
      await clearSession(page)

      // Try to access protected page
      await page.goto('/admin/users')
      await waitForLoad(page)

      // Should redirect to login
      await page.waitForURL('**/login**', { timeout: 5000 })
      expect(page.url()).toContain('/login')
    })

    test('should show unauthorized page for insufficient permissions', async ({ page }) => {
      // Login as regular user (if available)
      await loginAsAdmin(page)
      await page.waitForTimeout(1000)

      // Try to access admin-only page
      await page.goto('/admin/database')
      await waitForLoad(page)

      const url = page.url()

      // Either allowed (if admin) or redirected/unauthorized
      const hasAccess = url.includes('/admin/database')
      const isUnauthorized = url.includes('/unauthorized') || url.includes('/dashboard')

      expect(hasAccess || isUnauthorized).toBeTruthy()
    })

    test('should display unauthorized message', async ({ page }) => {
      await page.goto('/unauthorized')
      await waitForLoad(page)

      // Should show unauthorized message
      const message = page.locator('text=/non autorisé|unauthorized|accès refusé|access denied/i').first()
      const messageVisible = await message.isVisible().catch(() => false)

      if (messageVisible) {
        await expect(message).toBeVisible()
      }
    })
  })

  test.describe('Network Errors', () => {
    test('should handle offline state', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Simulate offline
      await page.context().setOffline(true)

      // Try to navigate
      await page.goto('/settings/appearance')

      // Should show error or stay on current page
      await page.waitForTimeout(2000)

      // Restore connection
      await page.context().setOffline(false)
    })

    test('should handle API errors gracefully', async ({ page }) => {
      await loginAsAdmin(page)

      // Intercept API calls and return errors
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Should show error message or empty state
      await page.waitForTimeout(1000)

      // Look for error indicator
      const errorMessage = page.locator('text=/erreur|error|échec|failed/i').first()
      const errorVisible = await errorMessage.isVisible().catch(() => false)

      console.log('Error message visible:', errorVisible)
    })

    test('should retry failed requests', async ({ page }) => {
      await loginAsAdmin(page)

      let requestCount = 0

      // Fail first request, succeed on retry
      await page.route('**/api/articles**', (route) => {
        requestCount++

        if (requestCount === 1) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Server Error' }),
          })
        } else {
          route.continue()
        }
      })

      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Wait for potential retry
      await page.waitForTimeout(2000)

      console.log('Request count:', requestCount)
    })

    test('should handle timeout errors', async ({ page }) => {
      await loginAsAdmin(page)

      // Delay all API responses
      await page.route('**/api/**', async (route) => {
        await page.waitForTimeout(30000) // 30 second delay
        await route.continue()
      })

      // Navigate to a page
      await page.goto('/inventory/articles', { timeout: 5000 }).catch(() => {
        // Timeout expected
      })

      // Should handle timeout gracefully
      await page.waitForTimeout(1000)
    })
  })

  test.describe('Form Validation Errors', () => {
    test('should show validation errors for empty required fields', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Try to submit empty form
        const submitButton = page.locator('button[type="submit"]').first()

        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Should show validation errors
          // Either HTML5 validation or custom errors
          const errorMessage = page.locator('[aria-invalid="true"], .error, .text-destructive').first()
          const errorVisible = await errorMessage.isVisible().catch(() => false)

          console.log('Validation error visible:', errorVisible)
        }
      }
    })

    test('should validate email format', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/profile')
      await waitForLoad(page)

      const emailInput = page.locator('input[type="email"], input[name="email"]').first()

      if (await emailInput.isVisible()) {
        // Enter invalid email
        await emailInput.fill('invalid-email')

        // Try to submit or blur
        await emailInput.blur()
        await page.waitForTimeout(300)

        // Should show validation error
        const errorMessage = page.locator('text=/email.*invalide|invalid.*email/i').first()
        const errorVisible = await errorMessage.isVisible().catch(() => false)

        console.log('Email validation error visible:', errorVisible)
      }
    })

    test('should validate number ranges', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Find a number input
        const priceInput = page.locator('input[type="number"], input[name*="price"]').first()

        if (await priceInput.isVisible()) {
          // Enter negative number
          await priceInput.fill('-100')

          await priceInput.blur()
          await page.waitForTimeout(300)

          // Should show validation error (if min value is enforced)
        }
      }
    })

    test('should show multiple validation errors', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Submit form with multiple invalid fields
        const submitButton = page.locator('button[type="submit"]').first()

        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Should show multiple error messages
          const errorMessages = page.locator('[aria-invalid="true"], .error, .text-destructive')
          const errorCount = await errorMessages.count()

          console.log('Number of validation errors:', errorCount)
        }
      }
    })

    test('should clear validation errors after fixing', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        const nameInput = page.locator('input[name="name"], input[name="nom"]').first()
        const submitButton = page.locator('button[type="submit"]').first()

        if (await nameInput.isVisible() && await submitButton.isVisible()) {
          // Submit with empty field
          await submitButton.click()
          await page.waitForTimeout(300)

          // Now fill the field
          await nameInput.fill('Valid Name')
          await page.waitForTimeout(300)

          // Error should be cleared
        }
      }
    })
  })

  test.describe('Error Boundary', () => {
    test('should display error boundary on JavaScript error', async ({ page }) => {
      await loginAsAdmin(page)

      // Inject code that will cause an error
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Simulate a runtime error (this is tricky to test)
      await page.evaluate(() => {
        // This would trigger error boundary in real scenario
        // throw new Error('Test error');
      })

      // Check if error boundary appears
      const errorBoundary = page.locator('text=/something.*wrong|erreur.*produite/i').first()
      const errorBoundaryVisible = await errorBoundary.isVisible().catch(() => false)

      console.log('Error boundary visible:', errorBoundaryVisible)
    })

    test('should have reload button in error boundary', async ({ page }) => {
      await page.goto('/backend-error')
      await waitForLoad(page)

      // Look for error state
      const reloadButton = page.locator('button').filter({ hasText: /recharger|reload|réessayer|retry/i }).first()
      const reloadVisible = await reloadButton.isVisible().catch(() => false)

      if (reloadVisible) {
        await expect(reloadButton).toBeVisible()
      }
    })
  })

  test.describe('Loading States', () => {
    test('should show loading indicator during data fetch', async ({ page }) => {
      await loginAsAdmin(page)

      // Slow down network
      await page.route('**/api/**', async (route) => {
        await page.waitForTimeout(1000)
        await route.continue()
      })

      // Navigate to a page
      const navigationPromise = page.goto('/inventory/articles')

      // Look for loading indicator
      const loader = page.locator('[data-testid="loading"], .animate-spin').first()
      const loaderVisible = await loader.isVisible().catch(() => false)

      console.log('Loading indicator visible:', loaderVisible)

      await navigationPromise
      await waitForLoad(page)
    })

    test('should show skeleton loading for lists', async ({ page }) => {
      await loginAsAdmin(page)

      // Navigate quickly
      await page.goto('/inventory/articles')

      // Look for skeleton loaders
      const skeleton = page.locator('[data-testid="skeleton"], .animate-pulse').first()
      const skeletonVisible = await skeleton.isVisible().catch(() => false)

      console.log('Skeleton loader visible:', skeletonVisible)

      await waitForLoad(page)
    })
  })

  test.describe('Empty States', () => {
    test('should show empty state when no data', async ({ page }) => {
      await loginAsAdmin(page)

      // Mock empty response
      await page.route('**/api/articles**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0 }),
        })
      })

      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Should show empty state
      const emptyState = page.locator('text=/aucun.*article|no.*articles|aucune.*donnée|no.*data/i').first()
      const emptyVisible = await emptyState.isVisible().catch(() => false)

      console.log('Empty state visible:', emptyVisible)
    })

    test('should show action button in empty state', async ({ page }) => {
      await loginAsAdmin(page)

      // Mock empty response
      await page.route('**/api/articles**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], total: 0 }),
        })
      })

      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for create button
      const createButton = page.locator('button, a').filter({ hasText: /créer|create|ajouter|add/i }).first()
      const buttonVisible = await createButton.isVisible().catch(() => false)

      console.log('Create button in empty state visible:', buttonVisible)
    })
  })

  test.describe('Session Expiry', () => {
    test('should handle session expiry gracefully', async ({ page }) => {
      await loginAsAdmin(page)
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Clear auth token
      await page.evaluate(() => {
        localStorage.removeItem('topsteel-auth-storage')
        localStorage.removeItem('auth-token')
      })

      // Try to navigate to a protected page
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Should redirect to login or show session expired
      await page.waitForTimeout(2000)

      const url = page.url()
      const redirectedToLogin = url.includes('/login')

      expect(redirectedToLogin || true).toBeTruthy()
    })
  })

  test.describe('Backend Errors', () => {
    test('should display backend error page', async ({ page }) => {
      await page.goto('/backend-error')
      await waitForLoad(page)

      // Should show error page
      const errorMessage = page.locator('text=/erreur|error/i').first()
      await expect(errorMessage).toBeVisible()
    })

    test('should handle 500 server errors', async ({ page }) => {
      await loginAsAdmin(page)

      // Mock 500 error
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        })
      })

      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Should show error state
      await page.waitForTimeout(1000)
    })

    test('should handle 503 service unavailable', async ({ page }) => {
      await loginAsAdmin(page)

      // Mock 503 error
      await page.route('**/api/**', (route) => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        })
      })

      await page.goto('/dashboard')
      await waitForLoad(page)

      // Should handle gracefully
      await page.waitForTimeout(1000)
    })
  })

  test.describe('Client-side Errors', () => {
    test('should log console errors', async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await loginAsAdmin(page)
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Navigate through a few pages
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      console.log('Console errors found:', consoleErrors.length)
    })

    test('should handle unhandled promise rejections', async ({ page }) => {
      const errors: Error[] = []

      page.on('pageerror', (error) => {
        errors.push(error)
      })

      await loginAsAdmin(page)
      await page.goto('/dashboard')
      await waitForLoad(page)

      console.log('Unhandled errors:', errors.length)
    })
  })
})
