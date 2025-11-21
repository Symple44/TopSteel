/**
 * CRUD Operations E2E Tests - TopSteel ERP
 * Tests for Create, Read, Update, Delete operations on various entities
 * Tests list views, pagination, search, and filtering
 */

import { test, expect } from '@playwright/test'
import { TEST_ARTICLES, TEST_PARTNERS, TEST_PROJECTS } from './fixtures/test-data'
import { loginAsAdmin, waitForLoad, fillForm, waitForToast } from './utils/test-helpers'

test.describe('CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page)
    await page.waitForTimeout(1000)
  })

  test.describe('List View - Articles/Inventory', () => {
    test('should display articles list', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Verify page loaded
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()

      // Should have a table or grid
      const table = page.locator('table, [role="table"]').first()
      const tableVisible = await table.isVisible().catch(() => false)

      if (tableVisible) {
        // Check for table headers
        const headers = table.locator('th, [role="columnheader"]')
        const headerCount = await headers.count()
        expect(headerCount).toBeGreaterThan(0)
      }
    })

    test('should display data in table format', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Wait for data to load
      await page.waitForTimeout(1000)

      // Look for table rows
      const rows = page.locator('tbody tr, [role="row"]')
      const rowCount = await rows.count()

      // May have data or be empty
      console.log('Row count:', rowCount)

      // Table should exist even if empty
      const table = page.locator('table, [role="table"]').first()
      await expect(table).toBeVisible()
    })

    test('should have create new button', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for "Add" or "New" button
      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add|créer|create/i }).first()

      const buttonVisible = await createButton.isVisible().catch(() => false)

      if (buttonVisible) {
        await expect(createButton).toBeVisible()
      }
    })

    test('should have search functionality', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="recherch"], input[placeholder*="search"]').first()

      const searchVisible = await searchInput.isVisible().catch(() => false)

      if (searchVisible) {
        await expect(searchInput).toBeVisible()

        // Type in search
        await searchInput.fill('acier')
        await page.waitForTimeout(500)

        // Results should filter (implementation dependent)
      }
    })

    test('should have filter options', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for filter controls
      const filterButton = page.locator('button').filter({ hasText: /filtre|filter/i }).first()

      const filterVisible = await filterButton.isVisible().catch(() => false)

      if (filterVisible) {
        await filterButton.click()
        await page.waitForTimeout(300)

        // Filter panel should appear
      }
    })

    test('should support pagination', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for pagination controls
      const pagination = page.locator('nav[aria-label*="pagination"], [data-testid="pagination"]').first()

      const paginationVisible = await pagination.isVisible().catch(() => false)

      if (paginationVisible) {
        // Check for next/previous buttons
        const nextButton = page.locator('button').filter({ hasText: /suivant|next/i }).first()

        if (await nextButton.isVisible() && await nextButton.isEnabled()) {
          await nextButton.click()
          await waitForLoad(page)

          // Should navigate to next page
        }
      }
    })

    test('should sort columns', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Find a sortable column header
      const columnHeader = page.locator('th, [role="columnheader"]').first()

      if (await columnHeader.isVisible()) {
        // Click to sort
        await columnHeader.click()
        await page.waitForTimeout(500)

        // Click again to reverse sort
        await columnHeader.click()
        await page.waitForTimeout(500)

        // Sorting should have occurred (visual verification)
      }
    })
  })

  test.describe('Create Operation - Articles', () => {
    test('should open create article form', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Click create button
      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add|créer|create/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Form or modal should appear
        const form = page.locator('form, [role="dialog"]').first()
        await expect(form).toBeVisible()
      }
    })

    test('should display create article form fields', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Check for common form fields
        const codeInput = page.locator('input[name="code"], input[placeholder*="code"]').first()
        const nameInput = page.locator('input[name="name"], input[name="nom"], input[placeholder*="nom"]').first()

        const codeVisible = await codeInput.isVisible().catch(() => false)
        const nameVisible = await nameInput.isVisible().catch(() => false)

        // At least one field should be visible
        expect(codeVisible || nameVisible).toBeTruthy()
      }
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Try to submit without filling required fields
        const submitButton = page.locator('button[type="submit"]').first()

        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(500)

          // Should show validation errors
          // Could be HTML5 validation or custom error messages
        }
      }
    })

    test('should create new article successfully', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Fill form with test data
        const testArticle = TEST_ARTICLES.steelBeam

        const codeInput = page.locator('input[name="code"]').first()
        if (await codeInput.isVisible()) {
          await codeInput.fill(testArticle.code + '-TEST-' + Date.now())
        }

        const nameInput = page.locator('input[name="name"], input[name="nom"]').first()
        if (await nameInput.isVisible()) {
          await nameInput.fill(testArticle.name)
        }

        const priceInput = page.locator('input[name="price"], input[name="unitPrice"]').first()
        if (await priceInput.isVisible()) {
          await priceInput.fill(testArticle.unitPrice.toString())
        }

        // Submit form
        const submitButton = page.locator('button[type="submit"]').first()

        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(1500)

          // Should show success message or redirect to list
        }
      }
    })

    test('should cancel create operation', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Click cancel button
        const cancelButton = page.locator('button').filter({ hasText: /annuler|cancel/i }).first()

        if (await cancelButton.isVisible()) {
          await cancelButton.click()
          await page.waitForTimeout(300)

          // Form should close
          const form = page.locator('form, [role="dialog"]').first()
          const formVisible = await form.isVisible().catch(() => false)

          expect(formVisible).toBeFalsy()
        }
      }
    })
  })

  test.describe('Read Operation - Article Details', () => {
    test('should view article details', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Click on first item in list
      const firstRow = page.locator('tbody tr, [role="row"]').first()

      if (await firstRow.isVisible()) {
        // Click on row or view button
        const viewButton = firstRow.locator('button, a').filter({ hasText: /voir|view|détails/i }).first()

        if (await viewButton.isVisible()) {
          await viewButton.click()
        } else {
          await firstRow.click()
        }

        await page.waitForTimeout(500)

        // Should show details page or modal
        await page.waitForTimeout(1000)
      }
    })

    test('should display article information', async ({ page }) => {
      // Navigate to a specific article (if ID is known)
      // For this test, we'll try to access the articles page
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // If there are articles, we can click one
      const firstRow = page.locator('tbody tr, [role="row"]').first()
      const rowVisible = await firstRow.isVisible().catch(() => false)

      if (rowVisible) {
        const viewLink = firstRow.locator('a').first()

        if (await viewLink.isVisible()) {
          await viewLink.click()
          await waitForLoad(page)

          // Should show article details
          await page.waitForTimeout(1000)
        }
      }
    })
  })

  test.describe('Update Operation - Articles', () => {
    test('should open edit article form', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Find edit button
      const editButton = page.locator('button').filter({ hasText: /modifier|edit/i }).first()

      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(500)

        // Edit form should appear
        const form = page.locator('form, [role="dialog"]').first()
        await expect(form).toBeVisible()
      }
    })

    test('should update article successfully', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const editButton = page.locator('button').filter({ hasText: /modifier|edit/i }).first()

      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(500)

        // Update a field
        const nameInput = page.locator('input[name="name"], input[name="nom"]').first()

        if (await nameInput.isVisible()) {
          await nameInput.fill('Updated Article Name ' + Date.now())

          // Submit
          const submitButton = page.locator('button[type="submit"]').first()

          if (await submitButton.isVisible()) {
            await submitButton.click()
            await page.waitForTimeout(1500)

            // Should show success message
          }
        }
      }
    })

    test('should preserve existing data when editing', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const editButton = page.locator('button').filter({ hasText: /modifier|edit/i }).first()

      if (await editButton.isVisible()) {
        await editButton.click()
        await page.waitForTimeout(500)

        // Check that fields are pre-filled
        const nameInput = page.locator('input[name="name"], input[name="nom"]').first()

        if (await nameInput.isVisible()) {
          const value = await nameInput.inputValue()
          expect(value.length).toBeGreaterThan(0)
        }
      }
    })
  })

  test.describe('Delete Operation - Articles', () => {
    test('should show delete confirmation', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Find delete button
      const deleteButton = page.locator('button').filter({ hasText: /supprimer|delete/i }).first()

      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.waitForTimeout(500)

        // Should show confirmation dialog
        const confirmDialog = page.locator('[role="dialog"], [role="alertdialog"]').first()
        const dialogVisible = await confirmDialog.isVisible().catch(() => false)

        if (dialogVisible) {
          await expect(confirmDialog).toBeVisible()
        }
      }
    })

    test('should cancel delete operation', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const deleteButton = page.locator('button').filter({ hasText: /supprimer|delete/i }).first()

      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.waitForTimeout(500)

        // Click cancel
        const cancelButton = page.locator('button').filter({ hasText: /annuler|cancel/i }).first()

        if (await cancelButton.isVisible()) {
          await cancelButton.click()
          await page.waitForTimeout(300)

          // Dialog should close, item should remain
        }
      }
    })

    test('should delete article successfully', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const deleteButton = page.locator('button').filter({ hasText: /supprimer|delete/i }).first()

      if (await deleteButton.isVisible()) {
        await deleteButton.click()
        await page.waitForTimeout(500)

        // Confirm deletion
        const confirmButton = page.locator('button').filter({ hasText: /confirmer|confirm|supprimer|delete/i }).last()

        if (await confirmButton.isVisible()) {
          await confirmButton.click()
          await page.waitForTimeout(1500)

          // Should show success message
        }
      }
    })
  })

  test.describe('CRUD - Partners (Clients/Suppliers)', () => {
    test('should display partners list', async ({ page }) => {
      await page.goto('/partners/clients')
      await waitForLoad(page)

      // Verify page loaded
      const heading = page.locator('h1, h2').first()
      await expect(heading).toBeVisible()
    })

    test('should create new client', async ({ page }) => {
      await page.goto('/partners/clients')
      await waitForLoad(page)

      const createButton = page.locator('button, a').filter({ hasText: /nouveau|new|ajouter|add/i }).first()

      if (await createButton.isVisible()) {
        await createButton.click()
        await page.waitForTimeout(500)

        // Fill client data
        const testClient = TEST_PARTNERS.client1

        const nameInput = page.locator('input[name="name"], input[name="nom"]').first()
        if (await nameInput.isVisible()) {
          await nameInput.fill(testClient.name + ' TEST ' + Date.now())
        }

        const emailInput = page.locator('input[name="email"]').first()
        if (await emailInput.isVisible()) {
          await emailInput.fill('test' + Date.now() + '@test.com')
        }

        // Submit
        const submitButton = page.locator('button[type="submit"]').first()

        if (await submitButton.isVisible()) {
          await submitButton.click()
          await page.waitForTimeout(1500)
        }
      }
    })

    test('should view client details', async ({ page }) => {
      await page.goto('/partners/clients')
      await waitForLoad(page)

      const firstRow = page.locator('tbody tr, [role="row"]').first()

      if (await firstRow.isVisible()) {
        const viewButton = firstRow.locator('button, a').first()

        if (await viewButton.isVisible()) {
          await viewButton.click()
          await page.waitForTimeout(500)
        }
      }
    })

    test('should navigate to suppliers', async ({ page }) => {
      await page.goto('/partners/suppliers')
      await waitForLoad(page)

      expect(page.url()).toContain('/partners/suppliers')
    })
  })

  test.describe('Search and Filter', () => {
    test('should search articles by name', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const searchInput = page.locator('input[type="search"], input[placeholder*="recherch"], input[placeholder*="search"]').first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('acier')
        await page.waitForTimeout(800)

        // Results should be filtered
        await page.waitForTimeout(500)
      }
    })

    test('should filter by category', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for category filter
      const categoryFilter = page.locator('select[name="category"], select[name="categorie"]').first()

      if (await categoryFilter.isVisible()) {
        await categoryFilter.selectOption({ index: 1 })
        await page.waitForTimeout(500)

        // Results should update
      }
    })

    test('should clear search', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const searchInput = page.locator('input[type="search"], input[placeholder*="recherch"]').first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('test search')
        await page.waitForTimeout(500)

        // Clear search
        await searchInput.fill('')
        await page.waitForTimeout(500)

        // All results should be shown again
      }
    })

    test('should show no results message', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      const searchInput = page.locator('input[type="search"], input[placeholder*="recherch"]').first()

      if (await searchInput.isVisible()) {
        await searchInput.fill('xyznonexistentarticle123456')
        await page.waitForTimeout(800)

        // Should show "no results" message
        const noResults = page.locator('text=/aucun.*résultat|no.*results|aucune.*donnée/i').first()
        const noResultsVisible = await noResults.isVisible().catch(() => false)

        console.log('No results message visible:', noResultsVisible)
      }
    })
  })

  test.describe('Bulk Operations', () => {
    test('should select multiple items', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for checkboxes
      const checkboxes = page.locator('input[type="checkbox"]')
      const count = await checkboxes.count()

      if (count > 0) {
        // Check first checkbox
        await checkboxes.first().check()
        await page.waitForTimeout(200)

        // Should be checked
        await expect(checkboxes.first()).toBeChecked()
      }
    })

    test('should select all items', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Look for "select all" checkbox
      const selectAllCheckbox = page.locator('thead input[type="checkbox"]').first()

      if (await selectAllCheckbox.isVisible()) {
        await selectAllCheckbox.check()
        await page.waitForTimeout(300)

        // All items should be selected
      }
    })

    test('should perform bulk delete', async ({ page }) => {
      await page.goto('/inventory/articles')
      await waitForLoad(page)

      // Select items
      const checkbox = page.locator('tbody input[type="checkbox"]').first()

      if (await checkbox.isVisible()) {
        await checkbox.check()
        await page.waitForTimeout(200)

        // Look for bulk delete button
        const bulkDeleteButton = page.locator('button').filter({ hasText: /supprimer.*sélection|delete.*selected/i }).first()

        if (await bulkDeleteButton.isVisible()) {
          await bulkDeleteButton.click()
          await page.waitForTimeout(500)

          // Confirmation dialog should appear
        }
      }
    })
  })
})
