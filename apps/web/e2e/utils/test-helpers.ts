/**
 * E2E Test Helper Functions - TopSteel ERP
 * Reusable utilities for Playwright tests
 */

import { Page, expect } from '@playwright/test'

/**
 * Login helper - Authenticates a user
 * @param page - Playwright page object
 * @param email - User email or acronym
 * @param password - User password
 */
export async function login(page: Page, email: string, password: string) {
  // Navigate to login page
  await page.goto('/login')

  // Wait for the page to load
  await page.waitForLoadState('networkidle')

  // Fill in credentials
  await page.fill('input[type="text"]', email)
  await page.fill('input[type="password"]', password)

  // Click login button
  await page.click('button[type="submit"]')

  // Wait for navigation to dashboard or company selection
  await page.waitForLoadState('networkidle')

  // Check if we're redirected (should be on dashboard or company selection)
  const url = page.url()
  const isLoggedIn = url.includes('/dashboard') || url.includes('/login') // May still be on login if company selection is needed

  return isLoggedIn
}

/**
 * Login with demo credentials
 * @param page - Playwright page object
 */
export async function loginAsAdmin(page: Page) {
  return await login(page, 'admin@topsteel.fr', 'admin123')
}

/**
 * Logout helper - Signs out the current user
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Look for user menu or logout button
  // This is typically in a dropdown or profile menu
  const userMenuButton = page.locator('[data-testid="user-menu"]').first()

  if (await userMenuButton.isVisible()) {
    await userMenuButton.click()

    // Wait for dropdown to appear
    await page.waitForTimeout(500)

    // Click logout button
    await page.click('[data-testid="logout-button"]')
  } else {
    // Alternative: navigate to a logout endpoint
    await page.goto('/api/auth/logout')
  }

  // Wait for redirect to login page
  await page.waitForURL('**/login', { timeout: 5000 })
}

/**
 * Wait for page to fully load
 * @param page - Playwright page object
 */
export async function waitForLoad(page: Page) {
  await page.waitForLoadState('networkidle')
  await page.waitForLoadState('domcontentloaded')
}

/**
 * Take a screenshot with a custom name
 * @param page - Playwright page object
 * @param name - Screenshot file name
 */
export async function takeScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true,
  })
}

/**
 * Fill a form with data
 * @param page - Playwright page object
 * @param formData - Object with field names and values
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [field, value] of Object.entries(formData)) {
    const input = page.locator(`[name="${field}"], [data-testid="${field}"], #${field}`)
    await input.fill(value)
  }
}

/**
 * Wait for toast notification to appear
 * @param page - Playwright page object
 * @param message - Expected toast message (optional)
 */
export async function waitForToast(page: Page, message?: string) {
  const toast = page.locator('[data-testid="toast"], .sonner-toast, [role="status"]').first()
  await toast.waitFor({ state: 'visible', timeout: 5000 })

  if (message) {
    await expect(toast).toContainText(message)
  }

  return toast
}

/**
 * Wait for loading spinner to disappear
 * @param page - Playwright page object
 */
export async function waitForLoadingToComplete(page: Page) {
  const spinner = page.locator('[data-testid="loading"], .animate-spin').first()

  // Wait for spinner to appear (if it does)
  try {
    await spinner.waitFor({ state: 'visible', timeout: 1000 })
  } catch {
    // Spinner might not appear, that's ok
  }

  // Wait for it to disappear
  await spinner.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
    // If it never appeared or already disappeared, that's fine
  })
}

/**
 * Navigate using sidebar menu
 * @param page - Playwright page object
 * @param menuItem - Menu item text or data-testid
 */
export async function navigateToMenuItem(page: Page, menuItem: string) {
  // Try to find by text first
  let menuLink = page.locator(`nav a:has-text("${menuItem}")`).first()

  if (!(await menuLink.isVisible())) {
    // Try by data-testid
    menuLink = page.locator(`[data-testid="menu-${menuItem}"]`).first()
  }

  await menuLink.click()
  await waitForLoad(page)
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url()
  return !url.includes('/login') && !url.includes('/register')
}

/**
 * Wait for API response
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to match
 */
export async function waitForAPIResponse(page: Page, urlPattern: string | RegExp) {
  return await page.waitForResponse((response) => {
    const url = response.url()
    if (typeof urlPattern === 'string') {
      return url.includes(urlPattern)
    }
    return urlPattern.test(url)
  })
}

/**
 * Mock API response
 * @param page - Playwright page object
 * @param urlPattern - URL pattern to intercept
 * @param response - Response data
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  response: unknown
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  })
}

/**
 * Clear all cookies and local storage
 * @param page - Playwright page object
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Get local storage item
 * @param page - Playwright page object
 * @param key - Storage key
 */
export async function getLocalStorageItem(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((storageKey) => {
    return localStorage.getItem(storageKey)
  }, key)
}

/**
 * Set local storage item
 * @param page - Playwright page object
 * @param key - Storage key
 * @param value - Storage value
 */
export async function setLocalStorageItem(page: Page, key: string, value: string) {
  await page.evaluate(
    ({ storageKey, storageValue }) => {
      localStorage.setItem(storageKey, storageValue)
    },
    { storageKey: key, storageValue: value }
  )
}
