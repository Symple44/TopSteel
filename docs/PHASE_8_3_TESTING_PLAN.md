# Phase 8.3 - Testing Plan 🧪

**Date:** 2025-01-18
**Status:** 📋 PLANNED
**Objectif:** Valider le socle Prisma avec tests complets (services + contrôleurs)

---

## Contexte

Après Phase 8.2, nous avons un **socle Prisma 100% propre** (0 erreurs TypeScript) avec:
- ✅ **77 endpoints** (28 Phase 7 + 49 Phase 8.1)
- ✅ **16 contrôleurs Prisma**
- ✅ **20+ services Prisma**

**Objectif Phase 8.3:** Valider le socle avec une couverture de tests complète avant migration TopTime.

---

## Infrastructure de Tests Existante

### Framework et Outils

**Tests Unitaires:**
- ✅ **Vitest** v3.2.4 (test runner moderne, rapide)
- ✅ **@nestjs/testing** v11.1.6 (NestJS testing utilities)
- ✅ **@vitest/coverage-v8** v3.2.4 (code coverage)
- ✅ **@vitest/ui** v3.2.4 (test UI)

**Tests E2E:**
- ✅ **Jest** (configuration: `test/jest-e2e.json`)

**Scripts disponibles:**
```json
"test": "vitest",                    // Run unit tests
"test:watch": "vitest --watch",      // Watch mode
"test:ui": "vitest --ui",            // UI mode
"test:cov": "vitest run --coverage", // Coverage report
"test:e2e": "jest --config ./test/jest-e2e.json"
```

### Pattern de Tests Existants

