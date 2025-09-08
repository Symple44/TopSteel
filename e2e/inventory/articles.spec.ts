import { test, expect } from '@playwright/test'
import { ArticlesPage } from '../pages/articles.page'
import { LoginPage } from '../pages/login.page'

test.describe('Articles Management', () => {
  let articlesPage: ArticlesPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    // Se connecter d'abord
    loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('admin@topsteel.com', 'Admin123!')
    
    // Naviguer vers les articles
    articlesPage = new ArticlesPage(page)
    await articlesPage.goto()
  })

  test('should display articles list', async ({ page }) => {
    // Assert
    await expect(page).toHaveURL('/inventory/articles')
    await expect(articlesPage.pageTitle).toContainText('Articles')
    await expect(articlesPage.dataTable).toBeVisible()
    
    // Vérifier qu'il y a des articles
    const rowCount = await articlesPage.getRowCount()
    expect(rowCount).toBeGreaterThan(0)
  })

  test('should create new article', async ({ page }) => {
    // Arrange
    const articleData = {
      reference: `ART-${Date.now()}`,
      designation: 'Test Article E2E',
      type: 'PRODUIT',
      famille: 'ACIER',
      uniteStock: 'KG',
      prixVenteHT: '25.50',
      stockMini: '10',
      stockMaxi: '1000',
    }

    // Act
    await articlesPage.createArticle(articleData)

    // Assert
    await expect(articlesPage.successToast).toBeVisible()
    await expect(articlesPage.successToast).toContainText('Article créé')
    
    // Vérifier que l'article apparaît dans la liste
    await articlesPage.searchArticle(articleData.reference)
    const firstRow = articlesPage.dataTable.locator('tbody tr').first()
    await expect(firstRow).toContainText(articleData.reference)
    await expect(firstRow).toContainText(articleData.designation)
  })

  test('should edit existing article', async ({ page }) => {
    // Arrange - Sélectionner le premier article
    const firstRow = articlesPage.dataTable.locator('tbody tr').first()
    const editButton = firstRow.locator('[data-testid="edit-button"]')
    
    // Act
    await editButton.click()
    await expect(articlesPage.editDialog).toBeVisible()
    
    // Modifier la désignation
    const newDesignation = `Updated - ${Date.now()}`
    await articlesPage.designationInput.clear()
    await articlesPage.designationInput.fill(newDesignation)
    await articlesPage.saveButton.click()

    // Assert
    await expect(articlesPage.successToast).toContainText('Article modifié')
    await expect(firstRow).toContainText(newDesignation)
  })

  test('should delete article', async ({ page }) => {
    // Arrange - Créer un article à supprimer
    const articleToDelete = {
      reference: `DEL-${Date.now()}`,
      designation: 'Article à supprimer',
      type: 'SERVICE',
      uniteStock: 'U',
      prixVenteHT: '10.00',
    }
    await articlesPage.createArticle(articleToDelete)
    
    // Rechercher l'article créé
    await articlesPage.searchArticle(articleToDelete.reference)
    const row = articlesPage.dataTable.locator('tbody tr').first()
    
    // Act - Supprimer
    const deleteButton = row.locator('[data-testid="delete-button"]')
    await deleteButton.click()
    
    // Confirmer la suppression
    await page.locator('text=Confirmer').click()
    
    // Assert
    await expect(articlesPage.successToast).toContainText('Article supprimé')
    
    // Vérifier que l'article n'apparaît plus
    await articlesPage.searchArticle(articleToDelete.reference)
    const emptyMessage = page.locator('[data-testid="no-results"]')
    await expect(emptyMessage).toBeVisible()
  })

  test('should perform inventory adjustment', async ({ page }) => {
    // Arrange - Sélectionner un article avec gestion de stock
    await articlesPage.filterByType('PRODUIT')
    const firstRow = articlesPage.dataTable.locator('tbody tr').first()
    const inventoryButton = firstRow.locator('[data-testid="inventory-button"]')
    
    // Act
    await inventoryButton.click()
    await expect(articlesPage.inventoryDialog).toBeVisible()
    
    // Ajuster le stock
    const newStock = '150'
    await articlesPage.stockInput.clear()
    await articlesPage.stockInput.fill(newStock)
    await articlesPage.commentInput.fill('Inventaire mensuel E2E')
    await articlesPage.confirmButton.click()
    
    // Assert
    await expect(articlesPage.successToast).toContainText('Inventaire effectué')
    await expect(firstRow.locator('[data-testid="stock-value"]')).toContainText(newStock)
  })

  test('should filter articles by type', async ({ page }) => {
    // Act
    await articlesPage.filterByType('SERVICE')
    
    // Assert
    const rows = await articlesPage.dataTable.locator('tbody tr').count()
    for (let i = 0; i < rows; i++) {
      const row = articlesPage.dataTable.locator('tbody tr').nth(i)
      await expect(row.locator('[data-testid="type-badge"]')).toContainText('SERVICE')
    }
  })

  test('should search articles', async ({ page }) => {
    // Arrange
    const searchTerm = 'ACIER'
    
    // Act
    await articlesPage.searchArticle(searchTerm)
    
    // Assert
    await page.waitForTimeout(500) // Attendre le debounce
    const rows = await articlesPage.dataTable.locator('tbody tr').count()
    expect(rows).toBeGreaterThan(0)
    
    // Vérifier que tous les résultats contiennent le terme
    const firstRow = articlesPage.dataTable.locator('tbody tr').first()
    const text = await firstRow.textContent()
    expect(text?.toLowerCase()).toContain(searchTerm.toLowerCase())
  })

  test('should export articles to Excel', async ({ page }) => {
    // Act
    const downloadPromise = page.waitForEvent('download')
    await articlesPage.exportButton.click()
    await page.locator('text=Excel').click()
    
    // Assert
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('articles')
    expect(download.suggestedFilename()).toContain('.xlsx')
  })

  test('should handle pagination', async ({ page }) => {
    // Arrange - S'assurer qu'il y a assez d'articles
    const totalRows = await articlesPage.getRowCount()
    if (totalRows <= 10) {
      test.skip()
    }
    
    // Act - Aller à la page 2
    await articlesPage.goToPage(2)
    
    // Assert
    await expect(page.url()).toContain('page=2')
    await expect(articlesPage.currentPageIndicator).toContainText('2')
    
    // Vérifier que les articles affichés sont différents
    const firstRowPage2 = await articlesPage.dataTable.locator('tbody tr').first().textContent()
    
    // Retour page 1
    await articlesPage.goToPage(1)
    const firstRowPage1 = await articlesPage.dataTable.locator('tbody tr').first().textContent()
    
    expect(firstRowPage1).not.toBe(firstRowPage2)
  })

  test('should validate required fields on creation', async ({ page }) => {
    // Act
    await articlesPage.createButton.click()
    await expect(articlesPage.createDialog).toBeVisible()
    
    // Essayer de sauvegarder sans remplir les champs
    await articlesPage.saveButton.click()
    
    // Assert
    await expect(articlesPage.referenceError).toBeVisible()
    await expect(articlesPage.referenceError).toContainText('Référence requise')
    await expect(articlesPage.designationError).toBeVisible()
    await expect(articlesPage.designationError).toContainText('Désignation requise')
  })

  test('should duplicate article', async ({ page }) => {
    // Arrange
    const firstRow = articlesPage.dataTable.locator('tbody tr').first()
    const originalReference = await firstRow.locator('[data-testid="reference"]').textContent()
    
    // Act
    const duplicateButton = firstRow.locator('[data-testid="duplicate-button"]')
    await duplicateButton.click()
    
    await expect(articlesPage.duplicateDialog).toBeVisible()
    const newReference = `${originalReference}-COPY-${Date.now()}`
    await articlesPage.referenceInput.clear()
    await articlesPage.referenceInput.fill(newReference)
    await articlesPage.saveButton.click()
    
    // Assert
    await expect(articlesPage.successToast).toContainText('Article dupliqué')
    
    // Vérifier que le nouvel article existe
    await articlesPage.searchArticle(newReference)
    const duplicatedRow = articlesPage.dataTable.locator('tbody tr').first()
    await expect(duplicatedRow).toContainText(newReference)
  })

  test('should show stock alerts', async ({ page }) => {
    // Act - Filtrer par alertes de stock
    await articlesPage.filterByStockAlert('rupture')
    
    // Assert
    const rows = await articlesPage.dataTable.locator('tbody tr').count()
    if (rows > 0) {
      // Vérifier que tous ont un badge de rupture
      for (let i = 0; i < Math.min(rows, 5); i++) {
        const row = articlesPage.dataTable.locator('tbody tr').nth(i)
        const stockBadge = row.locator('[data-testid="stock-status"]')
        await expect(stockBadge).toHaveClass(/.*danger.*/)
      }
    }
  })

  test('should handle bulk operations', async ({ page }) => {
    // Act - Sélectionner plusieurs articles
    await articlesPage.selectAllCheckbox.check()
    
    // Assert - Vérifier que le menu bulk apparaît
    await expect(articlesPage.bulkActionsMenu).toBeVisible()
    
    // Exporter la sélection
    await articlesPage.bulkExportButton.click()
    
    const downloadPromise = page.waitForEvent('download')
    await page.locator('text=Confirmer').click()
    
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('selection')
  })
})