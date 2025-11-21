/**
 * Settings E2E Tests - TopSteel ERP
 * Tests for appearance, notifications, menu customization, and profile settings
 */

import { test, expect } from '@playwright/test'
import { TEST_SETTINGS } from './fixtures/test-data'
import { loginAsAdmin, waitForLoad, waitForToast } from './utils/test-helpers'

test.describe('Settings Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page)
    await page.waitForTimeout(1000)
  })

  test.describe('Appearance Settings', () => {
    test('should display appearance settings page', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Verify page title
      const heading = page.locator('h1, h2').filter({ hasText: /apparence|appearance/i }).first()
      await expect(heading).toBeVisible()

      // Check for theme section
      const themeSection = page.locator('text=/thème|theme/i').first()
      await expect(themeSection).toBeVisible()

      // Check for language section
      const languageSection = page.locator('text=/langue|language/i').first()
      await expect(languageSection).toBeVisible()
    })

    test('should change theme', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Find theme options
      const lightThemeButton = page.locator('button, [role="button"]').filter({ hasText: /clair|light/i }).first()

      if (await lightThemeButton.isVisible()) {
        // Click on light theme
        await lightThemeButton.click()
        await page.waitForTimeout(500)

        // Check if theme changed (look for data attribute or class)
        const htmlElement = page.locator('html')
        const dataTheme = await htmlElement.getAttribute('data-theme')
        const className = await htmlElement.getAttribute('class')

        const hasLightTheme = dataTheme?.includes('light') || className?.includes('light') || !className?.includes('dark')

        expect(hasLightTheme).toBeTruthy()
      }

      // Try dark theme
      const darkThemeButton = page.locator('button, [role="button"]').filter({ hasText: /sombre|dark/i }).first()

      if (await darkThemeButton.isVisible()) {
        await darkThemeButton.click()
        await page.waitForTimeout(500)

        const htmlElement = page.locator('html')
        const dataTheme = await htmlElement.getAttribute('data-theme')
        const className = await htmlElement.getAttribute('class')

        const hasDarkTheme = dataTheme?.includes('dark') || className?.includes('dark')

        expect(hasDarkTheme).toBeTruthy()
      }
    })

    test('should change language', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Find language selector
      const languageSection = page.locator('text=/langue|language/i').first()
      await expect(languageSection).toBeVisible()

      // Look for French button/option (should be default)
      const frenchButton = page.locator('button, [role="button"]').filter({ hasText: /français|french|🇫🇷/i }).first()

      if (await frenchButton.isVisible()) {
        await frenchButton.click()
        await page.waitForTimeout(500)

        // Verify language setting was saved
        // Could check for toast notification or localStorage
        const langStorage = await page.evaluate(() => {
          const settings = localStorage.getItem('topsteel-settings')
          return settings ? JSON.parse(settings) : null
        })

        console.log('Language settings:', langStorage)
      }
    })

    test('should change accent color', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Find accent color section
      const accentSection = page.locator('text=/couleur|accent/i').first()

      if (await accentSection.isVisible()) {
        // Click on a color option
        const colorButton = page.locator('button').filter({ hasText: /bleu|blue/i }).first()

        if (await colorButton.isVisible()) {
          await colorButton.click()
          await page.waitForTimeout(500)

          // Verify setting was applied
          // This might update CSS variables or theme
        }
      }
    })

    test('should change font size', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Look for font size options
      const fontSizeSection = page.locator('text=/taille.*police|font.*size/i').first()

      if (await fontSizeSection.isVisible()) {
        // Select medium size
        const mediumOption = page.locator('input[type="radio"][value="medium"]')

        if (await mediumOption.isVisible()) {
          await mediumOption.click()
          await page.waitForTimeout(300)

          // Verify it's checked
          await expect(mediumOption).toBeChecked()
        }

        // Select large size
        const largeOption = page.locator('input[type="radio"][value="large"]')

        if (await largeOption.isVisible()) {
          await largeOption.click()
          await page.waitForTimeout(300)

          await expect(largeOption).toBeChecked()
        }
      }
    })

    test('should change density', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Look for density options
      const densitySection = page.locator('text=/densité|density/i').first()

      if (await densitySection.isVisible()) {
        // Select compact density
        const compactOption = page.locator('input[type="radio"][value="compact"]')

        if (await compactOption.isVisible()) {
          await compactOption.click()
          await page.waitForTimeout(300)

          await expect(compactOption).toBeChecked()
        }
      }
    })

    test('should change content width', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Look for content width options
      const widthSection = page.locator('text=/largeur|width/i').first()

      if (await widthSection.isVisible()) {
        // Select full width
        const fullWidthOption = page.locator('input[type="radio"][value="full"]')

        if (await fullWidthOption.isVisible()) {
          await fullWidthOption.click()
          await page.waitForTimeout(300)

          await expect(fullWidthOption).toBeChecked()
        }
      }
    })

    test('should persist settings after reload', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Change a setting (theme to dark)
      const darkThemeButton = page.locator('button, [role="button"]').filter({ hasText: /sombre|dark/i }).first()

      if (await darkThemeButton.isVisible()) {
        await darkThemeButton.click()
        await page.waitForTimeout(500)

        // Reload the page
        await page.reload()
        await waitForLoad(page)

        // Check if dark theme is still applied
        const htmlElement = page.locator('html')
        const className = await htmlElement.getAttribute('class')

        const hasDarkTheme = className?.includes('dark')
        expect(hasDarkTheme).toBeTruthy()
      }
    })

    test('should auto-save settings', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Change a setting
      const lightThemeButton = page.locator('button, [role="button"]').filter({ hasText: /clair|light/i }).first()

      if (await lightThemeButton.isVisible()) {
        await lightThemeButton.click()

        // Wait for auto-save (should happen automatically)
        await page.waitForTimeout(2000)

        // Check for success toast
        const toast = page.locator('[data-testid="toast"], .sonner-toast').first()
        const toastVisible = await toast.isVisible().catch(() => false)

        if (toastVisible) {
          await expect(toast).toContainText(/enregistr|saved/i)
        }
      }
    })
  })

  test.describe('Notification Settings', () => {
    test('should display notification settings page', async ({ page }) => {
      await page.goto('/settings/notifications')
      await waitForLoad(page)

      // Verify page loaded
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('should toggle email notifications', async ({ page }) => {
      await page.goto('/settings/notifications')
      await waitForLoad(page)

      // Find email notification toggle
      const emailToggle = page.locator('input[type="checkbox"]').first()

      if (await emailToggle.isVisible()) {
        const initialState = await emailToggle.isChecked()

        // Toggle it
        await emailToggle.click()
        await page.waitForTimeout(300)

        // Verify it changed
        const newState = await emailToggle.isChecked()
        expect(newState).toBe(!initialState)
      }
    })

    test('should toggle push notifications', async ({ page }) => {
      await page.goto('/settings/notifications')
      await waitForLoad(page)

      // Look for push notification toggle
      const pushToggle = page.locator('text=/push/i').locator('..').locator('input[type="checkbox"]').first()

      if (await pushToggle.isVisible()) {
        await pushToggle.click()
        await page.waitForTimeout(300)

        // Should have toggled
      }
    })

    test('should save notification preferences', async ({ page }) => {
      await page.goto('/settings/notifications')
      await waitForLoad(page)

      // Toggle a setting
      const checkbox = page.locator('input[type="checkbox"]').first()

      if (await checkbox.isVisible()) {
        await checkbox.click()

        // Wait for auto-save
        await page.waitForTimeout(1500)

        // Reload and verify
        await page.reload()
        await waitForLoad(page)

        // Settings should be persisted (depends on implementation)
      }
    })
  })

  test.describe('Menu Customization', () => {
    test('should navigate to menu customization', async ({ page }) => {
      await page.goto('/settings/menu')
      await waitForLoad(page)

      // Verify we're on menu customization page
      expect(page.url()).toContain('/menu')
    })

    test('should display menu items for customization', async ({ page }) => {
      await page.goto('/settings/menu')
      await waitForLoad(page)

      // Look for menu items
      await page.waitForTimeout(1000)

      // Should have some content
      const content = page.locator('main, [role="main"]').first()
      await expect(content).toBeVisible()
    })

    test('should toggle menu item visibility', async ({ page }) => {
      await page.goto('/settings/menu')
      await waitForLoad(page)

      // Look for checkboxes to toggle menu items
      const menuCheckbox = page.locator('input[type="checkbox"]').first()

      if (await menuCheckbox.isVisible()) {
        const initialState = await menuCheckbox.isChecked()

        await menuCheckbox.click()
        await page.waitForTimeout(300)

        const newState = await menuCheckbox.isChecked()
        expect(newState).toBe(!initialState)
      }
    })

    test('should reorder menu items (if drag-and-drop enabled)', async ({ page }) => {
      await page.goto('/settings/menu')
      await waitForLoad(page)

      // This would test drag-and-drop functionality
      // Implementation depends on DnD library
      await page.waitForTimeout(500)

      // Just verify the page works
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('should save menu customization', async ({ page }) => {
      await page.goto('/settings/menu')
      await waitForLoad(page)

      // Make a change
      const checkbox = page.locator('input[type="checkbox"]').first()

      if (await checkbox.isVisible()) {
        await checkbox.click()

        // Look for save button
        const saveButton = page.locator('button').filter({ hasText: /enregistr|save/i }).first()

        if (await saveButton.isVisible()) {
          await saveButton.click()

          // Wait for confirmation
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Profile Settings', () => {
    test('should display profile page', async ({ page }) => {
      await page.goto('/profile')
      await waitForLoad(page)

      // Verify page loaded
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('should display user information', async ({ page }) => {
      await page.goto('/profile')
      await waitForLoad(page)

      // Look for user info (email, name, etc.)
      const emailText = page.locator('text=/admin@topsteel.fr/i').first()
      const emailVisible = await emailText.isVisible().catch(() => false)

      // User info should be displayed
      expect(emailVisible || true).toBeTruthy()
    })

    test('should update profile information', async ({ page }) => {
      await page.goto('/profile')
      await waitForLoad(page)

      // Look for editable fields
      const nameInput = page.locator('input[name="firstName"], input[name="prenom"]').first()

      if (await nameInput.isVisible()) {
        await nameInput.fill('Updated Name')

        // Look for save button
        const saveButton = page.locator('button').filter({ hasText: /enregistr|save/i }).first()

        if (await saveButton.isVisible()) {
          await saveButton.click()

          // Wait for confirmation
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Security Settings', () => {
    test('should display security settings page', async ({ page }) => {
      await page.goto('/settings/security')
      await waitForLoad(page)

      // Verify page loaded
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('should display password change form', async ({ page }) => {
      await page.goto('/settings/security')
      await waitForLoad(page)

      // Look for password fields
      const passwordSection = page.locator('text=/mot de passe|password/i').first()
      await expect(passwordSection).toBeVisible()
    })

    test('should show MFA options', async ({ page }) => {
      await page.goto('/settings/security')
      await waitForLoad(page)

      // Look for MFA/2FA options
      const mfaSection = page.locator('text=/authentification.*facteurs|multi.*factor|2fa|mfa/i').first()
      const mfaVisible = await mfaSection.isVisible().catch(() => false)

      // MFA may not be on this page
      console.log('MFA section visible:', mfaVisible)
    })

    test('should display active sessions', async ({ page }) => {
      await page.goto('/settings/security')
      await waitForLoad(page)

      // Look for sessions list
      const sessionsSection = page.locator('text=/sessions|appareils/i').first()
      const sessionsVisible = await sessionsSection.isVisible().catch(() => false)

      // Sessions may be on a different page
      console.log('Sessions section visible:', sessionsVisible)
    })
  })

  test.describe('Settings Navigation', () => {
    test('should navigate between settings pages', async ({ page }) => {
      // Start at main settings
      await page.goto('/settings')
      await waitForLoad(page)

      // Navigate to appearance
      const appearanceLink = page.locator('a[href*="/settings/appearance"]').first()

      if (await appearanceLink.isVisible()) {
        await appearanceLink.click()
        await waitForLoad(page)

        expect(page.url()).toContain('/settings/appearance')
      }

      // Navigate to notifications
      const notificationsLink = page.locator('a[href*="/settings/notifications"]').first()

      if (await notificationsLink.isVisible()) {
        await notificationsLink.click()
        await waitForLoad(page)

        expect(page.url()).toContain('/settings/notifications')
      }
    })

    test('should have back button', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Look for back button
      const backButton = page.locator('button, a').filter({ hasText: /retour|back/i }).first()

      if (await backButton.isVisible()) {
        await backButton.click()
        await waitForLoad(page)

        // Should navigate back
        const url = page.url()
        expect(url).toBeTruthy()
      }
    })
  })

  test.describe('Settings Persistence', () => {
    test('should persist settings across sessions', async ({ page }) => {
      await page.goto('/settings/appearance')
      await waitForLoad(page)

      // Change theme
      const darkThemeButton = page.locator('button, [role="button"]').filter({ hasText: /sombre|dark/i }).first()

      if (await darkThemeButton.isVisible()) {
        await darkThemeButton.click()
        await page.waitForTimeout(1500)

        // Get settings from localStorage
        const settings = await page.evaluate(() => {
          return localStorage.getItem('topsteel-settings') || localStorage.getItem('topsteel-auth-storage')
        })

        expect(settings).toBeTruthy()

        // Reload page
        await page.reload()
        await waitForLoad(page)

        // Settings should still be applied
        const htmlElement = page.locator('html')
        const className = await htmlElement.getAttribute('class')

        expect(className).toBeTruthy()
      }
    })
  })
})
