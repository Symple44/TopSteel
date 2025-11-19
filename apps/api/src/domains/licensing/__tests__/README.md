# Licensing API Tests

## Overview

Tests E2E complets pour l'API Licensing Prisma.

## Test Coverage

### License CRUD Operations
- ✅ `POST /api/licensing/licenses` - Create license
- ✅ `GET /api/licensing/licenses/:id` - Get license by ID
- ✅ `GET /api/licensing/licenses/key/:key` - Get license by key
- ✅ `GET /api/licensing/licenses?societeId=xxx` - List licenses
- ✅ `PATCH /api/licensing/licenses/:id` - Update license
- ✅ `DELETE /api/licensing/licenses/:id` - Delete license

### License Status Management
- ✅ `POST /api/licensing/licenses/:id/activate` - Activate license
- ✅ `POST /api/licensing/licenses/:id/suspend` - Suspend license
- ✅ `POST /api/licensing/licenses/:id/renew` - Renew license
- ✅ `POST /api/licensing/licenses/validate` - Validate license key

### Features Management
- ✅ `POST /api/licensing/licenses/:id/features` - Add feature
- ✅ `GET /api/licensing/licenses/:id/features` - List features
- ✅ `PATCH /api/licensing/licenses/:id/features/:code/enable` - Enable feature
- ✅ `PATCH /api/licensing/licenses/:id/features/:code/disable` - Disable feature
- ✅ `GET /api/licensing/licenses/:id/features/:code/availability` - Check availability

### Validation & Limits
- ✅ `GET /api/licensing/licenses/:id/expiration` - Check expiration
- ✅ `GET /api/licensing/licenses/:id/limits` - Check usage limits
- ✅ Input validation (DTO validation)
- ✅ Error handling (404, 400)

## Running Tests

### Prerequisites

1. PostgreSQL test database running
2. Environment variables configured (.env.test)
3. Dependencies installed

### Execute Tests

```bash
# Run all E2E tests
cd apps/api
npm run test:e2e

# Run only Licensing tests
npm run test:e2e -- licensing-api.e2e-spec

# Run with coverage
npm run test:e2e -- --coverage
```

### Test Configuration

Tests use Jest configuration from `test/jest-e2e.json`:
- Test timeout: 30 seconds
- Pattern: `.e2e-spec.ts$`
- Environment: Node
- Transform: ts-jest

## Test Structure

### Setup (beforeAll)
1. Create NestJS testing module
2. Initialize PrismaService
3. Create test Societe for licenses
4. Setup auth token (mocked for now)

### Tests
Each test suite covers a specific API endpoint group with:
- Happy path scenarios
- Error scenarios (validation, 404, etc.)
- Edge cases

### Cleanup (afterAll)
1. Delete test licenses (cascade: features, activations, usage)
2. Delete test societe
3. Close application

## Test Data

### Test Societe
- Name: "Test Company for Licensing"
- Email: "licensing-test@example.com"
- Auto-created in `beforeAll`, deleted in `afterAll`

### Test License
Created in first test, used across multiple tests:
- Type: PROFESSIONAL
- Billing: ANNUAL
- Max Users: 10 (updated to 20 in update test)
- Max Sites: 3 (updated to 5 in update test)

## Authentication

**Current Status**: Authentication is mocked/bypassed for tests.

**TODO**: Implement proper JWT token generation for tests
- Create test user with SUPER_ADMIN role
- Generate valid JWT token
- Use token in all requests

## Known Issues

1. **Authentication**: Tests currently use mock token, guards may need to be bypassed
2. **Database**: Requires Prisma test database to be configured
3. **Cleanup**: Manual cleanup may be needed if tests fail mid-execution

## Future Improvements

- [ ] Add authentication with real JWT tokens
- [ ] Add tests for activations endpoints
- [ ] Add tests for usage tracking endpoints
- [ ] Add performance tests (response time)
- [ ] Add concurrent access tests
- [ ] Add data integrity tests (cascading deletes)

## Metrics

- **Total Tests**: 20+ test cases
- **Endpoints Covered**: 18/23 (78%)
- **Estimated Run Time**: ~10-15 seconds
- **Coverage Target**: >80%
