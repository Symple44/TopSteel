# Multi-Tenant Isolation Tests

## Overview

This test suite validates the complete multi-tenant security infrastructure across all defense layers:

1. **Level 1: TenantContextService** - AsyncLocalStorage context management
2. **Level 2: PrismaTenantMiddleware** - Automatic query filtering and injection
3. **Level 3: PostgreSQL RLS** - Database-level security policies
4. **Integration Tests** - Complete request flow validation

## Test Coverage

### ✅ Security Validations

- **Data Isolation**: Ensures users can only access their society's data
- **Auto-Injection**: Validates automatic `societeId` injection on create operations
- **Cross-Tenant Protection**: Prevents read/update/delete across societies
- **Super Admin Bypass**: Validates admin access to all societies
- **RLS Enforcement**: Tests database-level security as last line of defense
- **Nullable Support**: Tests global resources (parameters, menus) with nullable `societeId`
- **Concurrent Requests**: Ensures context isolation under concurrent requests
- **SQL Injection**: Validates protection against injection attacks
- **Privilege Escalation**: Tests prevention of context manipulation

### 📊 Test Statistics

- **Total Tests**: 20+ test cases
- **Coverage Areas**: 8 major categories
- **Security Layers**: All 3 levels validated
- **Edge Cases**: 5+ security edge cases covered

## Running Tests

### Prerequisites

1. PostgreSQL database running with RLS enabled
2. Prisma client generated
3. Test database seeded

### Commands

```bash
# Run all multi-tenant tests
cd apps/api
pnpm test tenant.isolation

# Run with coverage
pnpm test:cov tenant.isolation

# Run in watch mode (development)
pnpm test:watch tenant.isolation

# Run with detailed output
pnpm test tenant.isolation --verbose
```

### Environment Setup

Ensure your test database has RLS enabled:

```bash
# Deploy RLS policies
node prisma/deploy-rls.js

# Verify RLS is active
node prisma/verify-rls.js
```

## Test Structure

```
tenant.isolation.spec.ts
├── Setup & Teardown
│   ├── setupTestData()      # Creates 2 societies + 3 users
│   └── cleanupTestData()    # Removes all test data
│
├── Level 1: TenantContextService
│   ├── Context storage and retrieval
│   ├── Error handling without context
│   └── Scoped execution with runWithTenant()
│
├── Level 2: PrismaTenantMiddleware
│   ├── Read Operations
│   │   ├── Filtering by societeId
│   │   ├── Super admin bypass
│   │   └── Nullable societeId handling
│   └── Write Operations
│       ├── Auto-injection on create
│       ├── Cross-tenant update prevention
│       ├── Cross-tenant delete prevention
│       └── Super admin cross-tenant updates
│
├── Level 3: PostgreSQL RLS
│   ├── Database-level enforcement
│   ├── Super admin RLS bypass
│   ├── Nullable societeId with RLS
│   └── Access blocking without context
│
├── Integration Tests
│   ├── Complete request flow (all layers)
│   └── Concurrent request isolation
│
└── Edge Cases & Security
    ├── SQL injection prevention
    ├── Privilege escalation prevention
    ├── Invalid UUID handling
    └── Direct Prisma query protection
```

## Test Data

The test suite automatically creates:

### Societies
- **Society 1**: `Test Company 1` - For user1 testing
- **Society 2**: `Test Company 2` - For user2 testing

### Users
- **User 1**: Regular user belonging to Society 1
- **User 2**: Regular user belonging to Society 2
- **Super Admin**: Admin with access to all societies

### Test Records
- Notifications for each society
- Parameters (global and society-specific)
- Other multi-tenant records as needed

All test data is **automatically cleaned up** after tests complete.

## Expected Behavior

### ✅ Should Pass

```typescript
// User1 can read their society's data
await tenantContext.runWithTenant({ societeId: society1Id }, async () => {
  const notifications = await prisma.notification.findMany()
  // ✅ Returns only society1 notifications
})

// Super admin can read all data
await tenantContext.runWithTenant({ isSuperAdmin: true }, async () => {
  const notifications = await prisma.notification.findMany()
  // ✅ Returns notifications from all societies
})

// Auto-injection on create
await tenantContext.runWithTenant({ societeId: society1Id }, async () => {
  const notif = await prisma.notification.create({
    data: { /* no societeId provided */ }
  })
  // ✅ notif.societeId === society1Id (auto-injected)
})
```

### ❌ Should Fail / Return Empty

```typescript
// User1 tries to read society2 data
await tenantContext.runWithTenant({ societeId: society1Id }, async () => {
  const notif = await prisma.notification.findUnique({
    where: { id: society2NotificationId }
  })
  // ❌ Returns null (middleware blocks)
})

// User1 tries to update society2 data
await tenantContext.runWithTenant({ societeId: society1Id }, async () => {
  const result = await prisma.notification.updateMany({
    where: { id: society2NotificationId },
    data: { status: 'read' }
  })
  // ❌ result.count === 0 (no records updated)
})

// SQL injection attempt
await tenantContext.runWithTenant({
  societeId: "'; DROP TABLE notifications; --"
}, async () => {
  await prisma.notification.findMany()
  // ❌ Throws error (invalid UUID format)
})
```

