# PRISMA MIGRATION - PHASE 2 COMPLETION GUIDE

**Status**: 24/36 files migrated (67% complete)
**Generated**: 2025-01-25
**Remaining**: 12 services requiring schema changes or complex rewrites

---

## 📊 CURRENT STATUS

### ✅ Completed Migrations (24 files)

#### Phase 1: Controllers & DTOs (17 files)
- ✅ 13 Controllers (admin, query-builder, societes, licensing)
- ✅ 3 DTOs (create-query-builder, create-tenant, license)
- ✅ 1 Type file (notification-types)

#### Phase 2: Notification Services (5 files)
- ✅ `notification-action-executor.service.ts`
- ✅ `notification-condition-evaluator.service.ts`
- ✅ `notification-rules-engine.service.ts`
- ✅ `notification-rule.service.ts`
- ✅ `notification-rule-engine.service.ts`

#### Phase 3: Duplicate Injection Fixes (2 files)
- ✅ `menu-sync.service.ts` - Fixed 3x duplicate Prisma injections
- ✅ `user-menu-preferences.service.ts` - Fixed 2x duplicate Prisma injections

---

## 🔄 REMAINING MIGRATIONS (12 files)

### GROUP 1: Schema Mismatches (2 services)

#### 1. `system-parameters.service.ts`

**Location**: `apps/api/src/features/admin/system-parameters.service.ts.disabled`

**Current Prisma Schema**:
```prisma
model SystemParameter {
  id          String   @id @default(uuid())
  key         String   @unique @db.VarChar(255)
  societeId   String?  @map("societe_id")
  value       String   @db.Text
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
}
```

**Service Expects** (from TypeORM entity):
- `category` (ParameterCategory enum)
- `type` (ParameterType enum)
- `defaultValue` (string)
- `isEditable` (boolean)
- `isSecret` (boolean)

**Migration Steps**:

1. **Update Prisma Schema** (`apps/api/prisma/schema.prisma`):
```prisma
model SystemParameter {
  id           String   @id @default(uuid())
  key          String   @unique @db.VarChar(255)
  societeId    String?  @map("societe_id")
  value        String   @db.Text
  description  String?  @db.Text
  category     String?  @db.VarChar(100)        // NEW
  type         String?  @db.VarChar(50)         // NEW
  defaultValue String?  @map("default_value") @db.Text  // NEW
  isEditable   Boolean  @default(true) @map("is_editable")  // NEW
  isSecret     Boolean  @default(false) @map("is_secret")   // NEW
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  societe Societe? @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([key])
  @@index([category])
  @@map("system_parameters")
}
```

2. **Generate Prisma Client**:
```bash
cd apps/api
npx prisma generate
```

3. **Create Migration**:
```bash
npx prisma migrate dev --name add-system-parameter-metadata
```

4. **Fix Service Code** - Replace QueryBuilder (lines 36-54):
```typescript
// OLD - TypeORM QueryBuilder:
async findAll(query?: SystemParameterQueryDto): Promise<SystemParameter[]> {
  const queryBuilder = this._systemParameterRepository
    .createQueryBuilder('parameter')
    .orderBy('parameter.category', 'ASC')
    .addOrderBy('parameter.key', 'ASC')

  if (query?.category) {
    queryBuilder.andWhere('parameter.category = :category', { category: query.category })
  }

  if (query?.search) {
    queryBuilder.andWhere(
      '(parameter.key ILIKE :search OR parameter.description ILIKE :search)',
      { search: `%${query.search}%` }
    )
  }

  return queryBuilder.getMany()
}

// NEW - Prisma Client:
async findAll(query?: SystemParameterQueryDto): Promise<SystemParameter[]> {
  return await this.prisma.systemParameter.findMany({
    where: {
      AND: [
        query?.category ? { category: query.category } : {},
        query?.search ? {
          OR: [
            { key: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } }
          ]
        } : {}
      ]
    },
    orderBy: [
      { category: 'asc' },
      { key: 'asc' }
    ]
  })
}
```

5. **Fix Other Repository References**:
```typescript
// Line 32 - Remove repository.create:
// OLD:
const parameter = this._systemParameterRepository.create(createDto)
return this.prisma.systemparameter.create({ data: parameter })

// NEW:
return await this.prisma.systemParameter.create({
  data: {
    ...createDto,
    isEditable: createDto.isEditable ?? true,
    isSecret: createDto.isSecret ?? false
  }
})

// Line 93 - Replace remove:
// OLD:
await this._systemParameterRepository.remove(parameter)

// NEW:
await this.prisma.systemParameter.delete({
  where: { key: key }
})
```

