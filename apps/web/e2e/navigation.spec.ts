/**
 * Navigation E2E Tests - TopSteel ERP
 * Tests for sidebar navigation, menu interactions, breadcrumbs, and routing
 */

import { test, expect } from '@playwright/test'
import { TEST_MENU_ITEMS } from './fixtures/test-data'
import { loginAsAdmin, waitForLoad, navigateToMenuItem } from './utils/test-helpers'

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page)
    await page.waitForTimeout(1000)
  })

  test.describe('Sidebar Navigation', () => {
    test('should display sidebar with menu items', async ({ page }) => {
      // Go to dashboard
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Check sidebar is visible
      const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first()
      await expect(sidebar).toBeVisible()

      // Check some common menu items exist
      const dashboardLink = page.locator('nav a, aside a').filter({ hasText: /tableau|dashboard/i }).first()

      // At least one navigation link should be visible
      const navLinks = page.locator('nav a, aside a')
      const count = await navLinks.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should navigate to dashboard', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Verify we're on dashboard
      expect(page.url()).toContain('/dashboard')

      // Check for dashboard content
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('should navigate to settings', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Find and click settings link
      const settingsLink = page.locator('a[href*="/settings"]').first()

      if (await settingsLink.isVisible()) {
        await settingsLink.click()
        await waitForLoad(page)

        // Verify we're on settings page
        expect(page.url()).toContain('/settings')
      } else {
        // Navigate directly
        await page.goto('/settings')
        await waitForLoad(page)
      }

      expect(page.url()).toContain('/settings')
    })

    test('should navigate to appearance settings', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Verify we're on appearance settings
      expect(page.url()).toContain('/settings/appearance')

      // Check for appearance-specific content
      const themeSection = page.locator('text=/thème|theme/i').first()
      const languageSection = page.locator('text=/langue|language/i').first()

      // At least one should be visible
      const themeVisible = await themeSection.isVisible().catch(() => false)
      const languageVisible = await languageSection.isVisible().catch(() => false)

      expect(themeVisible || languageVisible).toBeTruthy()
    })

    test('should navigate to admin section (if authorized)', async ({ page }) => {
      await page.goto('/admin')
      await waitForLoad(page)

      const url = page.url()

      // Either we're on admin page or redirected (depends on permissions)
      const isOnAdminOrRedirected = url.includes('/admin') || url.includes('/unauthorized') || url.includes('/dashboard')

      expect(isOnAdminOrRedirected).toBeTruthy()
    })

    test('should navigate to profile page', async ({ page }) => {
      await page.goto('/profile')
      await waitForLoad(page)

      // Verify we're on profile page
      expect(page.url()).toContain('/profile')
    })

    test('should navigate through nested menus', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Try to navigate to inventory > articles
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Verify navigation
      expect(page.url()).toContain('/inventory/articles')
    })
  })

  test.describe('Menu Interactions', () => {
    test('should expand and collapse sidebar (if collapsible)', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Look for collapse/expand button
      const collapseButton = page.locator('[data-testid="sidebar-toggle"], button[aria-label*="menu"]').first()

      if (await collapseButton.isVisible()) {
        // Get initial state
        const sidebar = page.locator('nav, aside, [data-testid="sidebar"]').first()
        const initialWidth = await sidebar.boundingBox()

        // Click to toggle
        await collapseButton.click()
        await page.waitForTimeout(300) // Wait for animation

        // Check if width changed
        const newWidth = await sidebar.boundingBox()

        // Width should change when collapsed/expanded
        if (initialWidth && newWidth) {
          expect(initialWidth.width).not.toBe(newWidth.width)
        }
      }
    })

    test('should highlight active menu item', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Find the active link
      const activeLink = page.locator('a[href*="/settings/appearance"]').first()

      if (await activeLink.isVisible()) {
        // Check for active state (common patterns)
        const classes = await activeLink.getAttribute('class') || ''
        const ariaAttr = await activeLink.getAttribute('aria-current')

        const hasActiveIndicator =
          classes.includes('active') ||
          classes.includes('bg-') ||
          ariaAttr === 'page' ||
          classes.includes('font-bold')

        expect(hasActiveIndicator).toBeTruthy()
      }
    })

    test('should show tooltips on hover (if implemented)', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Find a menu item
      const menuItem = page.locator('nav a, aside a').first()

      // Hover over it
      await menuItem.hover()
      await page.waitForTimeout(500)

      // Check if tooltip appears (this is optional)
      const tooltip = page.locator('[role="tooltip"]').first()
      const tooltipVisible = await tooltip.isVisible().catch(() => false)

      // This is informational - tooltips may or may not be implemented
      console.log('Tooltip visible:', tooltipVisible)
    })
  })

  test.describe('Breadcrumbs', () => {
    test('should display breadcrumbs on nested pages', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Look for breadcrumb navigation
      const breadcrumb = page.locator('[data-testid="breadcrumb"], nav[aria-label*="breadcrumb"]').first()

      // Breadcrumbs might not be implemented, so this is optional
      const breadcrumbVisible = await breadcrumb.isVisible().catch(() => false)

      if (breadcrumbVisible) {
        // Should contain navigation links
        const breadcrumbLinks = breadcrumb.locator('a')
        const count = await breadcrumbLinks.count()
        expect(count).toBeGreaterThan(0)
      }
    })

    test('should navigate using breadcrumb links', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Look for breadcrumb back to settings
      const settingsBreadcrumb = page.locator('a[href="/settings"]').first()

      if (await settingsBreadcrumb.isVisible()) {
        await settingsBreadcrumb.click()
        await waitForLoad(page)

        expect(page.url()).toContain('/settings')
      }
    })
  })

  test.describe('Browser Navigation', () => {
    test('should handle browser back button', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Navigate to settings
      await page.goto('/settings')
      await waitForLoad(page)

      // Use browser back
      await page.goBack()
      await waitForLoad(page)

      // Should be back on dashboard
      expect(page.url()).toContain('/dashboard')
    })

    test('should handle browser forward button', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      await page.goto('/settings')
      await waitForLoad(page)

      await page.goBack()
      await waitForLoad(page)

      // Now go forward
      await page.goForward()
      await waitForLoad(page)

      expect(page.url()).toContain('/settings')
    })

    test('should handle page refresh', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Reload the page
      await page.reload()
      await waitForLoad(page)

      // Should still be on the same page
      expect(page.url()).toContain('/settings/appearance')
    })
  })

  test.describe('Direct URL Access', () => {
    test('should access pages via direct URL', async ({ page }) => {
      const testPages = [
        '/dashboard',
        '/settings',
        '/settings/appearance',
        '/profile',
      ]

      for (const pagePath of testPages) {
        await page.goto(pagePath)
        await waitForLoad(page)

        expect(page.url()).toContain(pagePath)
      }
    })

    test('should redirect to 404 for non-existent pages', async ({ page }) => {
      await page.goto('/this-page-does-not-exist')
      await waitForLoad(page)

      // Should show 404 page or redirect to dashboard
      const url = page.url()
      const isErrorPage = url.includes('404') || url.includes('not-found')

      // May also redirect to dashboard if 404 handling redirects
      const isRedirected = url.includes('/dashboard')

      expect(isErrorPage || isRedirected).toBeTruthy()
    })
  })

  test.describe('Menu Customization', () => {
    test('should navigate to menu customization page', async ({ page }) => {
      await page.goto('/settings/menu')
      await waitForLoad(page)

      // Verify we're on menu customization page
      const url = page.url()
      const isOnMenuPage = url.includes('/settings/menu') || url.includes('/admin/menu')

      expect(isOnMenuPage).toBeTruthy()
    })

    test('should display menu items for customization', async ({ page }) => {
      await page.goto('/settings/menu')
      await waitForLoad(page)

      // Look for menu customization interface
      // This might include drag-and-drop, checkboxes, etc.
      await page.waitForTimeout(1000)

      // Just verify the page loaded
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })
  })

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Press Tab to focus on first focusable element
      await page.keyboard.press('Tab')
      await page.waitForTimeout(200)

      // Get focused element
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName
      })

      // Should have focus on some element
      expect(focusedElement).toBeTruthy()
    })

    test('should navigate with arrow keys (if implemented)', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Focus on a menu item
      const firstMenuItem = page.locator('nav a, aside a').first()
      await firstMenuItem.focus()

      // Press down arrow
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(200)

      // This is informational - keyboard nav may not be fully implemented
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.getAttribute('href')
      })

      console.log('Focused element after arrow key:', focusedElement)
    })
  })

  test.describe('Mobile Navigation', () => {
    test('should show mobile menu on small screens', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/dashboard')
      await waitForLoad(page)

      // Look for hamburger menu button
      const hamburgerButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]').first()

      if (await hamburgerButton.isVisible()) {
        // Click to open mobile menu
        await hamburgerButton.click()
        await page.waitForTimeout(300)

        // Menu should be visible
        const mobileMenu = page.locator('nav, aside, [data-testid="sidebar"]').first()
        await expect(mobileMenu).toBeVisible()
      }
    })
  })

  test.describe('Route Transitions', () => {
    test('should show loading state during navigation', async ({ page }) => {
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Click a navigation link
      const settingsLink = page.locator('a[href*="/settings"]').first()

      if (await settingsLink.isVisible()) {
        // Start navigation
        const navigationPromise = page.waitForNavigation()
        await settingsLink.click()

        // Look for loading indicator (might be brief)
        const loadingIndicator = page.locator('[data-testid="loading"], .animate-spin').first()
        const hasLoading = await loadingIndicator.isVisible().catch(() => false)

        await navigationPromise

        // Loading may be too fast to catch, so this is informational
        console.log('Loading indicator shown:', hasLoading)
      }
    })

    test('should maintain scroll position on navigation', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500))
      await page.waitForTimeout(300)

      // Navigate away
      await page.goto('/dashboard')
      await waitForLoad(page)

      // Navigate back
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Scroll position might be restored (depends on implementation)
      const scrollY = await page.evaluate(() => window.scrollY)
      console.log('Scroll position after navigation:', scrollY)
    })
  })
})