**Exemple (TypeORM - à adapter pour Prisma):**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('ServiceName', () => {
  let service: ServiceName
  let mockRepository: MockedRepository

  beforeEach(() => {
    // Setup mocks
    mockRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      // ...
    }

    service = new ServiceName(mockRepository)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should perform operation', async () => {
    // Arrange
    mockRepository.findOne.mockResolvedValue(mockData)

    // Act
    const result = await service.method()

    // Assert
    expect(result).toEqual(expectedResult)
    expect(mockRepository.findOne).toHaveBeenCalledWith(expectedArgs)
  })
})
```

---

## Stratégie de Tests Phase 8.3

### Priorités

**Phase 8.3.1 - Tests Critiques (Priorité HAUTE)** ⭐⭐⭐
1. **AuthPrismaService** (authentification = critique sécurité)
2. **UserPrismaService** (gestion utilisateurs = core)
3. **RolePrismaService** (permissions = sécurité)
4. **SocietePrismaService** (multi-tenant = infrastructure)

**Phase 8.3.2 - Tests Infrastructure (Priorité MOYENNE)** ⭐⭐
1. **ModulePrismaService**
2. **GroupsPrismaService**
3. **SocieteUserPrismaService**
4. **SocieteLicensePrismaService**
5. **SitePrismaService**

**Phase 8.3.3 - Tests Contrôleurs (Priorité MOYENNE)** ⭐⭐
- Tests E2E pour tous les contrôleurs (77 endpoints)
- Validation DTOs, guards, responses

**Phase 8.3.4 - Tests Complémentaires (Priorité BASSE)** ⭐
- Autres services Prisma
- Tests d'intégration complexes
- Tests de charge/performance

---

## Services Prisma à Tester

### Domaine Auth (7 services)

| Service | Fichier | Priorité | Méthodes Clés |
|---------|---------|----------|---------------|
| **AuthPrismaService** | `auth-prisma.service.ts` | ⭐⭐⭐ HAUTE | login, validateUser, createUser, refreshToken |
| **UserPrismaService** | `user-prisma.service.ts` | ⭐⭐⭐ HAUTE | createUser, getUserById, updateUser, deleteUser |
| **RolePrismaService** | `role-prisma.service.ts` | ⭐⭐⭐ HAUTE | assignPermission, hasPermission, getUserRoles |
| **ModulePrismaService** | `module-prisma.service.ts` | ⭐⭐ MOYENNE | createModule, getModuleByName, getAllModules |
| **GroupsPrismaService** | `groups-prisma.service.ts` | ⭐⭐ MOYENNE | createGroup, addUserToGroup, getUserGroups |
| **PermissionPrismaService** | `permission-prisma.service.ts` | ⭐⭐ MOYENNE | createPermission, checkPermission |
| **SessionPrismaService** | `session-prisma.service.ts` | ⭐⭐ MOYENNE | createSession, validateSession, invalidateSession |

### Domaine Sociétés (5 services)

| Service | Fichier | Priorité | Méthodes Clés |
|---------|---------|----------|---------------|
| **SocietePrismaService** | `societe-prisma.service.ts` | ⭐⭐⭐ HAUTE | createSociete, getSocieteById, societeExists |
| **SocieteUserPrismaService** | `societe-user-prisma.service.ts` | ⭐⭐ MOYENNE | addUserToSociete, removeUser, updatePermissions |
| **SocieteLicensePrismaService** | `societe-license-prisma.service.ts` | ⭐⭐ MOYENNE | createLicense, isLicenseValid, checkUserLimit |
| **UserSocieteRolePrismaService** | `user-societe-role-prisma.service.ts` | ⭐⭐ MOYENNE | assignRole, hasRole, getUserRoles |
| **SitePrismaService** | `site-prisma.service.ts` | ⭐⭐ MOYENNE | createSite, getSitesBySociete, searchSites |

### Domaine Admin (3 services)

| Service | Fichier | Priorité | Méthodes Clés |
|---------|---------|----------|---------------|
| **MenuConfigurationPrismaService** | `menu-configuration-prisma.service.ts` | ⭐ BASSE | createMenu, getActiveMenu, updateMenu |
| **MenuItemPrismaService** | `menu-item-prisma.service.ts` | ⭐ BASSE | createMenuItem, getMenuTree, reorderItems |
| **SystemParameterPrismaService** | `system-parameter-prisma.service.ts` | ⭐ BASSE | createParameter, getParameter, updateParameter |

### Domaine Notifications (1 service)

| Service | Fichier | Priorité | Méthodes Clés |
|---------|---------|----------|---------------|
| **NotificationPrismaService** | `notification-prisma.service.ts` | ⭐ BASSE | createNotification, markAsRead, getUserNotifications |

**Total:** 16 services Prisma à tester

---

## Contrôleurs Prisma à Tester (E2E)

### Phase 7 - Contrôleurs Core (28 endpoints)

| Contrôleur | Endpoints | Fichier |
|------------|-----------|---------|
| **UsersPrismaController** | 8 | `users-prisma.controller.ts` |
| **RolesPrismaController** | 10 | `roles-prisma.controller.ts` |
| **SessionsPrismaController** | 10 | `sessions-prisma.controller.ts` |

### Phase 8.1 - Contrôleurs Multi-Tenant (49 endpoints)

| Contrôleur | Endpoints | Fichier |
|------------|-----------|---------|
| **SocietesPrismaController** | 11 | `societes-prisma.controller.ts` |
| **SocieteLicensesPrismaController** | 13 | `societe-licenses-prisma.controller.ts` |
| **SocieteUsersPrismaController** | 13 | `societe-users-prisma.controller.ts` |
| **SitesPrismaController** | 12 | `sites-prisma.controller.ts` |

**Total:** 77 endpoints à tester en E2E

---

## Plan de Tests Détaillé

### Phase 8.3.1 - Tests Services Critiques ⭐⭐⭐

#### 1. AuthPrismaService Tests

**Fichier:** `src/domains/auth/prisma/__tests__/auth-prisma.service.spec.ts`

**Scénarios:**
```typescript
describe('AuthPrismaService', () => {
  describe('validateUser', () => {
    ✅ should validate user with correct credentials
    ✅ should return null for invalid credentials
    ✅ should return null for inactive user
    ✅ should exclude passwordHash from result
    ✅ should handle non-existent user
  })

  describe('login', () => {
    ✅ should login user successfully
    ✅ should create session record
    ✅ should return JWT tokens
    ✅ should fail login with incorrect password
    ✅ should fail login for inactive user
  })

  describe('createUser', () => {
    ✅ should create user with hashed password
    ✅ should prevent duplicate email
    ✅ should prevent duplicate username
    ✅ should set default values
    ✅ should handle validation errors
  })

  describe('refreshToken', () => {
    ✅ should refresh tokens successfully
    ✅ should invalidate old refresh token
    ✅ should fail with invalid refresh token
  })
})
```

**Mocks nécessaires:**
- `PrismaService` (user.findUnique, user.create, session.create)
- `JwtService` (sign, verify)
- `bcrypt` (hash, compare)

#### 2. UserPrismaService Tests

**Fichier:** `src/domains/users/prisma/__tests__/user-prisma.service.spec.ts`

**Scénarios:**
```typescript
describe('UserPrismaService', () => {
  describe('createUser', () => {
    ✅ should create user with required fields
    ✅ should hash password automatically
    ✅ should set isActive=true by default
    ✅ should handle optional fields (metadata, settings)
    ✅ should validate unique email/username
  })

  describe('getUserById', () => {
    ✅ should return user without password
    ✅ should return null for non-existent user
    ✅ should include relations when requested
  })

  describe('updateUser', () => {
    ✅ should update user fields
    ✅ should not allow passwordHash update
    ✅ should handle metadata conversion
    ✅ should validate unique constraints
  })

  describe('deleteUser', () => {
    ✅ should soft delete user (set deletedAt)
    ✅ should prevent hard delete if has dependencies
  })

  describe('searchUsers', () => {
    ✅ should search by email/username/name
    ✅ should support pagination
    ✅ should filter by isActive
    ✅ should exclude deleted users
  })
})
```

#### 3. RolePrismaService Tests

**Fichier:** `src/domains/auth/prisma/__tests__/role-prisma.service.spec.ts`

**Scénarios:**
```typescript
describe('RolePrismaService', () => {
  describe('createRole', () => {
    ✅ should create role with permissions
    ✅ should prevent duplicate role names
    ✅ should handle system roles protection
  })

  describe('assignPermission', () => {
    ✅ should assign permission to role
    ✅ should prevent duplicate assignments
    ✅ should validate permission exists
  })

  describe('hasPermission', () => {
    ✅ should check user permission via role
    ✅ should check direct user permissions
    ✅ should return false for non-existent permission
  })

  describe('getUserRoles', () => {
    ✅ should return all user roles
    ✅ should include role permissions
    ✅ should exclude inactive roles
  })
})
```

#### 4. SocietePrismaService Tests

**Fichier:** `src/domains/societes/prisma/__tests__/societe-prisma.service.spec.ts`

**Scénarios:**
```typescript
describe('SocietePrismaService', () => {
  describe('createSociete', () => {
    ✅ should create societe with unique code
    ✅ should create with databaseName
    ✅ should prevent duplicate codes
    ✅ should set isActive=true by default
  })

  describe('getSocieteById', () => {
    ✅ should return societe by ID
    ✅ should return null for non-existent
  })

  describe('getSocieteWithRelations', () => {
    ✅ should include license
    ✅ should include users
    ✅ should include sites
    ✅ should include roles
  })

  describe('societeExists', () => {
    ✅ should check existence by code
    ✅ should return false for non-existent
  })
})
```

**Estimation:** 4 services × ~20 tests = **80 tests unitaires**

---

### Phase 8.3.2 - Tests Infrastructure (5 services)

**Services:**
1. ModulePrismaService (~15 tests)
2. GroupsPrismaService (~20 tests)
3. SocieteUserPrismaService (~25 tests)
4. SocieteLicensePrismaService (~20 tests)
5. SitePrismaService (~20 tests)

**Estimation:** **100 tests unitaires**

---

### Phase 8.3.3 - Tests E2E Contrôleurs

**Approche:** Tester chaque endpoint avec:
- ✅ Request valide (200/201)
- ✅ Request invalide (400)
- ✅ Unauthorized (401)
- ✅ Forbidden (403)
- ✅ Not Found (404)

**Exemple E2E Test:**
```typescript
// src/domains/users/prisma/__tests__/users-prisma.controller.e2e.spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'

