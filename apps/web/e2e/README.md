# E2E Tests - TopSteel ERP

Comprehensive End-to-End testing suite using Playwright for the TopSteel ERP frontend application.

## Overview

This directory contains E2E tests covering critical user flows:

- **Authentication** - Login, logout, session management, MFA
- **Navigation** - Sidebar, menus, routing, breadcrumbs
- **Settings** - Appearance, notifications, preferences
- **CRUD Operations** - Create, read, update, delete for entities
- **Error Handling** - 404, network errors, validation, error boundaries

## Directory Structure

```
e2e/
├── fixtures/
│   └── test-data.ts          # Test data (users, companies, articles, etc.)
├── utils/
│   └── test-helpers.ts       # Reusable helper functions
├── auth.spec.ts              # Authentication tests
├── navigation.spec.ts        # Navigation tests
├── settings.spec.ts          # Settings tests
├── crud-operations.spec.ts   # CRUD operation tests
├── error-handling.spec.ts    # Error handling tests
└── README.md                 # This file
```

## Prerequisites

1. Install Playwright browsers:
   ```bash
   npm run test:e2e:install
   ```

2. Make sure the dev server is running:
   ```bash
   npm run dev
   ```
   The server should be available at `http://localhost:3005`

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run with UI (interactive mode)
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run in debug mode
```bash
npm run test:e2e:debug
```

### Run specific browser
```bash
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### Run mobile tests
```bash
npm run test:e2e:mobile
```

### Run specific test file
```bash
npx playwright test auth.spec.ts
```

### Run specific test
```bash
npx playwright test -g "should login successfully"
```

### View test report
```bash
npm run test:e2e:report
```

## Test Configuration

Configuration is in `playwright.config.ts`:

- **Base URL**: http://localhost:3005
- **Browsers**: Chromium, Firefox, WebKit
- **Viewports**: Desktop (1920x1080), Mobile, Tablet
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: On failure only
- **Videos**: On first retry only
- **Trace**: On first retry only

## Test Data

Test data is defined in `e2e/fixtures/test-data.ts`:

### Demo Users
```typescript
admin@topsteel.fr / admin123
```

### Test Entities
- Articles (steel beams, sheets, bars)
- Partners (clients, suppliers)
- Projects
- Orders

## Helper Functions

Located in `e2e/utils/test-helpers.ts`:

### Authentication
```typescript
await loginAsAdmin(page)
await login(page, email, password)
await logout(page)
```

### Navigation
```typescript
await navigateToMenuItem(page, 'Dashboard')
await waitForLoad(page)
```

### Forms
```typescript
await fillForm(page, { name: 'Test', email: 'test@example.com' })
```

### Utilities
```typescript
await waitForToast(page, 'Success')
await takeScreenshot(page, 'screenshot-name')
await clearSession(page)
```

### API Mocking
```typescript
await mockAPIResponse(page, '**/api/articles**', { data: [] })
await waitForAPIResponse(page, '**/api/articles**')
```

## Test Organization

Each test file follows this structure:

```typescript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: login, navigate, etc.
  })

  test('should do something', async ({ page }) => {
    // Arrange
    await page.goto('/path')

    // Act
    await page.click('button')

    // Assert
    await expect(page.locator('h1')).toHaveText('Expected')
  })

  test.afterEach(async ({ page }) => {
    // Cleanup (optional)
  })
})
```

## Best Practices

### 1. Use data-testid attributes
Add `data-testid` attributes to critical UI elements for reliable selection:
```tsx
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.click('[data-testid="submit-button"]')
```

### 2. Wait for stability
Always wait for the page to be stable before assertions:
```typescript
await waitForLoad(page)
await page.waitForLoadState('networkidle')
```

### 3. Isolate tests
Each test should be independent and not rely on others:
```typescript
test.beforeEach(async ({ page }) => {
  await clearSession(page)
  await loginAsAdmin(page)
})
```

### 4. Use meaningful selectors
Prefer semantic selectors over CSS classes:
```typescript
// Good
await page.click('button:has-text("Save")')
await page.locator('[aria-label="Close"]')

// Avoid
await page.click('.btn-primary')
```

### 5. Handle async operations
Always await promises and handle loading states:
```typescript
await page.click('button')
await waitForLoadingToComplete(page)
await expect(page.locator('.result')).toBeVisible()
```

### 6. Screenshot on failure
Screenshots are automatically taken on failure. You can also take manual screenshots:
```typescript
await takeScreenshot(page, 'before-action')
```

## Debugging Tests

### 1. Run in headed mode
```bash
npm run test:e2e:headed
```

### 2. Use Playwright Inspector
```bash
npm run test:e2e:debug
```

### 3. Add debug statements
```typescript
await page.pause() // Pause execution
console.log(await page.locator('h1').textContent())
```

### 4. Check test artifacts
- Screenshots: `test-results/`
- Videos: `test-results/`
- Traces: `test-results/`

### 5. View HTML report
```bash
npm run test:e2e:report
```

## CI/CD Integration

Tests are configured to run in CI with:
- 2 retries on failure
- Sequential execution (1 worker)
- Full reporting (HTML, JSON)

Example GitHub Actions workflow:
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npm run test:e2e:install

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Tests fail with timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connection

### Cannot find element
- Use Playwright Inspector to inspect selectors
- Check if element is in shadow DOM
- Wait for element to be visible first

### Flaky tests
- Add proper wait conditions
- Use `waitForLoadState('networkidle')`
- Avoid hard-coded timeouts
- Check for race conditions

### Browser not launching
- Run `npm run test:e2e:install`
- Check system requirements
- Verify browser binaries are installed

## Adding New Tests

1. Create a new test file in `e2e/`:
   ```typescript
   // e2e/my-feature.spec.ts
   import { test, expect } from '@playwright/test'
   import { loginAsAdmin, waitForLoad } from './utils/test-helpers'

   test.describe('My Feature', () => {
     test('should work', async ({ page }) => {
       await loginAsAdmin(page)
       await page.goto('/my-feature')
       await waitForLoad(page)
       // Add assertions
     })
   })
   ```

2. Add test data to `fixtures/test-data.ts` if needed

3. Run the test:
   ```bash
   npx playwright test my-feature.spec.ts
   ```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Selectors](https://playwright.dev/docs/selectors)

## Test Coverage

Current test coverage:

- ✅ Authentication (login, logout, MFA, sessions)
- ✅ Navigation (sidebar, menus, routing)
- ✅ Settings (appearance, notifications, profile)
- ✅ CRUD Operations (articles, partners)
- ✅ Error Handling (404, validation, network)

### Planned additions:
- Advanced search and filtering
- File uploads
- Data export
- Print functionality
- Multi-language support
- Accessibility tests
- Performance tests

## Maintenance

### Update test data
Edit `e2e/fixtures/test-data.ts` to update test users, companies, etc.

### Update helpers
Add new helper functions to `e2e/utils/test-helpers.ts`

### Update configuration
Modify `playwright.config.ts` for timeout, retries, viewports, etc.

## Support

For issues or questions:
1. Check this README
2. Check Playwright documentation
3. Contact the development team
