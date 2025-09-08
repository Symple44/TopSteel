import { type Page, type Locator } from '@playwright/test'

export class ArticlesPage {
  readonly page: Page
  readonly pageTitle: Locator
  readonly dataTable: Locator
  readonly createButton: Locator
  readonly exportButton: Locator
  readonly searchInput: Locator
  readonly typeFilter: Locator
  readonly stockAlertFilter: Locator
  
  // Dialog elements
  readonly createDialog: Locator
  readonly editDialog: Locator
  readonly duplicateDialog: Locator
  readonly inventoryDialog: Locator
  
  // Form elements
  readonly referenceInput: Locator
  readonly designationInput: Locator
  readonly typeSelect: Locator
  readonly familleSelect: Locator
  readonly uniteStockSelect: Locator
  readonly prixVenteInput: Locator
  readonly stockMiniInput: Locator
  readonly stockMaxiInput: Locator
  readonly stockInput: Locator
  readonly commentInput: Locator
  
  // Buttons
  readonly saveButton: Locator
  readonly cancelButton: Locator
  readonly confirmButton: Locator
  
  // Bulk actions
  readonly selectAllCheckbox: Locator
  readonly bulkActionsMenu: Locator
  readonly bulkExportButton: Locator
  
  // Messages
  readonly successToast: Locator
  readonly errorToast: Locator
  readonly referenceError: Locator
  readonly designationError: Locator
  
  // Pagination
  readonly currentPageIndicator: Locator
  readonly nextPageButton: Locator
  readonly prevPageButton: Locator

  constructor(page: Page) {
    this.page = page
    
    // Page elements
    this.pageTitle = page.locator('h1')
    this.dataTable = page.locator('[data-testid="articles-table"]')
    this.createButton = page.locator('button:has-text("Nouvel article")')
    this.exportButton = page.locator('button:has-text("Exporter")')
    this.searchInput = page.locator('input[placeholder*="Rechercher"]')
    this.typeFilter = page.locator('[data-testid="type-filter"]')
    this.stockAlertFilter = page.locator('[data-testid="stock-alert-filter"]')
    
    // Dialogs
    this.createDialog = page.locator('[role="dialog"]:has-text("Nouvel article")')
    this.editDialog = page.locator('[role="dialog"]:has-text("Modifier")')
    this.duplicateDialog = page.locator('[role="dialog"]:has-text("Dupliquer")')
    this.inventoryDialog = page.locator('[role="dialog"]:has-text("Inventaire")')
    
    // Form inputs
    this.referenceInput = page.locator('input[name="reference"]')
    this.designationInput = page.locator('input[name="designation"]')
    this.typeSelect = page.locator('select[name="type"]')
    this.familleSelect = page.locator('select[name="famille"]')
    this.uniteStockSelect = page.locator('select[name="uniteStock"]')
    this.prixVenteInput = page.locator('input[name="prixVenteHT"]')
    this.stockMiniInput = page.locator('input[name="stockMini"]')
    this.stockMaxiInput = page.locator('input[name="stockMaxi"]')
    this.stockInput = page.locator('input[name="stockPhysiqueReel"]')
    this.commentInput = page.locator('textarea[name="commentaire"]')
    
    // Buttons
    this.saveButton = page.locator('button:has-text("Enregistrer")')
    this.cancelButton = page.locator('button:has-text("Annuler")')
    this.confirmButton = page.locator('button:has-text("Confirmer")')
    
    // Bulk actions
    this.selectAllCheckbox = page.locator('input[data-testid="select-all"]')
    this.bulkActionsMenu = page.locator('[data-testid="bulk-actions"]')
    this.bulkExportButton = page.locator('button:has-text("Exporter la sélection")')
    
    // Messages
    this.successToast = page.locator('[data-testid="success-toast"]')
    this.errorToast = page.locator('[data-testid="error-toast"]')
    this.referenceError = page.locator('[data-testid="reference-error"]')
    this.designationError = page.locator('[data-testid="designation-error"]')
    
    // Pagination
    this.currentPageIndicator = page.locator('[data-testid="current-page"]')
    this.nextPageButton = page.locator('button[aria-label="Page suivante"]')
    this.prevPageButton = page.locator('button[aria-label="Page précédente"]')
  }

  async goto() {
    await this.page.goto('/inventory/articles')
  }

  async createArticle(data: {
    reference: string
    designation: string
    type: string
    famille?: string
    uniteStock: string
    prixVenteHT: string
    stockMini?: string
    stockMaxi?: string
  }) {
    await this.createButton.click()
    await this.referenceInput.fill(data.reference)
    await this.designationInput.fill(data.designation)
    await this.typeSelect.selectOption(data.type)
    if (data.famille) {
      await this.familleSelect.selectOption(data.famille)
    }
    await this.uniteStockSelect.selectOption(data.uniteStock)
    await this.prixVenteInput.fill(data.prixVenteHT)
    if (data.stockMini) {
      await this.stockMiniInput.fill(data.stockMini)
    }
    if (data.stockMaxi) {
      await this.stockMaxiInput.fill(data.stockMaxi)
    }
    await this.saveButton.click()
  }

  async searchArticle(term: string) {
    await this.searchInput.clear()
    await this.searchInput.fill(term)
    await this.page.waitForTimeout(500) // Debounce
  }

  async filterByType(type: string) {
    await this.typeFilter.selectOption(type)
  }

  async filterByStockAlert(alert: 'rupture' | 'critique' | 'surstock') {
    await this.stockAlertFilter.selectOption(alert)
  }

  async getRowCount(): Promise<number> {
    return await this.dataTable.locator('tbody tr').count()
  }

  async goToPage(pageNumber: number) {
    if (pageNumber === 2) {
      await this.nextPageButton.click()
    } else if (pageNumber === 1) {
      await this.prevPageButton.click()
    } else {
      // Pour d'autres pages, utiliser le sélecteur de page direct
      await this.page.locator(`button:has-text("${pageNumber}")`).click()
    }
  }
}