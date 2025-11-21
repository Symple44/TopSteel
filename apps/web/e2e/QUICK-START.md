# E2E Tests - Quick Start Guide

## 1. Installation

```bash
# Install Playwright browsers (one-time setup)
npm run test:e2e:install
```

## 2. Start Dev Server

```bash
# In one terminal, start the dev server
npm run dev
```

Server runs at: `http://localhost:3005`

## 3. Run Tests

### Interactive UI Mode (Recommended for first run)
```bash
npm run test:e2e:ui
```

### Run All Tests
```bash
npm run test:e2e
```

### Run in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Mode (Step Through Tests)
```bash
npm run test:e2e:debug
```

## 4. View Results

```bash
# Open HTML report
npm run test:e2e:report
```

## Quick Commands Cheat Sheet

| Command | What it does |
|---------|--------------|
| `npm run test:e2e` | Run all tests (headless) |
| `npm run test:e2e:ui` | Interactive UI - Best for exploration |
| `npm run test:e2e:headed` | See browser in action |
| `npm run test:e2e:debug` | Debug with Playwright Inspector |
| `npm run test:e2e:chromium` | Run in Chromium only |
| `npm run test:e2e:firefox` | Run in Firefox only |
| `npm run test:e2e:webkit` | Run in Safari/WebKit |
| `npm run test:e2e:mobile` | Run mobile tests |
| `npm run test:e2e:report` | View HTML report |

## Run Specific Tests

### Single Test File
```bash
npx playwright test auth.spec.ts
```

### Single Test by Name
```bash
npx playwright test -g "should login successfully"
```

### Tests in One Browser
```bash
npx playwright test --project=chromium
```

### Update Snapshots (if using visual tests)
```bash
npx playwright test --update-snapshots
```

## Demo Credentials

```
Email: admin@topsteel.fr
Password: admin123
```

## Common Issues

### "Cannot connect to server"
→ Make sure dev server is running: `npm run dev`

### "Browser not found"
→ Install browsers: `npm run test:e2e:install`

### Tests are slow
→ Run specific browser: `npm run test:e2e:chromium`

### Test failed, need to debug
→ Use debug mode: `npm run test:e2e:debug`

## Test Files

- `auth.spec.ts` - Authentication tests (login, logout, session)
- `navigation.spec.ts` - Navigation and routing tests
- `settings.spec.ts` - Settings and preferences tests
- `crud-operations.spec.ts` - Create, read, update, delete tests
- `error-handling.spec.ts` - Error states and validation tests

## Next Steps

1. Run tests in UI mode to see what they do
2. Review the test files to understand patterns
3. Read the full README.md for detailed documentation
4. Add your own tests following the examples

## Support

Check the full documentation:
- `e2e/README.md` - Complete testing guide
- `E2E-TESTS-SUMMARY.md` - Implementation summary
- Playwright docs: https://playwright.dev

---

**Ready to test?**
```bash
npm run test:e2e:ui
```
