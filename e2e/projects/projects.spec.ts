import { test, expect } from '@playwright/test'
import { ProjectsPage } from '../pages/projects.page'
import { LoginPage } from '../pages/login.page'

test.describe('Projects Management', () => {
  let projectsPage: ProjectsPage
  let loginPage: LoginPage

  test.beforeEach(async ({ page }) => {
    // Se connecter
    loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('admin@topsteel.com', 'Admin123!')
    
    // Naviguer vers les projets
    projectsPage = new ProjectsPage(page)
    await projectsPage.goto()
  })

  test('should create new project', async ({ page }) => {
    // Arrange
    const projectData = {
      reference: `PROJ-${Date.now()}`,
      nom: 'Projet Test E2E',
      client: 'Client Test',
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      budget: '50000',
      description: 'Projet de test créé par les tests E2E',
    }

    // Act
    await projectsPage.createProject(projectData)

    // Assert
    await expect(projectsPage.successToast).toBeVisible()
    await expect(projectsPage.successToast).toContainText('Projet créé')
    
    // Vérifier dans la liste
    await projectsPage.searchProject(projectData.reference)
    const projectCard = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await expect(projectCard).toContainText(projectData.reference)
    await expect(projectCard).toContainText(projectData.nom)
  })

  test('should update project status', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await firstProject.click()
    
    // Act - Changer le statut
    await projectsPage.statusSelect.selectOption('EN_COURS')
    await projectsPage.saveStatusButton.click()
    
    // Assert
    await expect(projectsPage.successToast).toContainText('Statut mis à jour')
    const statusBadge = firstProject.locator('[data-testid="status-badge"]')
    await expect(statusBadge).toContainText('En cours')
  })

  test('should add team member to project', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await firstProject.click()
    
    // Navigate to team tab
    await projectsPage.teamTab.click()
    
    // Act - Ajouter un membre
    await projectsPage.addMemberButton.click()
    await projectsPage.memberSelect.selectOption('user-2')
    await projectsPage.roleSelect.selectOption('DEVELOPER')
    await projectsPage.confirmAddMemberButton.click()
    
    // Assert
    await expect(projectsPage.successToast).toContainText('Membre ajouté')
    const membersList = projectsPage.membersList
    await expect(membersList).toContainText('Developer')
  })

  test('should create task in project', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await firstProject.click()
    
    // Navigate to tasks tab
    await projectsPage.tasksTab.click()
    
    // Act - Créer une tâche
    const taskData = {
      titre: 'Tâche Test E2E',
      description: 'Description de la tâche de test',
      priorite: 'HAUTE',
      dateEcheance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    }
    
    await projectsPage.createTaskButton.click()
    await projectsPage.taskTitleInput.fill(taskData.titre)
    await projectsPage.taskDescriptionInput.fill(taskData.description)
    await projectsPage.taskPrioritySelect.selectOption(taskData.priorite)
    await projectsPage.taskDeadlineInput.fill(taskData.dateEcheance)
    await projectsPage.saveTaskButton.click()
    
    // Assert
    await expect(projectsPage.successToast).toContainText('Tâche créée')
    const tasksList = projectsPage.tasksList
    await expect(tasksList).toContainText(taskData.titre)
  })

  test('should upload document to project', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await firstProject.click()
    
    // Navigate to documents tab
    await projectsPage.documentsTab.click()
    
    // Act - Upload document
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test-document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content test'),
    })
    
    await projectsPage.uploadButton.click()
    
    // Assert
    await expect(projectsPage.successToast).toContainText('Document uploadé')
    const documentsList = projectsPage.documentsList
    await expect(documentsList).toContainText('test-document.pdf')
  })

  test('should filter projects by status', async ({ page }) => {
    // Act
    await projectsPage.filterByStatus('TERMINE')
    
    // Assert
    await page.waitForTimeout(500)
    const projects = await projectsPage.projectsGrid.locator('[data-testid="project-card"]').count()
    
    if (projects > 0) {
      for (let i = 0; i < projects; i++) {
        const project = projectsPage.projectsGrid.locator('[data-testid="project-card"]').nth(i)
        const statusBadge = project.locator('[data-testid="status-badge"]')
        await expect(statusBadge).toContainText('Terminé')
      }
    }
  })

  test('should generate project report', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await firstProject.click()
    
    // Act
    const downloadPromise = page.waitForEvent('download')
    await projectsPage.generateReportButton.click()
    await page.locator('text=PDF').click()
    
    // Assert
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('rapport-projet')
    expect(download.suggestedFilename()).toContain('.pdf')
  })

  test('should track project progress', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    const progressBar = firstProject.locator('[data-testid="progress-bar"]')
    
    // Assert - Vérifier que la barre de progression existe
    await expect(progressBar).toBeVisible()
    
    // Obtenir le pourcentage
    const progressText = await progressBar.getAttribute('aria-valuenow')
    expect(Number(progressText)).toBeGreaterThanOrEqual(0)
    expect(Number(progressText)).toBeLessThanOrEqual(100)
  })

  test('should manage project budget', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await firstProject.click()
    
    // Navigate to budget tab
    await projectsPage.budgetTab.click()
    
    // Act - Ajouter une dépense
    await projectsPage.addExpenseButton.click()
    await projectsPage.expenseDescriptionInput.fill('Achat matériaux')
    await projectsPage.expenseAmountInput.fill('1500')
    await projectsPage.expenseCategorySelect.selectOption('MATERIAUX')
    await projectsPage.saveExpenseButton.click()
    
    // Assert
    await expect(projectsPage.successToast).toContainText('Dépense ajoutée')
    
    // Vérifier le budget restant
    const remainingBudget = projectsPage.remainingBudgetIndicator
    await expect(remainingBudget).toBeVisible()
  })

  test('should clone project', async ({ page }) => {
    // Arrange
    const firstProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    const originalName = await firstProject.locator('[data-testid="project-name"]').textContent()
    
    // Act
    await firstProject.locator('[data-testid="more-options"]').click()
    await page.locator('text=Dupliquer').click()
    
    const newReference = `CLONE-${Date.now()}`
    await projectsPage.referenceInput.clear()
    await projectsPage.referenceInput.fill(newReference)
    await projectsPage.saveButton.click()
    
    // Assert
    await expect(projectsPage.successToast).toContainText('Projet dupliqué')
    
    // Vérifier le nouveau projet
    await projectsPage.searchProject(newReference)
    const clonedProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    await expect(clonedProject).toContainText(newReference)
  })

  test('should archive completed project', async ({ page }) => {
    // Arrange - Trouver un projet terminé
    await projectsPage.filterByStatus('TERMINE')
    const completedProject = projectsPage.projectsGrid.locator('[data-testid="project-card"]').first()
    
    const projectsCount = await projectsPage.projectsGrid.locator('[data-testid="project-card"]').count()
    if (projectsCount === 0) {
      test.skip()
    }
    
    // Act
    await completedProject.locator('[data-testid="more-options"]').click()
    await page.locator('text=Archiver').click()
    await page.locator('button:has-text("Confirmer")').click()
    
    // Assert
    await expect(projectsPage.successToast).toContainText('Projet archivé')
    
    // Vérifier dans les archives
    await projectsPage.showArchivedCheckbox.check()
    await expect(completedProject).toBeVisible()
    await expect(completedProject).toHaveClass(/.*archived.*/)
  })

  test('should validate project dates', async ({ page }) => {
    // Act - Essayer de créer un projet avec des dates invalides
    await projectsPage.createButton.click()
    await projectsPage.referenceInput.fill('TEST-DATES')
    await projectsPage.nomInput.fill('Test Dates')
    await projectsPage.dateDebutInput.fill('2024-12-31')
    await projectsPage.dateFinInput.fill('2024-01-01') // Date fin avant date début
    await projectsPage.saveButton.click()
    
    // Assert
    await expect(projectsPage.dateError).toBeVisible()
    await expect(projectsPage.dateError).toContainText('Date de fin doit être après')
  })

  test('should show project timeline view', async ({ page }) => {
    // Act
    await projectsPage.viewToggle.click()
    await page.locator('text=Timeline').click()
    
    // Assert
    await expect(projectsPage.timelineView).toBeVisible()
    const timelineItems = projectsPage.timelineView.locator('[data-testid="timeline-item"]')
    const itemCount = await timelineItems.count()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('should export projects list', async ({ page }) => {
    // Act
    const downloadPromise = page.waitForEvent('download')
    await projectsPage.exportButton.click()
    await page.locator('text=CSV').click()
    
    // Assert
    const download = await downloadPromise
    expect(download.suggestedFilename()).toContain('projets')
    expect(download.suggestedFilename()).toContain('.csv')
  })
})