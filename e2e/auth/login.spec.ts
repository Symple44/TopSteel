import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/login.page'
import { DashboardPage } from '../pages/dashboard.page'

test.describe('Authentication Flow', () => {
  let loginPage: LoginPage
  let dashboardPage: DashboardPage

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page)
    dashboardPage = new DashboardPage(page)
    await loginPage.goto()
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    // Arrange
    const email = 'admin@topsteel.com'
    const password = 'Admin123!'

    // Act
    await loginPage.login(email, password)

    // Assert
    await expect(page).toHaveURL('/dashboard')
    await expect(dashboardPage.welcomeMessage).toBeVisible()
    await expect(dashboardPage.welcomeMessage).toContainText('Bienvenue')
    
    // Vérifier que le token est stocké
    const localStorage = await page.evaluate(() => window.localStorage)
    expect(localStorage).toHaveProperty('auth-token')
  })

  test('should show error with invalid credentials', async ({ page }) => {
    // Act
    await loginPage.login('invalid@email.com', 'wrongpassword')

    // Assert
    await expect(loginPage.errorMessage).toBeVisible()
    await expect(loginPage.errorMessage).toContainText('Identifiants invalides')
    await expect(page).toHaveURL('/login')
  })

  test('should validate email format', async () => {
    // Act
    await loginPage.emailInput.fill('invalid-email')
    await loginPage.passwordInput.fill('password123')
    await loginPage.submitButton.click()

    // Assert
    await expect(loginPage.emailError).toBeVisible()
    await expect(loginPage.emailError).toContainText('Email invalide')
  })

  test('should validate required fields', async () => {
    // Act
    await loginPage.submitButton.click()

    // Assert
    await expect(loginPage.emailError).toBeVisible()
    await expect(loginPage.emailError).toContainText('Email requis')
    await expect(loginPage.passwordError).toBeVisible()
    await expect(loginPage.passwordError).toContainText('Mot de passe requis')
  })

  test('should remember me functionality work', async ({ page, context }) => {
    // Act
    await loginPage.rememberMeCheckbox.check()
    await loginPage.login('admin@topsteel.com', 'Admin123!')

    // Assert - Vérifier que le cookie de session est persistant
    const cookies = await context.cookies()
    const sessionCookie = cookies.find(c => c.name === 'session')
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 86400) // Plus de 24h
  })

  test('should redirect to requested page after login', async ({ page }) => {
    // Arrange - Essayer d'accéder à une page protégée
    await page.goto('/inventory/articles')
    await expect(page).toHaveURL('/login?redirect=/inventory/articles')

    // Act - Se connecter
    await loginPage.login('admin@topsteel.com', 'Admin123!')

    // Assert - Redirection vers la page demandée
    await expect(page).toHaveURL('/inventory/articles')
  })

  test('should logout successfully', async ({ page }) => {
    // Arrange - Se connecter d'abord
    await loginPage.login('admin@topsteel.com', 'Admin123!')
    await expect(page).toHaveURL('/dashboard')

    // Act - Se déconnecter
    await dashboardPage.logout()

    // Assert
    await expect(page).toHaveURL('/login')
    const localStorage = await page.evaluate(() => window.localStorage)
    expect(localStorage['auth-token']).toBeUndefined()
  })

  test('should handle session expiration', async ({ page }) => {
    // Arrange - Se connecter
    await loginPage.login('admin@topsteel.com', 'Admin123!')
    
    // Act - Simuler l'expiration du token
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'expired-token')
    })
    
    // Rafraîchir la page
    await page.reload()

    // Assert - Redirection vers login
    await expect(page).toHaveURL('/login')
    await expect(loginPage.errorMessage).toContainText('Session expirée')
  })

  test('should handle MFA if enabled', async ({ page }) => {
    // Arrange - Utilisateur avec MFA activé
    const email = 'mfa-user@topsteel.com'
    const password = 'SecurePass123!'

    // Act - Se connecter
    await loginPage.login(email, password)

    // Assert - Page MFA
    await expect(page).toHaveURL('/login/mfa')
    const mfaInput = page.locator('input[name="mfa-code"]')
    await expect(mfaInput).toBeVisible()
    
    // Entrer le code MFA
    await mfaInput.fill('123456')
    await page.locator('button[type="submit"]').click()
    
    // Vérifier la connexion réussie
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle password reset flow', async ({ page }) => {
    // Act - Cliquer sur "Mot de passe oublié"
    await loginPage.forgotPasswordLink.click()

    // Assert - Page de réinitialisation
    await expect(page).toHaveURL('/reset-password')
    
    // Entrer l'email
    const resetEmailInput = page.locator('input[name="email"]')
    await resetEmailInput.fill('user@topsteel.com')
    await page.locator('button[type="submit"]').click()
    
    // Vérifier le message de succès
    const successMessage = page.locator('[data-testid="reset-success"]')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText('Email de réinitialisation envoyé')
  })

  test('should prevent brute force attempts', async ({ page }) => {
    // Act - Tentatives multiples avec mauvais mot de passe
    for (let i = 0; i < 5; i++) {
      await loginPage.login('admin@topsteel.com', 'wrongpassword')
      await page.waitForTimeout(100)
    }

    // Assert - Compte bloqué temporairement
    await expect(loginPage.errorMessage).toContainText('Trop de tentatives')
    
    // Le bouton de connexion devrait être désactivé
    await expect(loginPage.submitButton).toBeDisabled()
    
    // Vérifier le délai d'attente affiché
    const cooldownMessage = page.locator('[data-testid="cooldown-timer"]')
    await expect(cooldownMessage).toBeVisible()
  })
})