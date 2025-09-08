import { type Page, type Locator } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly rememberMeCheckbox: Locator
  readonly forgotPasswordLink: Locator
  readonly errorMessage: Locator
  readonly emailError: Locator
  readonly passwordError: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.locator('input[name="email"]')
    this.passwordInput = page.locator('input[name="password"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.rememberMeCheckbox = page.locator('input[name="rememberMe"]')
    this.forgotPasswordLink = page.locator('a[href="/reset-password"]')
    this.errorMessage = page.locator('[data-testid="login-error"]')
    this.emailError = page.locator('[data-testid="email-error"]')
    this.passwordError = page.locator('[data-testid="password-error"]')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }

  async loginWithRememberMe(email: string, password: string) {
    await this.rememberMeCheckbox.check()
    await this.login(email, password)
  }
}