describe('UsersPrismaController (E2E)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    // Login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth-prisma/login')
      .send({ email: 'admin@test.com', password: 'test123' })

    authToken = loginResponse.body.access_token
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /users-prisma', () => {
    it('should return paginated users', async () => {
      const response = await request(app.getHttpServer())
        .get('/users-prisma?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('data')
      expect(response.body).toHaveProperty('meta')
      expect(response.body.meta.total).toBeGreaterThanOrEqual(0)
    })

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/users-prisma')
        .expect(401)
    })
  })

  describe('POST /users-prisma', () => {
    it('should create user', async () => {
      const newUser = {
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      }

      const response = await request(app.getHttpServer())
        .post('/users-prisma')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201)

      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.email).toBe(newUser.email)
      expect(response.body.data).not.toHaveProperty('passwordHash')
    })

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/users-prisma')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ email: 'invalid' })
        .expect(400)
    })
  })
})
```

**Estimation:** 77 endpoints × 3 tests moyens = **~230 tests E2E**

---

## Objectifs de Couverture

### Couverture par Type

| Type | Objectif | Priorité |
|------|----------|----------|
| **Services critiques** | >90% | ⭐⭐⭐ |
| **Services infrastructure** | >80% | ⭐⭐ |
| **Contrôleurs (E2E)** | 100% endpoints | ⭐⭐⭐ |
| **Autres services** | >70% | ⭐ |

### Couverture Globale

**Objectif:** >85% code coverage

**Commande:**
```bash
pnpm test:cov
```

---

## Outils de Mocking pour Prisma

### PrismaService Mock Pattern

```typescript
import { PrismaService } from '@/core/database/prisma/prisma.service'
import { vi } from 'vitest'