6. **Remove `.disabled` Extension**:
```bash
cd apps/api/src/features/admin
mv system-parameters.service.ts.disabled system-parameters.service.ts
```

**Estimated Time**: 2-3 hours

---

#### 2. `user-menu-preference.service.ts`

**Location**: `apps/api/src/features/menu/services/user-menu-preference.service.ts.disabled`

**Problem**: Service expects individual fields (menuId, isVisible, order, customLabel) but Prisma uses JSON storage (menuData, preferences).

**Migration Options**:

**Option A: Redesign Prisma Schema** (Recommended)
```prisma
model UserMenuPreferenceItem {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  societeId     String?  @map("societe_id")
  menuId        String   @map("menu_id")
  isVisible     Boolean  @default(true) @map("is_visible")
  order         Int      @default(0)
  customLabel   String?  @map("custom_label")
  titleTranslations Json? @map("title_translations")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@unique([userId, menuId])
  @@index([userId])
  @@map("user_menu_preference_items")
}
```

**Option B: Rewrite Service for JSON Storage**
```typescript
async findOrCreateByUserId(userId: string) {
  let preference = await this.prisma.userMenuPreference.findUnique({
    where: { userId }
  })

  if (!preference) {
    const defaultMenuData = {
      items: [
        { menuId: 'home', isVisible: true, order: 0, customLabel: 'Accueil' },
        { menuId: 'dashboard', isVisible: true, order: 1, customLabel: 'Tableau de bord' }
        // ... more items
      ]
    }

    preference = await this.prisma.userMenuPreference.create({
      data: {
        userId,
        menuData: defaultMenuData,
        preferences: {}
      }
    })
  }

  return preference.menuData.items
}
```

**Recommended**: Use Option A (new schema) for better type safety and query performance.

**Estimated Time**: 4-6 hours

---

### GROUP 2: Complex QueryBuilder Services (2 services)

#### 3. `menu-configuration.service.ts`

**Location**: `apps/api/src/features/admin/services/menu-configuration.service.ts.disabled`

**Issues**:
1. 4x duplicate `private readonly prisma: PrismaService` (lines 106-109)
2. TypeORM QueryBuilder usage (lines 240-248)
3. Missing entity imports

**Migration Steps**:

1. **Fix Duplicate Injections**:
```typescript
// OLD (lines 106-109):
constructor(
  private readonly prisma: PrismaService,
  private readonly prisma: PrismaService,
  private readonly prisma: PrismaService,
  private readonly prisma: PrismaService
) {}

// NEW:
constructor(
  private readonly prisma: PrismaService
) {}
```

2. **Comment Out Entity Imports** (lines 11-14):
```typescript
// OLD:
import { MenuConfiguration } from '../../../domains/admin/entities/menu-configuration.entity'
import { MenuItem, MenuItemType } from '../../../domains/admin/entities/menu-item.entity'
import { MenuItemPermission } from '../entities/menu-item-permission.entity'
import { MenuItemRole } from '../entities/menu-item-role.entity'

// NEW:
// MenuConfiguration, MenuItem, MenuItemPermission, MenuItemRole entities removed
// Using Prisma types instead
```

3. **Replace QueryBuilder** (lines 240-248):
```typescript
// OLD:
async activateConfiguration(id: string): Promise<void> {
  await this._configRepository
    .createQueryBuilder()
    .update(MenuConfiguration)
    .set({ isActive: false })
    .where('isActive = :isActive', { isActive: true })
    .execute()

  await this._configRepository.update(id, { isActive: true })
}

// NEW:
async activateConfiguration(id: string): Promise<void> {
  // Deactivate all configurations
  await this.prisma.menuConfiguration.updateMany({
    where: { isActive: true },
    data: { isActive: false }
  })

  // Activate selected configuration
  await this.prisma.menuConfiguration.update({
    where: { id },
    data: { isActive: true }
  })
}
```

4. **Re-enable Service**:
```bash
mv menu-configuration.service.ts.disabled menu-configuration.service.ts
```

**Estimated Time**: 3-4 hours

---

#### 4. `license-management.service.ts`

**Location**: `apps/api/src/features/societes/services/license-management.service.ts.disabled`

**Issues**:
- 5x duplicate `private readonly prisma: PrismaService`
- 15+ TypeORM QueryBuilder usages throughout
- Extensive `Repository` pattern usage

**Migration Strategy**: Complete rewrite required

**Key Conversion Examples**:

```typescript
// Example 1: Complex Join Query
// OLD:
private async getActiveUserCount(societeId: string): Promise<number> {
  const result = await this.userRepository
    .createQueryBuilder('user')
    .innerJoin('user_societe_roles', 'usr', 'usr.userId = user.id')
    .where('usr.societeId = :societeId', { societeId })
    .andWhere('usr.isActive = :usrActive', { usrActive: true })
    .andWhere('user.actif = :userActive', { userActive: true })
    .getCount()
  return result
}

// NEW:
private async getActiveUserCount(societeId: string): Promise<number> {
  return await this.prisma.user.count({
    where: {
      actif: true,
      userSocieteRoles: {
        some: {
          societeId,
          isActive: true
        }
      }
    }
  })
}

// Example 2: JSON Query
// OLD:
const result = await this.sessionRepository
  .createQueryBuilder('session')
  .where('session.metadata ::jsonb @> :metadata', {
    metadata: JSON.stringify({ societeId })
  })
  .andWhere('session.isActive = :isActive', { isActive: true })
  .getCount()

// NEW:
const result = await this.prisma.userSession.count({
  where: {
    isActive: true,
    metadata: {
      path: ['societeId'],
      equals: societeId
    }
  }
})

// Example 3: Date Comparison with LessThan
// OLD:
const expiredLicenses = await this.licenseRepository.findMany({
  where: {
    status: LicenseStatus.ACTIVE,
    expiresAt: LessThan(new Date())
  }
})

// NEW:
const expiredLicenses = await this.prisma.societeLicense.findMany({
  where: {
    status: 'ACTIVE',
    expiresAt: {
      lt: new Date()
    }
  }
})
```

**Full Migration Steps**:
1. Remove 4 duplicate Prisma injections (lines 54-57)
2. Replace all `this.licenseRepository` with `this.prisma.societeLicense`
3. Replace all `this.userRepository` with `this.prisma.user`
4. Replace all `this.sessionRepository` with `this.prisma.userSession`
5. Replace all `this.societeRepository` with `this.prisma.societe`
6. Replace all `this.notificationRepository` with `this.prisma.notification`
7. Convert all QueryBuilder queries to Prisma equivalents
8. Test thoroughly with unit tests

**Estimated Time**: 6-8 hours

---

### GROUP 3: @InjectDataSource Services (8 services)

All these services use `@InjectDataSource('tenant'|'auth')` for raw SQL execution.

#### Migration Pattern (Apply to all 8 services):

```typescript
// OLD:
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'

@Injectable()
export class SomeService {
  constructor(
    @InjectDataSource('tenant') private dataSource: DataSource
  ) {}

  async executeSql(sql: string) {
    return await this.dataSource.query(sql)
  }

  async executeInTransaction(queries: string[]) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      for (const query of queries) {
        await queryRunner.query(query)
      }
      await queryRunner.commitTransaction()
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }
}

// NEW:
import { PrismaService } from '../../../core/database/prisma/prisma.service'

@Injectable()
export class SomeService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async executeSql(sql: string) {
    return await this.prisma.$queryRawUnsafe(sql)
  }

  async executeInTransaction(queries: string[]) {
    await this.prisma.$transaction(async (tx) => {
      for (const query of queries) {
        await tx.$executeRawUnsafe(query)
      }
    })
  }
}
```

#### Services Requiring This Migration:

5. **sql-executor.controller.ts** (`features/query-builder/controllers`)
   - Replace `@InjectDataSource('tenant')`
   - Use `prisma.$queryRawUnsafe()` for SELECT
   - Use `prisma.$executeRawUnsafe()` for INSERT/UPDATE/DELETE

6. **query-builder-executor.service.ts** (`features/query-builder/services`)
   - Similar pattern to sql-executor
   - Add validation/sanitization before raw queries

7. **query-builder-security.service.ts** (`features/query-builder/security`)
   - Migrate SQL injection protection
   - Use Prisma's built-in parameter binding

8. **schema-introspection.service.ts** (`features/query-builder/services`)
   - Replace `INFORMATION_SCHEMA` queries
   - Use `prisma.$queryRaw` with type safety

9. **database-integrity.service.ts** (`features/admin/services`)
   - Migrate database constraint checks
   - Use Prisma introspection where possible

10. **database-stats.service.ts** (`features/admin/services`)
    - Replace `pg_stat_*` queries
    - Use `prisma.$queryRaw<StatsResult>(sql)`

11. **database-enum-fix.service.ts** (`features/admin/services`)
    - Migrate ALTER TYPE commands
    - Use `prisma.$executeRaw` for DDL

12. **migration-manager.service.ts** (`features/database-core/services`)
    - Replace custom migration logic
    - Use `prisma migrate` CLI programmatically

