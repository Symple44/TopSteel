import { type Page, type Locator } from '@playwright/test'

export class DashboardPage {
  readonly page: Page
  readonly welcomeMessage: Locator
  readonly userMenu: Locator
  readonly logoutButton: Locator
  readonly sidebar: Locator
  readonly notificationBell: Locator

  constructor(page: Page) {
    this.page = page
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]')
    this.userMenu = page.locator('[data-testid="user-menu"]')
    this.logoutButton = page.locator('[data-testid="logout-button"]')
    this.sidebar = page.locator('[data-testid="sidebar"]')
    this.notificationBell = page.locator('[data-testid="notifications"]')
  }

  async goto() {
    await this.page.goto('/dashboard')
  }

  async logout() {
    await this.userMenu.click()
    await this.logoutButton.click()
  }

  async navigateTo(menuItem: string) {
    await this.sidebar.locator(`text=${menuItem}`).click()
  }
}