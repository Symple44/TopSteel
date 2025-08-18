import { expect, type Page, test } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const API_URL = process.env.API_URL || 'http://localhost:3001'

// Test data
const testUser = {
  email: 'test@topsteel.com',
  password: 'Test123!@#',
  firstName: 'John',
  lastName: 'Doe',
}

const _testProduct = {
  name: 'Steel Beam 10m',
  price: 299.99,
  category: 'Steel Beams',
}

// Helper functions
async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/auth/login`)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/marketplace/)
}

async function _addToCart(page: Page, productName: string) {
  await page.click(`[data-product-name="${productName}"] button:has-text("Add to Cart")`)
  await page.waitForSelector('.cart-notification', { state: 'visible' })
}

async function searchProduct(page: Page, query: string) {
  await page.fill('input[placeholder*="Search"]', query)
  await page.press('input[placeholder*="Search"]', 'Enter')
  await page.waitForURL(/\/search/)
}

// Test suites
test.describe('Marketplace E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up interceptors for API calls
    await page.route(`${API_URL}/api/**`, (route) => {
      const headers = {
        ...route.request().headers(),
        'x-tenant-id': 'test-tenant',
      }
      route.continue({ headers })
    })
  })

  test.describe('Authentication Flow', () => {
    test('should register a new user', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/register`)

      const randomEmail = `test${Date.now()}@topsteel.com`
      await page.fill('input[name="email"]', randomEmail)
      await page.fill('input[name="password"]', testUser.password)
      await page.fill('input[name="confirmPassword"]', testUser.password)
      await page.fill('input[name="firstName"]', testUser.firstName)
      await page.fill('input[name="lastName"]', testUser.lastName)
      await page.fill('input[name="company"]', 'TopSteel Industries')

      await page.click('button:has-text("Register")')
      await page.waitForURL(/\/marketplace/)

      // Verify user is logged in
      await expect(page.locator('[data-testid="user-menu"]')).toContainText(testUser.firstName)
    })

    test('should login with existing user', async ({ page }) => {
      await login(page, testUser.email, testUser.password)
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
    })

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/auth/login`)
      await page.fill('input[name="email"]', 'invalid@email.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      await expect(page.locator('.error-message')).toContainText(/Invalid credentials/i)
    })

    test('should logout successfully', async ({ page }) => {
      await login(page, testUser.email, testUser.password)
      await page.click('[data-testid="user-menu"]')
      await page.click('button:has-text("Sign Out")')

      await page.waitForURL(/\/auth\/login/)
      await expect(page.locator('input[name="email"]')).toBeVisible()
    })
  })

  test.describe('Product Browsing', () => {
    test('should display product catalog', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      // Check if products are displayed
      await expect(page.locator('[data-testid="product-card"]')).toHaveCount(
        await page.locator('[data-testid="product-card"]').count()
      )

      // Verify product card contains necessary information
      const firstProduct = page.locator('[data-testid="product-card"]').first()
      await expect(firstProduct.locator('[data-testid="product-name"]')).toBeVisible()
      await expect(firstProduct.locator('[data-testid="product-price"]')).toBeVisible()
      await expect(firstProduct.locator('[data-testid="add-to-cart"]')).toBeVisible()
    })

    test('should filter products by category', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      // Apply category filter
      await page.click('button:has-text("Filters")')
      await page.click('input[value="steel-beams"]')
      await page.click('button:has-text("Apply")')

      // Verify filtered results
      await page.waitForSelector('[data-testid="product-card"]')
      const products = page.locator('[data-testid="product-card"]')
      const count = await products.count()

      for (let i = 0; i < count; i++) {
        await expect(products.nth(i).locator('[data-testid="product-category"]')).toContainText(
          /Steel Beams/i
        )
      }
    })

    test('should sort products by price', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      // Sort by price ascending
      await page.selectOption('select[name="sort"]', 'price-asc')
      await page.waitForTimeout(500)

      // Get all prices
      const prices = await page.locator('[data-testid="product-price"]').allTextContents()
      const numericPrices = prices.map((p) => parseFloat(p.replace(/[^0-9.]/g, '')))

      // Verify prices are sorted
      for (let i = 1; i < numericPrices.length; i++) {
        expect(numericPrices[i]).toBeGreaterThanOrEqual(numericPrices[i - 1])
      }
    })

    test('should view product details', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      const productName = await page.locator('[data-testid="product-name"]').first().textContent()
      await page.click('[data-testid="product-card"]')

      // Verify product detail page
      await page.waitForSelector('[data-testid="product-detail"]')
      await expect(page.locator('h1')).toContainText(productName!)
      await expect(page.locator('[data-testid="product-description"]')).toBeVisible()
      await expect(page.locator('[data-testid="product-specifications"]')).toBeVisible()
      await expect(page.locator('[data-testid="add-to-cart-detail"]')).toBeVisible()
    })
  })

  test.describe('Search Functionality', () => {
    test('should search for products', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace`)
      await searchProduct(page, 'steel beam')

      // Verify search results
      await expect(page.locator('h1')).toContainText(/steel beam/i)
      await expect(page.locator('[data-testid="product-card"]')).toHaveCount(
        await page.locator('[data-testid="product-card"]').count()
      )
    })

    test('should show no results for invalid search', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace`)
      await searchProduct(page, 'xyznonexistentproduct')

      await expect(page.locator('[data-testid="no-results"]')).toBeVisible()
      await expect(page.locator('[data-testid="no-results"]')).toContainText(/No products found/i)
    })

    test('should provide search suggestions', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace`)
      await page.fill('input[placeholder*="Search"]', 'ste')

      // Wait for suggestions dropdown
      await page.waitForSelector('[data-testid="search-suggestions"]')
      const suggestions = page.locator('[data-testid="suggestion-item"]')
      await expect(suggestions).toHaveCount(await suggestions.count())

      // Click on a suggestion
      await suggestions.first().click()
      await page.waitForURL(/\/search/)
    })
  })

  test.describe('Shopping Cart', () => {
    test('should add products to cart', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      // Add first product to cart
      await page.click('[data-testid="add-to-cart"]')
      await page.waitForSelector('[data-testid="cart-notification"]')

      // Verify cart badge updates
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')

      // Add another product
      await page.locator('[data-testid="add-to-cart"]').nth(1).click()
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('2')
    })

    test('should update quantity in cart', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)
      await page.click('[data-testid="add-to-cart"]')

      // Go to cart
      await page.click('[data-testid="cart-icon"]')
      await page.waitForURL(/\/cart/)

      // Update quantity
      await page.fill('[data-testid="quantity-input"]', '5')
      await page.press('[data-testid="quantity-input"]', 'Enter')

      // Verify total updates
      await page.waitForTimeout(500)
      const total = await page.locator('[data-testid="cart-total"]').textContent()
      expect(parseFloat(total?.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0)
    })

    test('should remove product from cart', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)
      await page.click('[data-testid="add-to-cart"]')

      // Go to cart
      await page.click('[data-testid="cart-icon"]')
      await page.waitForURL(/\/cart/)

      // Remove item
      await page.click('[data-testid="remove-from-cart"]')
      await page.waitForSelector('[data-testid="empty-cart"]')

      await expect(page.locator('[data-testid="empty-cart"]')).toContainText(/Your cart is empty/i)
    })
  })

  test.describe('Checkout Process', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUser.email, testUser.password)
      await page.goto(`${BASE_URL}/marketplace/products`)
      await page.click('[data-testid="add-to-cart"]')
    })

    test('should complete checkout flow', async ({ page }) => {
      // Go to checkout
      await page.click('[data-testid="cart-icon"]')
      await page.click('button:has-text("Checkout")')

      // Step 1: Shipping
      await page.fill('input[name="firstName"]', testUser.firstName)
      await page.fill('input[name="lastName"]', testUser.lastName)
      await page.fill('input[name="email"]', testUser.email)
      await page.fill('input[name="phone"]', '+33123456789')
      await page.fill('input[name="address"]', '123 Main Street')
      await page.fill('input[name="city"]', 'Paris')
      await page.fill('input[name="postalCode"]', '75001')
      await page.selectOption('select[name="country"]', 'FR')
      await page.click('button:has-text("Continue to Billing")')

      // Step 2: Billing
      await page.click('input[type="checkbox"]:has-text("Same as shipping")')
      await page.click('button:has-text("Continue to Payment")')

      // Step 3: Payment
      await page.fill('input[name="cardNumber"]', '4242424242424242')
      await page.fill('input[name="cardHolder"]', 'John Doe')
      await page.fill('input[name="expiryDate"]', '12/25')
      await page.fill('input[name="cvv"]', '123')
      await page.click('button:has-text("Review Order")')

      // Step 4: Review
      await page.click('input[type="checkbox"]:has-text("I agree")')
      await page.click('button:has-text("Place Order")')

      // Verify order confirmation
      await page.waitForURL(/\/order-confirmation/)
      await expect(page.locator('h1')).toContainText(/Order Confirmed/i)
      await expect(page.locator('[data-testid="order-number"]')).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      await page.click('[data-testid="cart-icon"]')
      await page.click('button:has-text("Checkout")')

      // Try to continue without filling fields
      await page.click('button:has-text("Continue to Billing")')

      // Check for validation errors
      await expect(page.locator('.error-message')).toHaveCount(
        await page.locator('.error-message').count()
      )
      await expect(page.locator('.error-message').first()).toBeVisible()
    })
  })

  test.describe('User Account', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUser.email, testUser.password)
    })

    test('should view order history', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/account/orders`)

      // Check if orders are displayed
      await expect(page.locator('[data-testid="order-item"]')).toHaveCount(
        await page.locator('[data-testid="order-item"]').count()
      )
    })

    test('should manage addresses', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/account/addresses`)

      // Add new address
      await page.click('button:has-text("Add Address")')
      await page.fill('input[name="label"]', 'Home')
      await page.fill('input[name="firstName"]', testUser.firstName)
      await page.fill('input[name="lastName"]', testUser.lastName)
      await page.fill('input[name="address"]', '456 Test Avenue')
      await page.fill('input[name="city"]', 'Lyon')
      await page.fill('input[name="postalCode"]', '69001')
      await page.selectOption('select[name="country"]', 'FR')
      await page.click('button:has-text("Add Address")')

      // Verify address was added
      await expect(page.locator('[data-testid="address-card"]:has-text("Home")')).toBeVisible()
    })

    test('should update profile information', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/account/settings`)

      // Update profile
      await page.fill('input[name="phone"]', '+33987654321')
      await page.fill('input[name="company"]', 'Updated Company')
      await page.click('button:has-text("Save Changes")')

      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContainText(
        /Profile updated/i
      )
    })
  })

  test.describe('Wishlist', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, testUser.email, testUser.password)
    })

    test('should add products to wishlist', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      // Add to wishlist
      await page.click('[data-testid="add-to-wishlist"]')
      await page.waitForSelector('[data-testid="wishlist-notification"]')

      // Go to wishlist
      await page.goto(`${BASE_URL}/marketplace/account/wishlist`)
      await expect(page.locator('[data-testid="wishlist-item"]')).toHaveCount(1)
    })

    test('should move from wishlist to cart', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)
      await page.click('[data-testid="add-to-wishlist"]')

      await page.goto(`${BASE_URL}/marketplace/account/wishlist`)
      await page.click('[data-testid="move-to-cart"]')

      // Verify item moved to cart
      await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')
      await expect(page.locator('[data-testid="wishlist-item"]')).toHaveCount(0)
    })
  })

  test.describe('Product Comparison', () => {
    test('should compare products', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      // Add products to comparison
      await page.click('[data-testid="compare-product"]')
      await page.locator('[data-testid="compare-product"]').nth(1).click()

      // View comparison
      await page.click('[data-testid="compare-bar"] button:has-text("Compare")')
      await page.waitForURL(/\/compare/)

      // Verify comparison table
      await expect(page.locator('[data-testid="comparison-table"]')).toBeVisible()
      await expect(page.locator('[data-testid="comparison-product"]')).toHaveCount(2)
    })
  })

  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should display mobile menu', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace`)

      // Open mobile menu
      await page.click('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()

      // Navigate through mobile menu
      await page.click('[data-testid="mobile-menu"] a:has-text("Products")')
      await page.waitForURL(/\/products/)
    })

    test('should handle mobile checkout', async ({ page }) => {
      await page.goto(`${BASE_URL}/marketplace/products`)

      // Add to cart on mobile
      await page.click('[data-testid="add-to-cart"]')
      await page.click('[data-testid="cart-icon"]')

      // Verify mobile cart view
      await expect(page.locator('[data-testid="mobile-cart"]')).toBeVisible()
    })
  })
})

// Performance tests
test.describe('Performance', () => {
  test('should load homepage within 3 seconds', async ({ page }) => {
    const startTime = Date.now()
    await page.goto(`${BASE_URL}/marketplace`)
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(3000)
  })

  test('should handle concurrent operations', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketplace/products`)

    // Perform multiple operations simultaneously
    await Promise.all([
      page.click('[data-testid="add-to-cart"]'),
      page.click('[data-testid="add-to-wishlist"]'),
      searchProduct(page, 'steel'),
    ])

    // Verify all operations completed
    await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1')
  })
})