**Estimated Time**: 10-15 hours total (1-2 hours each)

---

## 🛠️ MIGRATION UTILITIES

### Quick Reference: TypeORM → Prisma Conversions

| TypeORM | Prisma |
|---------|--------|
| `repository.find()` | `prisma.model.findMany()` |
| `repository.findOne()` | `prisma.model.findFirst()` |
| `repository.findOneBy({ id })` | `prisma.model.findUnique({ where: { id } })` |
| `repository.create(data)` | Plain object (no .create needed) |
| `repository.save(entity)` | `prisma.model.create({ data })` or `.update()` |
| `repository.remove(entity)` | `prisma.model.delete({ where: { id } })` |
| `repository.count()` | `prisma.model.count()` |
| `.createQueryBuilder()` | Use `.findMany({ where, orderBy })` |
| `.where('field = :value')` | `where: { field: value }` |
| `.andWhere()` | `where: { AND: [...] }` |
| `.orWhere()` | `where: { OR: [...] }` |
| `.orderBy('field', 'ASC')` | `orderBy: { field: 'asc' }` |
| `.getMany()` | Direct return from findMany |
| `.getOne()` | Direct return from findFirst |
| `.getRawMany()` | `prisma.$queryRaw` |
| `LessThan(value)` | `{ lt: value }` |
| `MoreThan(value)` | `{ gt: value }` |
| `Between(a, b)` | `{ gte: a, lte: b }` |
| `Like('%value%')` | `{ contains: 'value' }` |
| `ILike('%value%')` | `{ contains: 'value', mode: 'insensitive' }` |
| `In([1, 2, 3])` | `{ in: [1, 2, 3] }` |
| `IsNull()` | `{ equals: null }` or `null` |
| `Not(value)` | `{ not: value }` |
| `dataSource.query()` | `prisma.$queryRawUnsafe()` |
| `queryRunner.query()` | `prisma.$executeRawUnsafe()` |
| Transaction with QueryRunner | `prisma.$transaction()` |

---

## ✅ TESTING CHECKLIST

After each migration:

- [ ] Run TypeScript compilation: `npx tsc --noEmit`
- [ ] Run linter: `pnpm lint`
- [ ] Run unit tests: `pnpm test`
- [ ] Start API: `pnpm dev`
- [ ] Verify no console errors
- [ ] Test affected endpoints with Swagger
- [ ] Check database queries in logs
- [ ] Run integration tests if available

---

## 📋 PRIORITY ORDER

Recommended migration order:

1. **system-parameters.service.ts** (MEDIUM, 2-3h) - Add schema columns first
2. **menu-configuration.service.ts** (MEDIUM-HIGH, 3-4h) - Fix duplicates + QueryBuilder
3. **license-management.service.ts** (HIGH, 6-8h) - Complete rewrite
4. **user-menu-preference.service.ts** (HIGH, 4-6h) - Schema redesign
5. **sql-executor.controller.ts** (MEDIUM, 1-2h) - Raw SQL migration
6. **query-builder-executor.service.ts** (MEDIUM, 1-2h) - Raw SQL migration
7. **query-builder-security.service.ts** (MEDIUM, 1-2h) - Security validation
8. **schema-introspection.service.ts** (MEDIUM, 1-2h) - Introspection queries
9. **database-integrity.service.ts** (LOW, 1-2h) - Constraint checks
10. **database-stats.service.ts** (LOW, 1-2h) - Statistics queries
11. **database-enum-fix.service.ts** (LOW, 1-2h) - DDL commands
12. **migration-manager.service.ts** (LOW, 2-3h) - Use Prisma migrate

**Total Remaining Effort**: 25-35 hours

---

## 🎯 SUCCESS CRITERIA

Migration is complete when:

- ✅ All 36 files have `.disabled` extension removed
- ✅ TypeScript compilation: 0 errors
- ✅ All tests pass
- ✅ API starts without errors
- ✅ No TypeORM imports in active code
- ✅ All Prisma queries functional
- ✅ Database migrations applied successfully

---

## 📞 SUPPORT

If you encounter issues:

1. Check Prisma documentation: https://www.prisma.io/docs
2. Compare with working Prisma services in `domains/*/prisma/`
3. Test queries in Prisma Studio: `npx prisma studio`
4. Review Prisma migration logs: `npx prisma migrate status`

---

**Generated**: 2025-01-25
**Phase 1 Complete**: 24/36 files (67%)
**Phase 2 Target**: 36/36 files (100%)
**Estimated Completion**: 25-35 additional hours