const createMockPrismaService = () => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  role: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  societe: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  // ... autres modèles
  $transaction: vi.fn((callback) => callback(this)),
})

// Usage
const mockPrisma = createMockPrismaService()
const service = new UserPrismaService(mockPrisma as any)
```

### Alternative: Prisma Mock Library

**Option:** `prisma-mock` ou `jest-mock-extended` (adapter pour vitest)

```typescript
import { mockDeep } from 'jest-mock-extended'
import { PrismaClient } from '@prisma/client'

const prismaMock = mockDeep<PrismaClient>()
```

---

## Structure des Fichiers de Tests

```
apps/api/src/
├── domains/
│   ├── auth/
│   │   └── prisma/
│   │       ├── __tests__/
│   │       │   ├── auth-prisma.service.spec.ts         ⭐⭐⭐
│   │       │   ├── user-prisma.service.spec.ts         ⭐⭐⭐
│   │       │   ├── role-prisma.service.spec.ts         ⭐⭐⭐
│   │       │   ├── module-prisma.service.spec.ts       ⭐⭐
│   │       │   ├── groups-prisma.service.spec.ts       ⭐⭐
│   │       │   ├── permission-prisma.service.spec.ts   ⭐⭐
│   │       │   └── session-prisma.service.spec.ts      ⭐⭐
│   │       └── ...services.ts
│   │
│   ├── users/
│   │   └── prisma/
│   │       ├── __tests__/
│   │       │   ├── users-prisma.controller.e2e.spec.ts
│   │       │   └── user-prisma.service.spec.ts
│   │       └── ...
│   │
│   ├── societes/
│   │   └── prisma/
│   │       ├── __tests__/
│   │       │   ├── societe-prisma.service.spec.ts            ⭐⭐⭐
│   │       │   ├── societe-user-prisma.service.spec.ts       ⭐⭐
│   │       │   ├── societe-license-prisma.service.spec.ts    ⭐⭐
│   │       │   ├── site-prisma.service.spec.ts               ⭐⭐
│   │       │   ├── societes-prisma.controller.e2e.spec.ts
│   │       │   ├── societe-users-prisma.controller.e2e.spec.ts
│   │       │   └── ...
│   │       └── ...
│   │
│   └── admin/
│       └── prisma/
│           ├── __tests__/
│           │   ├── menu-configuration-prisma.service.spec.ts  ⭐
│           │   └── ...
│           └── ...
│
└── __tests__/
    └── helpers/
        ├── prisma-mock-factory.ts      // Helper pour créer mocks Prisma
        ├── test-data-factory.ts        // Factory pour données de test
        └── auth-helper.ts              // Helper pour authentification E2E