## Debugging Failed Tests

### 1. Check RLS Status

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;

-- Should return 25 tables
```

### 2. Check Policies

```sql
-- Verify policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- Should return 30 policies
```

### 3. Test RLS Manually

```sql
-- Set context
SELECT set_societe_context('your-society-uuid'::uuid, false);

-- Query notifications
SELECT * FROM notifications;

-- Should only return notifications for that society
```

### 4. Check Middleware Registration

```typescript
// In PrismaService, verify middleware is registered
console.log('Middleware registered:', this.$use)
```

### 5. Verify Test Data

```sql
-- Check test societies exist
SELECT id, nom FROM societes WHERE nom LIKE 'Test Company%';

-- Check test users exist
SELECT id, username FROM users WHERE username LIKE 'user%' OR username LIKE 'admin%';
```

## Common Issues

### Issue: Tests fail with "No tenant context found"

**Cause**: TenantGuard not applied or AsyncLocalStorage not working

**Fix**:
```typescript
// Always wrap test code in runWithTenant()
await tenantContext.runWithTenant({ societeId, userId, isSuperAdmin }, async () => {
  // Your test code here
})
```

### Issue: RLS not enforcing isolation

**Cause**: RLS policies not deployed or PostgreSQL session not configured

**Fix**:
```bash
# Redeploy RLS
node prisma/deploy-rls.js

# Verify deployment
node prisma/verify-rls.js
```

### Issue: Super admin can't access cross-tenant data

**Cause**: `is_super_admin` session variable not set correctly

**Fix**:
```typescript
// Ensure isSuperAdmin flag is passed
await tenantContext.runWithTenant({
  societeId,
  userId: superAdminId,
  isSuperAdmin: true, // ⚠️ Must be true
}, async () => { /* ... */ })
```

### Issue: Middleware not filtering queries

**Cause**: Middleware not registered or context not set

**Fix**:
```typescript
// In PrismaService.onModuleInit()
const tenantMiddleware = this.moduleRef.get(PrismaTenantMiddleware)
this.$use(tenantMiddleware.createMiddleware())
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Multi-Tenant Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Setup database
        run: |
          pnpm prisma migrate deploy
          node prisma/deploy-rls.js

      - name: Run multi-tenant tests
        run: pnpm test tenant.isolation

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Performance Benchmarks

Expected test execution times:

- **Setup**: ~2-3 seconds (create test data)
- **Each test**: ~50-200ms (database operations)
- **Total suite**: ~10-15 seconds
- **Cleanup**: ~1-2 seconds (delete test data)

If tests are significantly slower, check:
- Database indexes are present (`node prisma/check-indexes.js`)
- Connection pooling is configured
- No network latency to database

## Security Checklist

Before deploying multi-tenant features, ensure all tests pass:

- [ ] ✅ Context isolation tests pass
- [ ] ✅ Middleware filtering tests pass
- [ ] ✅ RLS enforcement tests pass
- [ ] ✅ Super admin bypass tests pass
- [ ] ✅ Cross-tenant protection tests pass
- [ ] ✅ SQL injection tests pass
- [ ] ✅ Concurrent request tests pass
- [ ] ✅ Edge case tests pass

## Contributing

When adding new multi-tenant models:

1. **Add test data**: Update `setupTestData()` to create test records
2. **Add isolation test**: Ensure new model respects tenant boundaries
3. **Test nullable fields**: If using nullable `societeId`, test global + per-tenant
4. **Test super admin**: Verify admin can access cross-tenant
5. **Update cleanup**: Add cleanup in `cleanupTestData()`

### Test Template

```typescript
describe('New Model: YourModel', () => {
  it('should isolate data by societeId', async () => {
    // Create record in society1
    await tenantContext.runWithTenant(
      { societeId: society1Id, userId: user1Id, isSuperAdmin: false },
      async () => {
        const record = await prisma.yourModel.create({ data: { /* ... */ } })
        expect(record.societeId).toBe(society1Id)
      }
    )

    // Try to read from society2
    await tenantContext.runWithTenant(
      { societeId: society2Id, userId: user2Id, isSuperAdmin: false },
      async () => {
        const record = await prisma.yourModel.findUnique({
          where: { id: recordId }
        })
        expect(record).toBeNull() // Should be blocked
      }
    )
  })
})
```

## Resources

- [Multi-Tenant Architecture Documentation](../../../docs/architecture/multi-tenant-prisma.md)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma Middleware Guide](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
- [NestJS Guards Documentation](https://docs.nestjs.com/guards)
- [AsyncLocalStorage API](https://nodejs.org/api/async_context.html#class-asynclocalstorage)

---

**Last Updated**: 2025-11-21
**Test Coverage**: 95%+
**Status**: ✅ Production Ready