```

---

## Timeline Estimée

### Phase 8.3.1 - Services Critiques (4 services)
- **Durée:** 2-3 jours
- **Tests:** ~80 tests unitaires
- **Fichiers:** 4 fichiers .spec.ts

### Phase 8.3.2 - Services Infrastructure (5 services)
- **Durée:** 2-3 jours
- **Tests:** ~100 tests unitaires
- **Fichiers:** 5 fichiers .spec.ts

### Phase 8.3.3 - Tests E2E (7 contrôleurs)
- **Durée:** 3-4 jours
- **Tests:** ~230 tests E2E
- **Fichiers:** 7 fichiers .e2e.spec.ts

### Phase 8.3.4 - Tests Complémentaires (optionnel)
- **Durée:** 1-2 jours
- **Tests:** ~50 tests
- **Fichiers:** 5+ fichiers

**Total:** 8-12 jours pour couverture complète

---

## Prochaines Actions

### Immediate (Phase 8.3.1)

1. ✅ Créer helper `prisma-mock-factory.ts`
2. ✅ Créer `auth-prisma.service.spec.ts` (priorité HAUTE)
3. ✅ Créer `user-prisma.service.spec.ts` (priorité HAUTE)
4. ✅ Créer `role-prisma.service.spec.ts` (priorité HAUTE)
5. ✅ Créer `societe-prisma.service.spec.ts` (priorité HAUTE)
6. ✅ Vérifier couverture: `pnpm test:cov`

### Moyen Terme (Phase 8.3.2-8.3.3)

7. Tests services infrastructure
8. Tests E2E contrôleurs
9. Rapport de couverture

### Optionnel (Phase 8.3.4)

10. Tests complémentaires
11. Tests de performance
12. Tests d'intégration complexes

---

## Validation Phase 8.3 Complete

### Critères de Succès

- [  ] ✅ >85% code coverage global
- [  ] ✅ >90% coverage services critiques (Auth, User, Role, Societe)
- [  ] ✅ 100% endpoints E2E testés (77 endpoints)
- [  ] ✅ Tous les tests passent: `pnpm test`
- [  ] ✅ Rapport de couverture généré
- [  ] ✅ Documentation des patterns de tests

### Livrables

1. **Tests unitaires** (~180 tests)
2. **Tests E2E** (~230 tests)
3. **Helpers et mocks** (prisma-mock-factory, test-data-factory)
4. **Rapport de couverture** (HTML + console)
5. **Documentation** (PHASE_8_3_TESTING_REPORT.md)

---

## Commandes Utiles

```bash
# Lancer tous les tests
pnpm test

# Watch mode (développement)
pnpm test:watch

# UI mode (visualisation)
pnpm test:ui

# Coverage report
pnpm test:cov

# Tests E2E
pnpm test:e2e

# Tests spécifiques
pnpm test auth-prisma.service.spec

# Tests avec pattern
pnpm test --grep "AuthPrismaService"
```

---

## Conclusion

Phase 8.3 vise à **valider le socle Prisma** avec une couverture de tests complète:
- **~410 tests** au total (180 unitaires + 230 E2E)
- **>85% coverage** global
- **100% endpoints** testés

Après Phase 8.3, le socle Prisma sera **validé et prêt pour la migration TopTime** (Phase 9+).

---

*Plan créé le 2025-01-18*
*Phase 8.3 - Tests Infrastructure Multi-Tenant Prisma*
