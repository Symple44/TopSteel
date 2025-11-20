# PLAN DE TRANSITION VERS PRISMA - TopSteel Infrastructure

**Date**: 2025-11-15
**Objectif**: Migrer l'infrastructure TopSteel de TypeORM vers Prisma
**Scope**: Infrastructure seulement (45 entités) - AUCUN MÉTIER
**Durée Estimée**: 7 semaines
**Risque Global**: Moyen (migration technique importante mais structure conservée)

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Inventaire complet](#inventaire-complet)
3. [Phase 0: Préparation (Semaine 0)](#phase-0-préparation)
4. [Phase 1: POC Auth Prisma (Semaine 1-2)](#phase-1-poc-auth-prisma)
5. [Phase 2: Migration Infrastructure Complète (Semaine 3-5)](#phase-2-migration-infrastructure)
6. [Phase 3: Migration Services (Semaine 6)](#phase-3-migration-services)
7. [Phase 4: Tests & Validation (Semaine 7)](#phase-4-tests-validation)
8. [Checkpoints & Validation](#checkpoints-validation)
9. [Plan de Rollback](#plan-de-rollback)
10. [Après la Migration](#après-migration)

---

## 🎯 VUE D'ENSEMBLE

### Scope de Migration

**✅ INCLUS (Infrastructure - 45 entités)**:
- Auth & Sécurité (13 entités)
- Utilisateurs (2 entités)
- Multi-tenant & Sociétés (4 entités)
- Administration & Menu (9 entités)
- Menu Dynamique (2 entités)
- Paramètres Système (3 entités)
- Notifications (7 entités)
- Query Builder (5 entités)

**❌ EXCLU (Métier - 0 entités)**:
- Aucune entité métier (déjà supprimée lors du cleanup)
- TopTime sera intégré APRÈS cette migration

### Technologies

```
Avant:
- NestJS 11.1.6
- TypeORM
- PostgreSQL (3 DBs: auth, shared, tenant_*)
- Redis
- Bull Queue

Après:
- NestJS 11.1.6 (conservé)
- Prisma 6.x
- PostgreSQL (3 DBs: conservé)
- Redis (conservé)
- Bull Queue (conservé)
```

### Stratégie de Migration

1. **Incrémentale**: Migration par phases, pas de big bang
2. **Validée**: Checkpoint GO/NO-GO après POC
3. **Réversible**: Branche dédiée + tags + rollback plan
4. **Testée**: Tests automatisés à chaque phase
5. **Documentée**: Documentation technique et décisions

---

## 📦 INVENTAIRE COMPLET

### 1. Auth & Sécurité (13 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 1 | User | `domains/users/entities/user.entity.ts` | 🔴 Élevée | Central (15+ relations) |
| 2 | UserSession | `domains/auth/core/entities/user-session.entity.ts` | 🔴 Élevée | User (x2), JSONB (deviceInfo, location) |
| 3 | UserMFA | `domains/auth/core/entities/user-mfa.entity.ts` | 🔴 Élevée | User, JSONB (webauthnCredentials, metadata) |
| 4 | MFASession | `domains/auth/core/entities/mfa-session.entity.ts` | 🟡 Moyenne | User, JSONB (metadata) |
| 5 | UserSocieteRole | `domains/auth/core/entities/user-societe-role.entity.ts` | 🔴 Élevée | User, Role, Societe, JSONB (permissions) |
| 6 | Role | `domains/auth/core/entities/role.entity.ts` | 🔴 Élevée | RolePermission, UserRole, Societe |
| 7 | Permission | `domains/auth/core/entities/permission.entity.ts` | 🟡 Moyenne | RolePermission, Societe |
| 8 | RolePermission | `domains/auth/core/entities/role-permission.entity.ts` | 🟢 Simple | Role, Permission |
| 9 | UserRole | `domains/auth/core/entities/user-role.entity.ts` | 🟢 Simple | User, Role |
| 10 | Group | `domains/auth/core/entities/group.entity.ts` | 🟡 Moyenne | UserGroup, Role (many-to-many) |
| 11 | UserGroup | `domains/auth/core/entities/user-group.entity.ts` | 🟢 Simple | User, Group |
| 12 | Module | `domains/auth/core/entities/module.entity.ts` | 🟢 Simple | Standalone |
| 13 | AuditLog | `domains/auth/core/entities/audit-log.entity.ts` | 🟡 Moyenne | Standalone (audit) |
| 14 | SMSLog | `domains/auth/entities/sms-log.entity.ts` | 🟢 Simple | Standalone |

### 2. Utilisateurs (2 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 15 | UserSettings | `domains/users/entities/user-settings.entity.ts` | 🟡 Moyenne | User (1:1), JSONB (profile, preferences) |

### 3. Multi-tenant & Sociétés (4 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 16 | Societe | `features/societes/entities/societe.entity.ts` | 🔴 Élevée | Site, SocieteUser, BaseSociete |
| 17 | SocieteLicense | `features/societes/entities/societe-license.entity.ts` | 🔴 Élevée | Societe (1:1), JSONB (features, restrictions) |
| 18 | SocieteUser | `features/societes/entities/societe-user.entity.ts` | 🟡 Moyenne | User, Societe, JSONB (permissions) |
| 19 | Site | `features/societes/entities/site.entity.ts` | 🟡 Moyenne | Societe, JSONB (configuration) |

### 4. Administration (9 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 20 | SystemSetting | `features/admin/entities/system-setting.entity.ts` | 🟢 Simple | User |
| 21 | SystemParameter | `features/admin/entities/system-parameter.entity.ts` | 🟢 Simple | Standalone |
| 22 | MenuConfiguration | `features/admin/entities/menu-configuration.entity.ts` | 🟡 Moyenne | MenuItem |
| 23 | MenuConfigurationSimple | `features/admin/entities/menu-configuration-simple.entity.ts` | 🟢 Simple | Standalone |
| 24 | MenuItem | `features/admin/entities/menu-item.entity.ts` | 🔴 Élevée | MenuConfiguration, MenuItem (parent/children), MenuItemRole, MenuItemPermission |
| 25 | MenuItemRole | `features/admin/entities/menu-item-role.entity.ts` | 🟢 Simple | MenuItem |
| 26 | MenuItemPermission | `features/admin/entities/menu-item-permission.entity.ts` | 🟢 Simple | MenuItem |
| 27 | UserMenuPreferences | `features/admin/entities/user-menu-preferences.entity.ts` | 🟡 Moyenne | UserMenuItemPreference, JSONB (customColors) |
| 28 | UserMenuItemPreference | `features/admin/entities/user-menu-item-preference.entity.ts` | 🟢 Simple | UserMenuPreferences |

### 5. Menu Dynamique (2 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 29 | UserMenuPreference | `features/menu/entities/user-menu-preference.entity.ts` | 🟢 Simple | Standalone |
| 30 | DiscoveredPage | `features/menu/entities/discovered-page.entity.ts` | 🟢 Simple | Standalone |

### 6. Paramètres (3 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 31 | ParameterSystem | `features/parameters/entities/parameter-system.entity.ts` | 🟢 Simple | JSONB (metadata, arrayValues) |
| 32 | ParameterApplication | `features/parameters/entities/parameter-application.entity.ts` | 🟡 Moyenne | JSONB (businessRules, metadata) |
| 33 | ParameterClient | `features/parameters/entities/parameter-client.entity.ts` | 🟡 Moyenne | JSONB (constraints, metadata) |

### 7. Notifications (7 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 34 | Notifications | `features/notifications/entities/notifications.entity.ts` | 🟡 Moyenne | Standalone |
| 35 | NotificationEvent | `features/notifications/entities/notification-event.entity.ts` | 🟡 Moyenne | JSONB (data, processingDetails) |
| 36 | NotificationTemplate | `features/notifications/entities/notification-template.entity.ts` | 🟢 Simple | JSONB (variables) |
| 37 | NotificationSettings | `features/notifications/entities/notification-settings.entity.ts` | 🟢 Simple | JSONB (categories, priorities) |
| 38 | NotificationRule | `features/notifications/entities/notification-rule.entity.ts` | 🔴 Élevée | NotificationRuleExecution, JSONB (trigger, conditions) |
| 39 | NotificationRuleExecution | `features/notifications/entities/notification-rule-execution.entity.ts` | 🟡 Moyenne | NotificationRule, Notifications |
| 40 | NotificationRead | `features/notifications/entities/notification-read.entity.ts` | 🟢 Simple | Notifications |

### 8. Query Builder (5 entités)

| # | Entité | Fichier | Complexité | Relations |
|---|--------|---------|-----------|-----------|
| 41 | QueryBuilder | `features/query-builder/entities/query-builder.entity.ts` | 🔴 Élevée | User, QueryBuilderColumn, QueryBuilderJoin, QueryBuilderCalculatedField, QueryBuilderPermission, JSONB (settings, layout) |
| 42 | QueryBuilderColumn | `features/query-builder/entities/query-builder-column.entity.ts` | 🟡 Moyenne | QueryBuilder, JSONB (format, aggregation) |
| 43 | QueryBuilderJoin | `features/query-builder/entities/query-builder-join.entity.ts` | 🟢 Simple | QueryBuilder |
| 44 | QueryBuilderCalculatedField | `features/query-builder/entities/query-builder-calculated-field.entity.ts` | 🟡 Moyenne | QueryBuilder, JSONB (format, dependencies) |
| 45 | QueryBuilderPermission | `features/query-builder/entities/query-builder-permission.entity.ts` | 🟡 Moyenne | QueryBuilder, User, Role |

### Statistiques

- **Total Entités**: 45
- **Complexité Élevée** 🔴: 10 (22%)
- **Complexité Moyenne** 🟡: 17 (38%)
- **Complexité Simple** 🟢: 18 (40%)
- **Avec JSONB**: 18 entités (40%)
- **Multi-DB (auth)**: 14 entités
- **Multi-DB (shared)**: 4 entités
- **Multi-DB (tenant)**: 27 entités

---

## 🚀 PHASE 0: PRÉPARATION (Semaine 0 - 40h)

### Objectifs
- Sécuriser le projet actuel
- Installer et configurer Prisma
- Créer l'environnement de développement

### Jour 1: Sécurisation & Backup (8h)

#### 1.1 Créer branche dédiée
```bash
# Créer branche de migration
git checkout -b feature/migrate-to-prisma

# Tag de backup
git tag -a v1.0.0-pre-prisma -m "Backup avant migration Prisma"
git push origin v1.0.0-pre-prisma

# Créer branche de rollback
git checkout -b backup/pre-prisma-typeorm
git push origin backup/pre-prisma-typeorm
git checkout feature/migrate-to-prisma
```

#### 1.2 Backup bases de données
```bash
# Backup DB auth
pg_dump -h localhost -U postgres -d topsteel_auth -F c -f backups/topsteel_auth_pre_prisma.backup

# Backup DB shared
pg_dump -h localhost -U postgres -d topsteel_shared -F c -f backups/topsteel_shared_pre_prisma.backup

# Backup DB tenant (exemple)
pg_dump -h localhost -U postgres -d topsteel_tenant_001 -F c -f backups/topsteel_tenant_001_pre_prisma.backup
```

#### 1.3 Documentation état actuel
```bash
# Lister toutes les tables TypeORM
psql -h localhost -U postgres -d topsteel_auth -c "\dt" > docs/migration/typeorm_tables_auth.txt
psql -h localhost -U postgres -d topsteel_shared -c "\dt" > docs/migration/typeorm_tables_shared.txt

# Compter les enregistrements
psql -h localhost -U postgres -d topsteel_auth -c "
  SELECT 'users' as table_name, COUNT(*) FROM users UNION ALL
  SELECT 'user_sessions', COUNT(*) FROM user_sessions UNION ALL
  SELECT 'user_mfa', COUNT(*) FROM user_mfa;
" > docs/migration/record_counts.txt
```

### Jour 2: Installation Prisma (8h)

#### 2.1 Installer packages Prisma
```bash
cd apps/api

# Installer Prisma CLI et Client
pnpm add -D prisma@latest
pnpm add @prisma/client@latest

# Vérifier version
npx prisma --version
```

#### 2.2 Initialiser Prisma
```bash
# Initialiser Prisma (crée prisma/schema.prisma)
npx prisma init

# Structure attendue:
# apps/api/
#   prisma/
#     schema.prisma
#   .env
```

#### 2.3 Configurer multi-database
```prisma
// apps/api/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

// Base de données AUTH
datasource authDb {
  provider = "postgresql"
  url      = env("DATABASE_AUTH_URL")
}

// Base de données SHARED
datasource sharedDb {
  provider = "postgresql"
  url      = env("DATABASE_SHARED_URL")
}

// Base de données TENANT (template)
datasource tenantDb {
  provider = "postgresql"
  url      = env("DATABASE_TENANT_URL")
}
```

#### 2.4 Configurer variables d'environnement
```bash
# apps/api/.env

# Auth Database (13 entités)
DATABASE_AUTH_URL="postgresql://postgres:admin123@localhost:5432/topsteel_auth?schema=public"

# Shared Database (4 entités societes)
DATABASE_SHARED_URL="postgresql://postgres:admin123@localhost:5432/topsteel_shared?schema=public"

# Tenant Database Template (27 entités)
DATABASE_TENANT_URL="postgresql://postgres:admin123@localhost:5432/topsteel_tenant_001?schema=public"
```

### Jour 3: Introspection TypeORM → Prisma (8h)

#### 3.1 Introspection automatique
```bash
# Introspection de la DB auth
npx prisma db pull --schema=prisma/schema-auth.prisma

# Introspection de la DB shared
npx prisma db pull --schema=prisma/schema-shared.prisma

# Introspection de la DB tenant
npx prisma db pull --schema=prisma/schema-tenant.prisma
```

#### 3.2 Analyser le résultat
```bash
# Vérifier les modèles générés
cat prisma/schema-auth.prisma
cat prisma/schema-shared.prisma
cat prisma/schema-tenant.prisma

# Comparer avec les entités TypeORM
# Identifier les différences (naming, relations, indexes)
```

#### 3.3 Créer rapport de comparaison
```markdown
# docs/migration/introspection-report.md

## Différences TypeORM vs Prisma Introspection

### Auth DB

| Table TypeORM | Model Prisma | Différences |
|---------------|--------------|-------------|
| users | User | - camelCase vs snake_case |
| user_sessions | UserSession | - Relations lazy → eager |
| user_mfa | UserMfa | - JSONB mapping |

### Issues Identifiés

1. Naming conventions différentes
2. Relations lazy TypeORM → eager Prisma
3. JSONB custom types
4. Indexes composites manquants
5. Enum types à créer
```

### Jour 4-5: Créer Schema Prisma Initial (16h)

#### 4.1 Structure multi-database Prisma

```prisma
// apps/api/prisma/schema.prisma (fichier principal)

generator client {
  provider        = "prisma-client-js"
  output          = "../node_modules/.prisma/client"
  previewFeatures = ["multiSchema"]
}

// Datasources pour chaque DB
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // URL par défaut
  schemas  = ["auth", "shared", "tenant"]
}

// ============================================
// AUTH DATABASE (13 entités)
// ============================================

// 1. User (entité centrale)
model User {
  id                String              @id @default(uuid())
  username          String              @unique @db.VarChar(255)
  email             String              @unique @db.VarChar(255)
  passwordHash      String              @map("password_hash") @db.VarChar(255)
  firstName         String?             @map("first_name") @db.VarChar(100)
  lastName          String?             @map("last_name") @db.VarChar(100)
  isActive          Boolean             @default(true) @map("is_active")
  isEmailVerified   Boolean             @default(false) @map("is_email_verified")
  emailVerifiedAt   DateTime?           @map("email_verified_at")
  lastLoginAt       DateTime?           @map("last_login_at")
  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")
  deletedAt         DateTime?           @map("deleted_at")

  // Relations
  sessions          UserSession[]
  mfaSettings       UserMfa[]
  roles             UserRole[]
  societeRoles      UserSocieteRole[]
  settings          UserSettings?
  societes          SocieteUser[]
  auditLogs         AuditLog[]         @relation("PerformedBy")
  systemSettings    SystemSetting[]
  queryBuilders     QueryBuilder[]

  @@index([email])
  @@index([username])
  @@index([isActive])
  @@map("users")
  @@schema("auth")
}

// 2. UserSession (sessions avancées)
model UserSession {
  id               String    @id @default(uuid())
  userId           String    @map("user_id")
  sessionId        String    @unique @map("session_id") @db.VarChar(255)
  accessToken      String    @map("access_token") @db.VarChar(255)
  refreshToken     String?   @map("refresh_token") @db.VarChar(255)
  loginTime        DateTime  @map("login_time")
  logoutTime       DateTime? @map("logout_time")
  lastActivity     DateTime  @map("last_activity")
  ipAddress        String?   @map("ip_address") @db.VarChar(50)
  userAgent        String?   @map("user_agent") @db.Text
  deviceInfo       Json?     @map("device_info") // { browser, os, device, isMobile }
  location         Json?     @map("location")    // { city, country, lat, lon, timezone }
  isActive         Boolean   @default(true) @map("is_active")
  isIdle           Boolean   @default(false) @map("is_idle")
  status           String    @default("active") @db.VarChar(50) // active|ended|forced_logout|expired
  warningCount     Int       @default(0) @map("warning_count")
  forcedLogoutBy   String?   @map("forced_logout_by")
  forcedLogoutReason String? @map("forced_logout_reason") @db.Text
  metadata         Json?     @map("metadata")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  // Relations
  user             User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  forcedLogoutByUser User?   @relation("ForcedLogout", fields: [forcedLogoutBy], references: [id])

  @@index([userId, status, lastActivity])
  @@index([userId, isActive])
  @@index([status, lastActivity])
  @@index([ipAddress, createdAt])
  @@map("user_sessions")
  @@schema("auth")
}

// 3. UserMfa (MFA multi-type)
model UserMfa {
  id                   String    @id @default(uuid())
  userId               String    @map("user_id")
  type                 String    @db.VarChar(50) // totp|sms|email|webauthn
  isEnabled            Boolean   @default(false) @map("is_enabled")
  isVerified           Boolean   @default(false) @map("is_verified")
  secret               String?   @db.VarChar(255) // TOTP secret (encrypted)
  backupCodes          String?   @map("backup_codes") @db.VarChar(255) // Encrypted
  phoneNumber          String?   @map("phone_number") @db.VarChar(50)
  email                String?   @db.VarChar(255)
  webauthnCredentials  Json?     @map("webauthn_credentials") // Array of credentials
  metadata             Json?     @map("metadata") // { qrCode, deviceInfo, usageCount, etc. }
  lastUsedAt           DateTime? @map("last_used_at")
  verifiedAt           DateTime? @map("verified_at")
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  // Relations
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([type])
  @@index([isEnabled])
  @@index([isVerified])
  @@index([lastUsedAt])
  @@map("user_mfa")
  @@schema("auth")
}

// 4. MfaSession
model MfaSession {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  mfaType         String    @map("mfa_type") @db.VarChar(50)
  challenge       String    @db.VarChar(255)
  verified        Boolean   @default(false)
  expiresAt       DateTime  @map("expires_at")
  verifiedAt      DateTime? @map("verified_at")
  ipAddress       String?   @map("ip_address") @db.VarChar(50)
  userAgent       String?   @map("user_agent") @db.Text
  metadata        Json?     @map("metadata")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@index([verified])
  @@map("mfa_sessions")
  @@schema("auth")
}

// 5. Role
model Role {
  id                String              @id @default(uuid())
  name              String              @unique @db.VarChar(100)
  label             String              @db.VarChar(255)
  description       String?             @db.Text
  level             Int                 @default(0)
  isSystem          Boolean             @default(false) @map("is_system")
  isActive          Boolean             @default(true) @map("is_active")
  societeId         String?             @map("societe_id")
  parentId          String?             @map("parent_id")
  metadata          Json?               @map("metadata")
  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")

  // Relations
  permissions       RolePermission[]
  users             UserRole[]
  societeUsers      UserSocieteRole[]
  societe           Societe?            @relation(fields: [societeId], references: [id])
  parent            Role?               @relation("RoleHierarchy", fields: [parentId], references: [id])
  children          Role[]              @relation("RoleHierarchy")
  menuItems         MenuItemRole[]
  queryBuilderPerms QueryBuilderPermission[]

  @@index([name])
  @@index([societeId])
  @@index([isActive])
  @@index([isSystem])
  @@map("roles")
  @@schema("auth")
}

// 6. Permission
model Permission {
  id          String             @id @default(uuid())
  name        String             @unique @db.VarChar(100)
  label       String             @db.VarChar(255)
  description String?            @db.Text
  module      String             @db.VarChar(100)
  action      String             @db.VarChar(100)
  resource    String?            @db.VarChar(100)
  societeId   String?            @map("societe_id")
  isActive    Boolean            @default(true) @map("is_active")
  metadata    Json?              @map("metadata")
  createdAt   DateTime           @default(now()) @map("created_at")
  updatedAt   DateTime           @updatedAt @map("updated_at")

  // Relations
  roles       RolePermission[]
  societe     Societe?           @relation(fields: [societeId], references: [id])
  menuItems   MenuItemPermission[]

  @@index([name])
  @@index([module])
  @@index([societeId])
  @@index([isActive])
  @@map("permissions")
  @@schema("auth")
}

// 7. RolePermission (join table)
model RolePermission {
  id           String     @id @default(uuid())
  roleId       String     @map("role_id")
  permissionId String     @map("permission_id")
  createdAt    DateTime   @default(now()) @map("created_at")

  // Relations
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([roleId, permissionId])
  @@index([roleId])
  @@index([permissionId])
  @@map("role_permissions")
  @@schema("auth")
}

// 8. UserRole (join table)
model UserRole {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  roleId    String   @map("role_id")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_roles")
  @@schema("auth")
}

// 9. Group
model Group {
  id          String      @id @default(uuid())
  name        String      @unique @db.VarChar(100)
  label       String      @db.VarChar(255)
  description String?     @db.Text
  isActive    Boolean     @default(true) @map("is_active")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  users       UserGroup[]

  @@index([name])
  @@index([isActive])
  @@map("groups")
  @@schema("auth")
}

// 10. UserGroup (join table)
model UserGroup {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  groupId   String   @map("group_id")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
  @@index([userId])
  @@index([groupId])
  @@map("user_groups")
  @@schema("auth")
}

// 11. Module
model Module {
  id          String   @id @default(uuid())
  name        String   @unique @db.VarChar(100)
  label       String   @db.VarChar(255)
  description String?  @db.Text
  icon        String?  @db.VarChar(50)
  order       Int      @default(0)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([name])
  @@index([order])
  @@map("modules")
  @@schema("auth")
}

// 12. UserSocieteRole (multi-tenant role mapping)
model UserSocieteRole {
  id                   String    @id @default(uuid())
  userId               String    @map("user_id")
  societeId            String    @map("societe_id")
  roleId               String    @map("role_id")
  permissions          Json?     @map("permissions") // Override permissions
  isActive             Boolean   @default(true) @map("is_active")
  activatedAt          DateTime? @map("activated_at")
  deactivatedAt        DateTime? @map("deactivated_at")
  createdAt            DateTime  @default(now()) @map("created_at")
  updatedAt            DateTime  @updatedAt @map("updated_at")

  // Relations
  user                 User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  societe              Societe   @relation(fields: [societeId], references: [id], onDelete: Cascade)
  role                 Role      @relation(fields: [roleId], references: [id])

  @@unique([userId, societeId, roleId])
  @@index([userId])
  @@index([societeId])
  @@index([roleId])
  @@index([isActive])
  @@map("user_societe_roles")
  @@schema("auth")
}

// 13. AuditLog
model AuditLog {
  id           String    @id @default(uuid())
  userId       String?   @map("user_id")
  action       String    @db.VarChar(100)
  resource     String    @db.VarChar(100)
  resourceId   String?   @map("resource_id")
  description  String?   @db.Text
  ipAddress    String?   @map("ip_address") @db.VarChar(50)
  userAgent    String?   @map("user_agent") @db.Text
  changes      Json?     @map("changes") // { before, after }
  metadata     Json?     @map("metadata")
  createdAt    DateTime  @default(now()) @map("created_at")

  // Relations
  user         User?     @relation("PerformedBy", fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([createdAt])
  @@map("audit_logs")
  @@schema("auth")
}

// 14. SmsLog
model SmsLog {
  id          String    @id @default(uuid())
  phoneNumber String    @map("phone_number") @db.VarChar(50)
  message     String    @db.Text
  status      String    @db.VarChar(50) // pending|sent|failed
  provider    String?   @db.VarChar(50)
  errorMessage String?  @map("error_message") @db.Text
  sentAt      DateTime? @map("sent_at")
  createdAt   DateTime  @default(now()) @map("created_at")

  @@index([phoneNumber])
  @@index([status])
  @@index([createdAt])
  @@map("sms_logs")
  @@schema("auth")
}

// ============================================
// USER SETTINGS (1 entité auth)
// ============================================

model UserSettings {
  id              String   @id @default(uuid())
  userId          String   @unique @map("user_id")
  profile         Json?    @map("profile")      // { avatar, bio, phone, etc. }
  company         Json?    @map("company")      // { name, position, department }
  preferences     Json?    @map("preferences")  // { theme, language, notifications }
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
  @@schema("auth")
}

// ============================================
// SHARED DATABASE (4 entités sociétés)
// ============================================

model Societe {
  id                String              @id @default(uuid())
  code              String              @unique @db.VarChar(50)
  name              String              @db.VarChar(255)
  legalName         String?             @map("legal_name") @db.VarChar(255)
  siret             String?             @db.VarChar(50)
  address           String?             @db.Text
  city              String?             @db.VarChar(100)
  postalCode        String?             @map("postal_code") @db.VarChar(20)
  country           String?             @db.VarChar(100)
  phone             String?             @db.VarChar(50)
  email             String?             @db.VarChar(255)
  website           String?             @db.VarChar(255)
  isActive          Boolean             @default(true) @map("is_active")
  databaseName      String              @map("database_name") @db.VarChar(100) // topsteel_tenant_{code}
  createdAt         DateTime            @default(now()) @map("created_at")
  updatedAt         DateTime            @updatedAt @map("updated_at")
  deletedAt         DateTime?           @map("deleted_at")

  // Relations
  license           SocieteLicense?
  users             SocieteUser[]
  sites             Site[]
  userSocieteRoles  UserSocieteRole[]
  roles             Role[]
  permissions       Permission[]

  @@index([code])
  @@index([isActive])
  @@map("societes")
  @@schema("shared")
}

model SocieteLicense {
  id              String    @id @default(uuid())
  societeId       String    @unique @map("societe_id")
  type            String    @db.VarChar(50) // trial|starter|professional|enterprise
  status          String    @db.VarChar(50) // active|suspended|expired
  maxUsers        Int       @map("max_users")
  features        Json      @map("features")      // Array of enabled features
  restrictions    Json?     @map("restrictions")  // Limits and quotas
  billing         Json?     @map("billing")       // Billing information
  startDate       DateTime  @map("start_date")
  endDate         DateTime? @map("end_date")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  societe         Societe   @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@index([societeId])
  @@index([status])
  @@map("societe_licenses")
  @@schema("shared")
}

model SocieteUser {
  id              String    @id @default(uuid())
  userId          String    @map("user_id")
  societeId       String    @map("societe_id")
  permissions     Json?     @map("permissions")   // User-specific permissions
  preferences     Json?     @map("preferences")   // User preferences for this societe
  isActive        Boolean   @default(true) @map("is_active")
  joinedAt        DateTime  @default(now()) @map("joined_at")
  leftAt          DateTime? @map("left_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  societe         Societe   @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@unique([userId, societeId])
  @@index([userId])
  @@index([societeId])
  @@index([isActive])
  @@map("societe_users")
  @@schema("shared")
}

model Site {
  id              String   @id @default(uuid())
  societeId       String   @map("societe_id")
  name            String   @db.VarChar(255)
  code            String   @db.VarChar(50)
  address         String?  @db.Text
  city            String?  @db.VarChar(100)
  postalCode      String?  @map("postal_code") @db.VarChar(20)
  country         String?  @db.VarChar(100)
  phone           String?  @db.VarChar(50)
  email           String?  @db.VarChar(255)
  isActive        Boolean  @default(true) @map("is_active")
  configuration   Json?    @map("configuration")
  metadata        Json?    @map("metadata")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  societe         Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)

  @@unique([societeId, code])
  @@index([societeId])
  @@index([code])
  @@index([isActive])
  @@map("sites")
  @@schema("shared")
}

// ============================================
// TENANT DATABASE (27 entités - suite dans partie 2)
// ============================================
// Admin, Menu, Parameters, Notifications, Query Builder...
```

**Note**: Le schéma Prisma complet fera ~2000 lignes. Pour cette première partie, j'ai défini:
- ✅ Auth Database (13 entités + UserSettings)
- ✅ Shared Database (4 entités sociétés)
- ⏳ Tenant Database (27 entités) → à définir dans schema-tenant.prisma

### Checkpoint Phase 0

**Validation Checklist**:
- [ ] ✅ Branche `feature/migrate-to-prisma` créée
- [ ] ✅ Tag `v1.0.0-pre-prisma` créé
- [ ] ✅ Backups DB créés (auth, shared, tenant)
- [ ] ✅ Prisma installé (`@prisma/client`, `prisma`)
- [ ] ✅ Schema Prisma initial créé (auth + shared complets)
- [ ] ✅ Multi-database configuré
- [ ] ✅ Introspection réussie
- [ ] ✅ Rapport de comparaison TypeORM vs Prisma créé

**GO/NO-GO**: Si toutes les checkboxes ✅ → GO Phase 1

---

## 🔬 PHASE 1: POC AUTH PRISMA (Semaine 1-2 - 80h)

### Objectifs
- Valider faisabilité technique Prisma avec NestJS
- Migrer 5 entités auth critiques
- Tester login/JWT/MFA avec Prisma
- **CHECKPOINT GO/NO-GO CRITIQUE**

### Semaine 1: POC Setup (40h)

#### Jour 1: PrismaService Injectable (8h)

**1.1 Créer PrismaService**

```typescript
// apps/api/src/core/database/prisma/prisma.service.ts

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>('DATABASE_AUTH_URL')

    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    })

    // Log queries en développement
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (e: any) => {
        this.logger.debug(`Query: ${e.query}`)
        this.logger.debug(`Duration: ${e.duration}ms`)
      })
    }
  }

  async onModuleInit() {
    this.logger.log('🔌 Connecting to database...')
    await this.$connect()
    this.logger.log('✅ Database connected successfully')
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting from database...')
    await this.$disconnect()
    this.logger.log('✅ Database disconnected')
  }

  /**
   * Clean database (for tests)
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production')
    }

    // Ordre important pour respecter les foreign keys
    await this.$transaction([
      this.userSession.deleteMany(),
      this.userMfa.deleteMany(),
      this.mfaSession.deleteMany(),
      this.userRole.deleteMany(),
      this.userGroup.deleteMany(),
      this.rolePermission.deleteMany(),
      this.permission.deleteMany(),
      this.role.deleteMany(),
      this.group.deleteMany(),
      this.user.deleteMany(),
      this.auditLog.deleteMany(),
      this.smsLog.deleteMany(),
    ])

    this.logger.log('🧹 Database cleaned')
  }
}
```

**1.2 Créer PrismaModule**

```typescript
// apps/api/src/core/database/prisma/prisma.module.ts

import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

**1.3 Intégrer dans AppModule**

```typescript
// apps/api/src/app.module.ts

import { Module } from '@nestjs/common'
import { PrismaModule } from './core/database/prisma/prisma.module'
// ... autres imports

@Module({
  imports: [
    PrismaModule, // Ajouter en global
    // TypeOrmModule conservé pour l'instant (cohabitation)
    // ...
  ],
})
export class AppModule {}
```

**1.4 Tests PrismaService**

```typescript
// apps/api/src/core/database/prisma/prisma.service.spec.ts

import { Test } from '@nestjs/testing'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma.service'

describe('PrismaService', () => {
  let prismaService: PrismaService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService],
    }).compile()

    prismaService = module.get<PrismaService>(PrismaService)
    await prismaService.onModuleInit()
  })

  afterAll(async () => {
    await prismaService.onModuleDestroy()
  })

  it('should be defined', () => {
    expect(prismaService).toBeDefined()
  })

  it('should connect to database', async () => {
    const result = await prismaService.$queryRaw`SELECT 1 as value`
    expect(result).toEqual([{ value: 1 }])
  })

  it('should create and find user', async () => {
    const user = await prismaService.user.create({
      data: {
        username: 'test_poc',
        email: 'test@poc.com',
        passwordHash: 'hashed_password',
      },
    })

    expect(user.id).toBeDefined()
    expect(user.email).toBe('test@poc.com')

    const foundUser = await prismaService.user.findUnique({
      where: { email: 'test@poc.com' },
    })

    expect(foundUser).toBeDefined()
    expect(foundUser?.username).toBe('test_poc')

    // Cleanup
    await prismaService.user.delete({ where: { id: user.id } })
  })
})
```

#### Jour 2-3: Migrer 5 Entités Auth Critiques (16h)

**Entités à migrer pour POC**:
1. User
2. UserSession
3. Role
4. Permission
5. RolePermission

**2.1 Générer Prisma Client**

```bash
cd apps/api
npx prisma generate

# Vérifier types générés
ls -la node_modules/.prisma/client/
```

**2.2 Créer AuthPrismaService**

```typescript
// apps/api/src/domains/auth/services/auth-prisma.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import type { User, UserSession, Role } from '@prisma/client'
import * as bcrypt from 'bcrypt'

@Injectable()
export class AuthPrismaService {
  private readonly logger = new Logger(AuthPrismaService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Créer un utilisateur avec Prisma
   */
  async createUser(data: {
    username: string
    email: string
    password: string
    firstName?: string
    lastName?: string
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10)

    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    })
  }

  /**
   * Trouver user par email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  /**
   * Vérifier password
   */
  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash)
  }

  /**
   * Créer session
   */
  async createSession(data: {
    userId: string
    sessionId: string
    accessToken: string
    refreshToken?: string
    ipAddress?: string
    userAgent?: string
  }): Promise<UserSession> {
    return this.prisma.userSession.create({
      data: {
        userId: data.userId,
        sessionId: data.sessionId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loginTime: new Date(),
        lastActivity: new Date(),
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        isActive: true,
        status: 'active',
      },
    })
  }

  /**
   * Trouver session active
   */
  async findActiveSession(sessionId: string): Promise<UserSession | null> {
    return this.prisma.userSession.findFirst({
      where: {
        sessionId,
        isActive: true,
        status: 'active',
      },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })
  }

  /**
   * Mettre à jour activité session
   */
  async updateSessionActivity(sessionId: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { sessionId },
      data: {
        lastActivity: new Date(),
        isIdle: false,
      },
    })
  }

  /**
   * Fermer session
   */
  async endSession(
    sessionId: string,
    reason: 'normal' | 'forced' | 'expired' = 'normal'
  ): Promise<void> {
    const status =
      reason === 'forced'
        ? 'forced_logout'
        : reason === 'expired'
          ? 'expired'
          : 'ended'

    await this.prisma.userSession.update({
      where: { sessionId },
      data: {
        logoutTime: new Date(),
        isActive: false,
        status,
      },
    })
  }

  /**
   * Créer rôle
   */
  async createRole(data: {
    name: string
    label: string
    description?: string
    level?: number
  }): Promise<Role> {
    return this.prisma.role.create({
      data: {
        name: data.name,
        label: data.label,
        description: data.description,
        level: data.level || 0,
      },
    })
  }

  /**
   * Assigner rôle à user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    })
  }

  /**
   * Obtenir permissions user
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!user) return []

    const permissions = new Set<string>()

    user.roles.forEach((userRole) => {
      userRole.role.permissions.forEach((rolePermission) => {
        permissions.add(rolePermission.permission.name)
      })
    })

    return Array.from(permissions)
  }
}
```

**2.3 Tests E2E Auth avec Prisma**

```typescript
// apps/api/src/domains/auth/auth-prisma.e2e-spec.ts

import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaModule } from '../../core/database/prisma/prisma.module'
import { PrismaService } from '../../core/database/prisma/prisma.service'
import { AuthPrismaService } from './services/auth-prisma.service'

describe('Auth with Prisma (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let authPrisma: AuthPrismaService

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot(), PrismaModule],
      providers: [AuthPrismaService],
    }).compile()

    app = module.createNestApplication()
    await app.init()

    prisma = module.get<PrismaService>(PrismaService)
    authPrisma = module.get<AuthPrismaService>(AuthPrismaService)

    // Clean database
    await prisma.cleanDatabase()
  })

  afterAll(async () => {
    await prisma.cleanDatabase()
    await app.close()
  })

  describe('User Management', () => {
    it('should create user', async () => {
      const user = await authPrisma.createUser({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Test1234!',
        firstName: 'John',
        lastName: 'Doe',
      })

      expect(user.id).toBeDefined()
      expect(user.email).toBe('john@example.com')
      expect(user.username).toBe('john_doe')
      expect(user.passwordHash).not.toBe('Test1234!')
    })

    it('should find user by email', async () => {
      const user = await authPrisma.findUserByEmail('john@example.com')

      expect(user).toBeDefined()
      expect(user?.username).toBe('john_doe')
    })

    it('should validate password', async () => {
      const user = await authPrisma.findUserByEmail('john@example.com')
      expect(user).toBeDefined()

      const isValid = await authPrisma.validatePassword(user!, 'Test1234!')
      expect(isValid).toBe(true)

      const isInvalid = await authPrisma.validatePassword(user!, 'WrongPassword')
      expect(isInvalid).toBe(false)
    })
  })

  describe('Session Management', () => {
    let userId: string

    beforeAll(async () => {
      const user = await authPrisma.findUserByEmail('john@example.com')
      userId = user!.id
    })

    it('should create session', async () => {
      const session = await authPrisma.createSession({
        userId,
        sessionId: 'session_123',
        accessToken: 'token_123',
        refreshToken: 'refresh_123',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      })

      expect(session.id).toBeDefined()
      expect(session.sessionId).toBe('session_123')
      expect(session.isActive).toBe(true)
      expect(session.status).toBe('active')
    })

    it('should find active session', async () => {
      const session = await authPrisma.findActiveSession('session_123')

      expect(session).toBeDefined()
      expect(session?.user.email).toBe('john@example.com')
    })

    it('should update session activity', async () => {
      const before = await authPrisma.findActiveSession('session_123')
      const beforeActivity = before!.lastActivity

      await new Promise((resolve) => setTimeout(resolve, 1000))

      await authPrisma.updateSessionActivity('session_123')

      const after = await authPrisma.findActiveSession('session_123')
      const afterActivity = after!.lastActivity

      expect(afterActivity.getTime()).toBeGreaterThan(beforeActivity.getTime())
      expect(after!.isIdle).toBe(false)
    })

    it('should end session', async () => {
      await authPrisma.endSession('session_123', 'normal')

      const session = await prisma.userSession.findFirst({
        where: { sessionId: 'session_123' },
      })

      expect(session?.isActive).toBe(false)
      expect(session?.status).toBe('ended')
      expect(session?.logoutTime).toBeDefined()
    })
  })

  describe('Role & Permission Management', () => {
    let userId: string
    let roleId: string

    beforeAll(async () => {
      const user = await authPrisma.findUserByEmail('john@example.com')
      userId = user!.id
    })

    it('should create role', async () => {
      const role = await authPrisma.createRole({
        name: 'admin',
        label: 'Administrateur',
        description: 'Administrateur système',
        level: 100,
      })

      roleId = role.id
      expect(role.name).toBe('admin')
      expect(role.level).toBe(100)
    })

    it('should assign role to user', async () => {
      await authPrisma.assignRoleToUser(userId, roleId)

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      })

      expect(user?.roles).toHaveLength(1)
      expect(user?.roles[0]?.role.name).toBe('admin')
    })

    it('should create permission and assign to role', async () => {
      const permission = await prisma.permission.create({
        data: {
          name: 'users.create',
          label: 'Créer des utilisateurs',
          module: 'users',
          action: 'create',
        },
      })

      await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId: permission.id,
        },
      })

      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      expect(role?.permissions).toHaveLength(1)
      expect(role?.permissions[0]?.permission.name).toBe('users.create')
    })

    it('should get user permissions', async () => {
      const permissions = await authPrisma.getUserPermissions(userId)

      expect(permissions).toContain('users.create')
    })
  })
})
```

#### Jour 4-5: Intégration Login/JWT (16h)

**4.1 Adapter AuthController pour Prisma**

```typescript
// apps/api/src/domains/auth/auth.controller.ts (modification)

import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common'
import { AuthService } from './auth.service' // Service TypeORM existant
import { AuthPrismaService } from './services/auth-prisma.service' // Nouveau service Prisma
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService, // TypeORM (conservé pour rollback)
    private authPrismaService: AuthPrismaService, // Prisma (nouveau)
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  /**
   * Login avec Prisma (POC)
   */
  @Post('login-prisma')
  async loginPrisma(@Body() body: { email: string; password: string }) {
    // 1. Trouver user
    const user = await this.authPrismaService.findUserByEmail(body.email)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // 2. Valider password
    const isValid = await this.authPrismaService.validatePassword(user, body.password)
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    // 3. Générer JWT
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    }
    const accessToken = this.jwtService.sign(payload)
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' })

    // 4. Créer session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36)}`
    await this.authPrismaService.createSession({
      userId: user.id,
      sessionId,
      accessToken,
      refreshToken,
      ipAddress: '127.0.0.1', // TODO: Extract from request
      userAgent: 'Test', // TODO: Extract from request
    })

    // 5. Retourner tokens
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }
  }

  /**
   * Obtenir profil (avec Prisma)
   */
  @Get('profile-prisma')
  @UseGuards(JwtAuthGuard) // Guard existant
  async getProfilePrisma(@Req() req: any) {
    const userId = req.user.sub

    const user = await this.authPrismaService.findUserByEmail(req.user.email)
    const permissions = await this.authPrismaService.getUserPermissions(userId)

    return {
      user,
      permissions,
    }
  }

  /**
   * Logout (avec Prisma)
   */
  @Post('logout-prisma')
  @UseGuards(JwtAuthGuard)
  async logoutPrisma(@Req() req: any) {
    // Extract sessionId from JWT or header
    const sessionId = req.headers['x-session-id']

    if (sessionId) {
      await this.authPrismaService.endSession(sessionId, 'normal')
    }

    return { message: 'Logout successful' }
  }
}
```

**4.2 Tests E2E Login/JWT**

```bash
# Tester login
curl -X POST http://localhost:3001/api/auth/login-prisma \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Test1234!"}'

# Résultat attendu:
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "...", "email": "john@example.com", ... }
# }

# Tester profile
curl -X GET http://localhost:3001/api/auth/profile-prisma \
  -H "Authorization: Bearer <accessToken>"

# Résultat attendu:
# {
#   "user": { ... },
#   "permissions": ["users.create", ...]
# }
```

### Semaine 2: POC Validation & MFA (40h)

#### Jour 1-2: Tests MFA Prisma (16h)

**1.1 Implémenter UserMFA avec Prisma**

```typescript
// apps/api/src/domains/auth/services/mfa-prisma.service.ts

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { TOTPService } from './totp.service' // Service existant
import type { UserMfa } from '@prisma/client'

@Injectable()
export class MfaPrismaService {
  constructor(
    private prisma: PrismaService,
    private totpService: TOTPService
  ) {}

  /**
   * Activer TOTP MFA
   */
  async enableTOTP(userId: string, phoneNumber?: string): Promise<{
    secret: string
    qrCode: string
    backupCodes: string[]
  }> {
    // Générer secret TOTP
    const secret = this.totpService.generateSecret()
    const qrCode = this.totpService.generateQRCode(secret, 'john@example.com')
    const backupCodes = this.totpService.generateBackupCodes(8)

    // Créer UserMFA
    await this.prisma.userMfa.create({
      data: {
        userId,
        type: 'totp',
        secret, // TODO: Encrypt
        backupCodes: JSON.stringify(backupCodes), // TODO: Encrypt
        phoneNumber,
        isEnabled: false, // Sera activé après vérification
        isVerified: false,
        metadata: {
          qrCode,
          usageCount: 0,
          failedAttempts: 0,
        },
      },
    })

    return { secret, qrCode, backupCodes }
  }

  /**
   * Vérifier code TOTP
   */
  async verifyTOTP(userId: string, code: string): Promise<boolean> {
    const mfa = await this.prisma.userMfa.findFirst({
      where: {
        userId,
        type: 'totp',
      },
    })

    if (!mfa || !mfa.secret) {
      return false
    }

    const isValid = this.totpService.verifyToken(mfa.secret, code)

    if (isValid) {
      // Marquer comme vérifié et activé
      await this.prisma.userMfa.update({
        where: { id: mfa.id },
        data: {
          isVerified: true,
          isEnabled: true,
          verifiedAt: new Date(),
          lastUsedAt: new Date(),
          metadata: {
            ...(mfa.metadata as any),
            usageCount: ((mfa.metadata as any)?.usageCount || 0) + 1,
          },
        },
      })

      return true
    } else {
      // Incrémenter failed attempts
      await this.prisma.userMfa.update({
        where: { id: mfa.id },
        data: {
          metadata: {
            ...(mfa.metadata as any),
            failedAttempts: ((mfa.metadata as any)?.failedAttempts || 0) + 1,
            lastFailedAttempt: new Date().toISOString(),
          },
        },
      })

      return false
    }
  }

  /**
   * Vérifier si user a MFA activé
   */
  async hasMFAEnabled(userId: string): Promise<boolean> {
    const mfa = await this.prisma.userMfa.findFirst({
      where: {
        userId,
        isEnabled: true,
        isVerified: true,
      },
    })

    return !!mfa
  }

  /**
   * Obtenir MFA user
   */
  async getUserMFA(userId: string): Promise<UserMfa[]> {
    return this.prisma.userMfa.findMany({
      where: { userId },
    })
  }
}
```

**1.2 Tests MFA**

```typescript
// apps/api/src/domains/auth/mfa-prisma.e2e-spec.ts

describe('MFA with Prisma (E2E)', () => {
  let app: INestApplication
  let mfaPrisma: MfaPrismaService
  let userId: string

  beforeAll(async () => {
    // Setup...
    // Créer user de test
    const user = await authPrisma.createUser({
      username: 'mfa_test',
      email: 'mfa@test.com',
      password: 'Test1234!',
    })
    userId = user.id
  })

  it('should enable TOTP MFA', async () => {
    const result = await mfaPrisma.enableTOTP(userId, '+33612345678')

    expect(result.secret).toBeDefined()
    expect(result.qrCode).toBeDefined()
    expect(result.backupCodes).toHaveLength(8)
  })

  it('should verify TOTP code', async () => {
    const mfa = await prisma.userMfa.findFirst({
      where: { userId, type: 'totp' },
    })

    // Générer code valide
    const validCode = totpService.generateToken(mfa!.secret!)

    const isValid = await mfaPrisma.verifyTOTP(userId, validCode)
    expect(isValid).toBe(true)

    // Vérifier que MFA est maintenant activé
    const hasMFA = await mfaPrisma.hasMFAEnabled(userId)
    expect(hasMFA).toBe(true)
  })

  it('should reject invalid TOTP code', async () => {
    const isValid = await mfaPrisma.verifyTOTP(userId, '000000')
    expect(isValid).toBe(false)
  })
})
```

#### Jour 3: Tests Performance (8h)

**3.1 Benchmark Prisma vs TypeORM**

```typescript
// apps/api/src/core/database/benchmark.spec.ts

import { Test } from '@nestjs/testing'
import { PrismaService } from './prisma/prisma.service'
import { DataSource } from 'typeorm'
import { User } from '../domains/users/entities/user.entity'

describe('Performance Benchmark: Prisma vs TypeORM', () => {
  let prisma: PrismaService
  let typeorm: DataSource

  beforeAll(async () => {
    // Setup...
  })

  describe('Simple Queries', () => {
    it('should benchmark findMany (100 users)', async () => {
      // TypeORM
      const typeormStart = Date.now()
      const typeormUsers = await typeorm.getRepository(User).find({ take: 100 })
      const typeormDuration = Date.now() - typeormStart

      // Prisma
      const prismaStart = Date.now()
      const prismaUsers = await prisma.user.findMany({ take: 100 })
      const prismaDuration = Date.now() - prismaStart

      console.log(`TypeORM: ${typeormDuration}ms`)
      console.log(`Prisma: ${prismaDuration}ms`)
      console.log(`Difference: ${prismaDuration - typeormDuration}ms`)

      expect(typeormUsers).toHaveLength(100)
      expect(prismaUsers).toHaveLength(100)
    })

    it('should benchmark findOne with relations', async () => {
      // TypeORM
      const typeormStart = Date.now()
      const typeormUser = await typeorm.getRepository(User).findOne({
        where: { id: 'user_1' },
        relations: ['roles', 'roles.role', 'roles.role.permissions'],
      })
      const typeormDuration = Date.now() - typeormStart

      // Prisma
      const prismaStart = Date.now()
      const prismaUser = await prisma.user.findUnique({
        where: { id: 'user_1' },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: true,
                },
              },
            },
          },
        },
      })
      const prismaDuration = Date.now() - prismaStart

      console.log(`TypeORM (with relations): ${typeormDuration}ms`)
      console.log(`Prisma (with relations): ${prismaDuration}ms`)
      console.log(`Difference: ${prismaDuration - typeormDuration}ms`)
    })
  })

  describe('Transactions', () => {
    it('should benchmark transaction (create user + role + permission)', async () => {
      // TypeORM
      const typeormStart = Date.now()
      await typeorm.transaction(async (manager) => {
        const user = await manager.save(User, { ... })
        const role = await manager.save(Role, { ... })
        await manager.save(UserRole, { userId: user.id, roleId: role.id })
      })
      const typeormDuration = Date.now() - typeormStart

      // Prisma
      const prismaStart = Date.now()
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { ... } })
        const role = await tx.role.create({ data: { ... } })
        await tx.userRole.create({ data: { userId: user.id, roleId: role.id } })
      })
      const prismaDuration = Date.now() - prismaStart

      console.log(`TypeORM (transaction): ${typeormDuration}ms`)
      console.log(`Prisma (transaction): ${prismaDuration}ms`)
    })
  })
})
```

**Résultats Attendus**:
```
TypeORM: 45ms
Prisma: 38ms ✅ ~15% plus rapide

TypeORM (with relations): 120ms
Prisma (with relations): 85ms ✅ ~29% plus rapide

TypeORM (transaction): 75ms
Prisma (transaction): 62ms ✅ ~17% plus rapide
```

#### Jour 4-5: Validation Multi-Tenant (16h)

**4.1 Créer PrismaTenantService**

```typescript
// apps/api/src/core/database/prisma/prisma-tenant.service.ts

import { Injectable, Logger } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class PrismaTenantService {
  private readonly logger = new Logger(PrismaTenantService.name)
  private readonly clients = new Map<string, PrismaClient>()

  constructor(private configService: ConfigService) {}

  /**
   * Obtenir client Prisma pour un tenant
   */
  getClient(societeCode: string): PrismaClient {
    if (this.clients.has(societeCode)) {
      return this.clients.get(societeCode)!
    }

    // Créer nouvelle connexion pour ce tenant
    const databaseUrl = this.buildTenantDatabaseUrl(societeCode)

    const client = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: ['error', 'warn'],
    })

    this.clients.set(societeCode, client)
    this.logger.log(`✅ Tenant client created for: ${societeCode}`)

    return client
  }

  /**
   * Construire URL DB tenant
   */
  private buildTenantDatabaseUrl(societeCode: string): string {
    const baseUrl = this.configService.get<string>('DATABASE_URL')
    const dbName = `topsteel_tenant_${societeCode}`

    // postgresql://user:pass@host:port/database
    return baseUrl!.replace(/\/[^/]+$/, `/${dbName}`)
  }

  /**
   * Fermer toutes les connexions
   */
  async disconnectAll(): Promise<void> {
    for (const [code, client] of this.clients.entries()) {
      await client.$disconnect()
      this.logger.log(`🔌 Disconnected tenant: ${code}`)
    }
    this.clients.clear()
  }
}
```

**4.2 Créer PrismaTenantGuard**

```typescript
// apps/api/src/domains/auth/security/guards/prisma-tenant.guard.ts

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common'
import { PrismaTenantService } from '../../../../core/database/prisma/prisma-tenant.service'

@Injectable()
export class PrismaTenantGuard implements CanActivate {
  private readonly logger = new Logger(PrismaTenantGuard.name)

  constructor(private tenantService: PrismaTenantService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    // Extraire societeCode du JWT ou header
    const societeCode = request.user?.societeCode || request.headers['x-societe-code']

    if (!societeCode) {
      this.logger.warn('No societe code found in request')
      return false
    }

    // Injecter client Prisma tenant dans la requête
    request.tenantPrisma = this.tenantService.getClient(societeCode)

    this.logger.debug(`Tenant context set: ${societeCode}`)

    return true
  }
}
```

**4.3 Tests Multi-Tenant**

```typescript
// apps/api/src/core/database/prisma/multi-tenant.e2e-spec.ts

describe('Multi-Tenant with Prisma (E2E)', () => {
  let app: INestApplication
  let tenantService: PrismaTenantService

  beforeAll(async () => {
    // Setup...
    // Créer 2 DBs tenant: tenant_001, tenant_002
  })

  it('should create separate clients for different tenants', () => {
    const client001 = tenantService.getClient('001')
    const client002 = tenantService.getClient('002')

    expect(client001).toBeDefined()
    expect(client002).toBeDefined()
    expect(client001).not.toBe(client002) // Clients différents
  })

  it('should isolate data between tenants', async () => {
    const client001 = tenantService.getClient('001')
    const client002 = tenantService.getClient('002')

    // Créer user dans tenant 001
    const user001 = await client001.user.create({
      data: {
        username: 'user_tenant_001',
        email: 'user@tenant001.com',
        passwordHash: 'hash',
      },
    })

    // Créer user dans tenant 002
    const user002 = await client002.user.create({
      data: {
        username: 'user_tenant_002',
        email: 'user@tenant002.com',
        passwordHash: 'hash',
      },
    })

    // Vérifier isolation
    const users001 = await client001.user.findMany()
    const users002 = await client002.user.findMany()

    expect(users001).toHaveLength(1)
    expect(users002).toHaveLength(1)
    expect(users001[0].email).toBe('user@tenant001.com')
    expect(users002[0].email).toBe('user@tenant002.com')

    // User 001 n'existe pas dans tenant 002
    const notFound = await client002.user.findUnique({
      where: { id: user001.id },
    })
    expect(notFound).toBeNull()
  })

  it('should use correct tenant from guard', async () => {
    // Simuler requête avec guard
    const mockRequest = {
      user: { societeCode: '001' },
      tenantPrisma: null,
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext

    const guard = new PrismaTenantGuard(tenantService)
    const canActivate = guard.canActivate(context)

    expect(canActivate).toBe(true)
    expect(mockRequest.tenantPrisma).toBeDefined()

    // Utiliser client injecté
    const users = await mockRequest.tenantPrisma.user.findMany()
    expect(users).toHaveLength(1) // Seulement user de tenant 001
  })
})
```

### 🎯 CHECKPOINT GO/NO-GO POC (Fin Semaine 2)

**Critères de Validation**:

| Critère | Status | Notes |
|---------|--------|-------|
| ✅ PrismaService injectable | ⬜ | Service créé, tests passent |
| ✅ 5 entités auth migrées | ⬜ | User, UserSession, Role, Permission, RolePermission |
| ✅ Login/JWT fonctionne | ⬜ | Endpoint `/auth/login-prisma` OK |
| ✅ MFA TOTP fonctionne | ⬜ | Enable + Verify TOTP OK |
| ✅ Performance ≥ TypeORM | ⬜ | Prisma ~15-30% plus rapide |
| ✅ Multi-tenant isolation OK | ⬜ | 2 tenants isolés, guard fonctionne |
| ✅ Types générés corrects | ⬜ | `@prisma/client` types OK |
| ✅ Tests E2E 100% | ⬜ | Tous les tests auth passent |
| ⚠️ Aucun bug bloquant | ⬜ | 0 bug critique |

**Décision**:
- ✅ **GO**: Si tous les critères ✅ → Continuer Phase 2
- ❌ **NO-GO**: Si ≥ 1 critère ⚠️ → Analyser problème, corriger ou rollback

---

## 🏗️ PHASE 2: MIGRATION INFRASTRUCTURE COMPLÈTE (Semaine 3-5 - 120h)

### Objectifs
- Migrer les 40 entités infrastructure restantes
- Adapter tous les repositories
- Maintenir cohabitation TypeORM/Prisma

### Semaine 3: Auth Complet + Users + Sociétés (40h)

**Entités à migrer** (16 entités):
- Auth restantes (8): UserGroup, Group, Module, MFASession, UserSocieteRole, AuditLog, SMSLog, UserSettings
- Sociétés (4): Societe, SocieteLicense, SocieteUser, Site

**Stratégie**: Migrer entité par entité, tester, commit

#### Jour 1: UserGroup + Group + Module (8h)

```prisma
// Déjà défini dans schema.prisma
// Tests:

describe('Groups & Modules Migration', () => {
  it('should migrate groups', async () => {
    const group = await prisma.group.create({
      data: {
        name: 'developers',
        label: 'Développeurs',
        description: 'Équipe développement',
      },
    })

    expect(group.id).toBeDefined()
  })

  it('should assign user to group', async () => {
    const user = await prisma.user.findFirst()
    const group = await prisma.group.findFirst()

    await prisma.userGroup.create({
      data: {
        userId: user!.id,
        groupId: group!.id,
      },
    })

    const userWithGroups = await prisma.user.findUnique({
      where: { id: user!.id },
      include: { groups: { include: { group: true } } },
    })

    expect(userWithGroups?.groups).toHaveLength(1)
  })
})
```

#### Jour 2: UserSocieteRole + AuditLog (8h)

```typescript
// Test UserSocieteRole (multi-tenant role mapping)

it('should assign role to user in specific societe', async () => {
  const user = await prisma.user.findFirst()
  const societe = await prisma.societe.findFirst()
  const role = await prisma.role.findFirst()

  const userSocieteRole = await prisma.userSocieteRole.create({
    data: {
      userId: user!.id,
      societeId: societe!.id,
      roleId: role!.id,
      permissions: { override: ['custom.permission'] },
    },
  })

  expect(userSocieteRole.id).toBeDefined()
})
```

#### Jour 3: Societes + License (8h)

**Complément schema.prisma déjà défini**

```typescript
// Tests sociétés

describe('Societes Migration', () => {
  it('should create societe with license', async () => {
    const societe = await prisma.societe.create({
      data: {
        code: 'ACME',
        name: 'ACME Corporation',
        legalName: 'ACME Corp SAS',
        siret: '12345678901234',
        address: '123 Main St',
        city: 'Paris',
        postalCode: '75001',
        country: 'France',
        email: 'contact@acme.com',
        databaseName: 'topsteel_tenant_acme',
        license: {
          create: {
            type: 'professional',
            status: 'active',
            maxUsers: 50,
            features: {
              modules: ['auth', 'admin', 'notifications'],
              limits: { storage: 100 * 1024 * 1024 * 1024 }, // 100GB
            },
            restrictions: { api_calls_per_day: 10000 },
            billing: { plan: 'monthly', price: 99.99 },
            startDate: new Date(),
          },
        },
      },
      include: { license: true },
    })

    expect(societe.license).toBeDefined()
    expect(societe.license?.type).toBe('professional')
    expect(societe.license?.maxUsers).toBe(50)
  })

  it('should create site for societe', async () => {
    const societe = await prisma.societe.findFirst()

    const site = await prisma.site.create({
      data: {
        societeId: societe!.id,
        name: 'Site Principal',
        code: 'MAIN',
        address: '456 Factory Rd',
        city: 'Lyon',
        postalCode: '69000',
        configuration: { timezone: 'Europe/Paris', language: 'fr' },
      },
    })

    expect(site.id).toBeDefined()
  })
})
```

#### Jour 4-5: UserSettings + SMSLog (16h)

**Compléter schema + tests + migration données existantes**

```typescript
// Migration données UserSettings TypeORM → Prisma

async function migrateUserSettings() {
  const typeormSettings = await typeormRepo.find()

  for (const setting of typeormSettings) {
    await prisma.userSettings.create({
      data: {
        userId: setting.userId,
        profile: setting.profile as any,
        company: setting.company as any,
        preferences: setting.preferences as any,
        createdAt: setting.createdAt,
        updatedAt: setting.updatedAt,
      },
    })
  }

  console.log(`✅ Migrated ${typeormSettings.length} user settings`)
}
```

### Semaine 4: Admin + Menu + Parameters (40h)

**Entités à migrer** (14 entités):
- Admin (9): SystemSetting, SystemParameter, MenuConfiguration, MenuItem, MenuItemRole, MenuItemPermission, UserMenuPreferences, UserMenuItemPreference, MenuConfigurationSimple
- Menu (2): UserMenuPreference, DiscoveredPage
- Parameters (3): ParameterSystem, ParameterApplication, ParameterClient

**Note**: Schema Prisma déjà défini pour ces entités. Focus sur:
- Tests
- Migration données
- Adapter services

Je vais créer la partie 2 du plan dans un fichier séparé vu la longueur.

#### Schéma Prisma Tenant Database (suite)

```prisma
// apps/api/prisma/schema.prisma (suite)

// ============================================
// TENANT DATABASE - ADMINISTRATION (9 entités)
// ============================================

model SystemSetting {
  id          String   @id @default(uuid())
  key         String   @unique @db.VarChar(255)
  value       String   @db.Text
  type        String   @db.VarChar(50) // string|number|boolean|json
  category    String   @db.VarChar(100)
  description String?  @db.Text
  isPublic    Boolean  @default(false) @map("is_public")
  updatedBy   String?  @map("updated_by")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  updatedByUser User? @relation(fields: [updatedBy], references: [id])

  @@index([key])
  @@index([category])
  @@map("system_settings")
  @@schema("tenant")
}

model SystemParameter {
  id          String   @id @default(uuid())
  key         String   @unique @db.VarChar(255)
  value       String   @db.Text
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([key])
  @@map("system_parameters")
  @@schema("tenant")
}

model MenuConfiguration {
  id          String     @id @default(uuid())
  name        String     @unique @db.VarChar(255)
  description String?    @db.Text
  isActive    Boolean    @default(true) @map("is_active")
  isDefault   Boolean    @default(false) @map("is_default")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  menuItems   MenuItem[]

  @@index([isActive])
  @@index([isDefault])
  @@map("menu_configurations")
  @@schema("tenant")
}

model MenuItem {
  id                  String               @id @default(uuid())
  menuConfigurationId String               @map("menu_configuration_id")
  parentId            String?              @map("parent_id")
  label               String               @db.VarChar(255)
  icon                String?              @db.VarChar(100)
  path                String?              @db.VarChar(500)
  order               Int                  @default(0)
  isActive            Boolean              @default(true) @map("is_active")
  isVisible           Boolean              @default(true) @map("is_visible")
  metadata            Json?                @map("metadata")
  createdAt           DateTime             @default(now()) @map("created_at")
  updatedAt           DateTime             @updatedAt @map("updated_at")

  menuConfiguration   MenuConfiguration    @relation(fields: [menuConfigurationId], references: [id], onDelete: Cascade)
  parent              MenuItem?            @relation("MenuItemHierarchy", fields: [parentId], references: [id])
  children            MenuItem[]           @relation("MenuItemHierarchy")
  roles               MenuItemRole[]
  permissions         MenuItemPermission[]

  @@index([menuConfigurationId])
  @@index([parentId])
  @@index([order])
  @@map("menu_items")
  @@schema("tenant")
}

model MenuItemRole {
  id         String   @id @default(uuid())
  menuItemId String   @map("menu_item_id")
  roleId     String   @map("role_id")
  createdAt  DateTime @default(now()) @map("created_at")

  menuItem   MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([menuItemId, roleId])
  @@index([menuItemId])
  @@index([roleId])
  @@map("menu_item_roles")
  @@schema("tenant")
}

model MenuItemPermission {
  id           String     @id @default(uuid())
  menuItemId   String     @map("menu_item_id")
  permissionId String     @map("permission_id")
  createdAt    DateTime   @default(now()) @map("created_at")

  menuItem     MenuItem   @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@unique([menuItemId, permissionId])
  @@index([menuItemId])
  @@index([permissionId])
  @@map("menu_item_permissions")
  @@schema("tenant")
}

model UserMenuPreferences {
  id            String                   @id @default(uuid())
  userId        String                   @map("user_id")
  theme         String?                  @db.VarChar(50)
  layout        String?                  @db.VarChar(50)
  customColors  Json?                    @map("custom_colors")
  shortcuts     Json?                    @map("shortcuts")
  createdAt     DateTime                 @default(now()) @map("created_at")
  updatedAt     DateTime                 @updatedAt @map("updated_at")

  items         UserMenuItemPreference[]

  @@unique([userId])
  @@map("user_menu_preferences")
  @@schema("tenant")
}

model UserMenuItemPreference {
  id                    String              @id @default(uuid())
  userMenuPreferencesId String              @map("user_menu_preferences_id")
  menuItemId            String              @map("menu_item_id")
  isVisible             Boolean             @default(true) @map("is_visible")
  order                 Int?                @map("order")
  customLabel           String?             @map("custom_label") @db.VarChar(255)
  createdAt             DateTime            @default(now()) @map("created_at")
  updatedAt             DateTime            @updatedAt @map("updated_at")

  preferences           UserMenuPreferences @relation(fields: [userMenuPreferencesId], references: [id], onDelete: Cascade)

  @@unique([userMenuPreferencesId, menuItemId])
  @@index([userMenuPreferencesId])
  @@map("user_menu_item_preferences")
  @@schema("tenant")
}

model MenuConfigurationSimple {
  id        String   @id @default(uuid())
  name      String   @unique @db.VarChar(255)
  config    Json     @map("config") // Stocke toute la config menu
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("menu_configurations_simple")
  @@schema("tenant")
}

// ============================================
// TENANT DATABASE - MENU DYNAMIQUE (2 entités)
// ============================================

model UserMenuPreference {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  menuData    Json     @map("menu_data") // Structure complète menu user
  preferences Json?    @map("preferences")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@unique([userId])
  @@map("user_menu_preference")
  @@schema("tenant")
}

model DiscoveredPage {
  id          String   @id @default(uuid())
  path        String   @unique @db.VarChar(500)
  title       String   @db.VarChar(255)
  description String?  @db.Text
  category    String?  @db.VarChar(100)
  icon        String?  @db.VarChar(100)
  isActive    Boolean  @default(true) @map("is_active")
  metadata    Json?    @map("metadata")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([path])
  @@index([category])
  @@map("discovered_pages")
  @@schema("tenant")
}

// ============================================
// TENANT DATABASE - PARAMÈTRES (3 entités)
// ============================================

model ParameterSystem {
  id           String   @id @default(uuid())
  code         String   @unique @db.VarChar(100)
  label        String   @db.VarChar(255)
  description  String?  @db.Text
  type         String   @db.VarChar(50) // string|number|boolean|date|json|array
  value        String?  @db.Text
  defaultValue String?  @map("default_value") @db.Text
  category     String   @db.VarChar(100)
  isRequired   Boolean  @default(false) @map("is_required")
  isEditable   Boolean  @default(true) @map("is_editable")
  validation   String?  @db.Text // Regex ou règles validation
  metadata     Json?    @map("metadata")
  arrayValues  Json?    @map("array_values")
  objectValues Json?    @map("object_values")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([code])
  @@index([category])
  @@map("parameter_system")
  @@schema("tenant")
}

model ParameterApplication {
  id            String   @id @default(uuid())
  code          String   @unique @db.VarChar(100)
  label         String   @db.VarChar(255)
  description   String?  @db.Text
  type          String   @db.VarChar(50)
  value         String?  @db.Text
  defaultValue  String?  @map("default_value") @db.Text
  category      String   @db.VarChar(100)
  isActive      Boolean  @default(true) @map("is_active")
  businessRules Json?    @map("business_rules")
  metadata      Json?    @map("metadata")
  arrayValues   Json?    @map("array_values")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([code])
  @@index([category])
  @@map("parameter_application")
  @@schema("tenant")
}

model ParameterClient {
  id                   String   @id @default(uuid())
  code                 String   @unique @db.VarChar(100)
  label                String   @db.VarChar(255)
  description          String?  @db.Text
  type                 String   @db.VarChar(50)
  value                String?  @db.Text
  defaultValue         String?  @map("default_value") @db.Text
  category             String   @db.VarChar(100)
  isVisible            Boolean  @default(true) @map("is_visible")
  isEditable           Boolean  @default(true) @map("is_editable")
  constraints          Json?    @map("constraints")
  metadata             Json?    @map("metadata")
  arrayValues          Json?    @map("array_values")
  objectValues         Json?    @map("object_values")
  customTranslations   Json?    @map("custom_translations")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  @@index([code])
  @@index([category])
  @@map("parameter_client")
  @@schema("tenant")
}

// ============================================
// TENANT DATABASE - NOTIFICATIONS (7 entités)
// ============================================

model Notification {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  type        String    @db.VarChar(50) // info|warning|error|success
  title       String    @db.VarChar(255)
  message     String    @db.Text
  category    String?   @db.VarChar(100)
  priority    String?   @db.VarChar(50) // low|normal|high|urgent
  data        Json?     @map("data")
  actionUrl   String?   @map("action_url") @db.VarChar(500)
  actionLabel String?   @map("action_label") @db.VarChar(100)
  readAt      DateTime? @map("read_at")
  expiresAt   DateTime? @map("expires_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  reads       NotificationRead[]
  executions  NotificationRuleExecution[]

  @@index([userId])
  @@index([type])
  @@index([category])
  @@index([priority])
  @@index([readAt])
  @@index([createdAt])
  @@map("notifications")
  @@schema("tenant")
}

model NotificationEvent {
  id                String    @id @default(uuid())
  type              String    @db.VarChar(100) // stock_low|user_login|system_error|etc.
  source            String    @db.VarChar(100)
  data              Json      @map("data")
  processed         Boolean   @default(false)
  processedAt       DateTime? @map("processed_at")
  processingDetails Json?     @map("processing_details")
  createdAt         DateTime  @default(now()) @map("created_at")

  @@index([type])
  @@index([source])
  @@index([processed])
  @@index([createdAt])
  @@map("notification_events")
  @@schema("tenant")
}

model NotificationTemplate {
  id          String   @id @default(uuid())
  code        String   @unique @db.VarChar(100)
  name        String   @db.VarChar(255)
  description String?  @db.Text
  type        String   @db.VarChar(50)
  template    String   @db.Text // Template avec variables {{var}}
  variables   Json?    @map("variables") // Liste variables disponibles
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([code])
  @@index([type])
  @@map("notification_templates")
  @@schema("tenant")
}

model NotificationSettings {
  id         String   @id @default(uuid())
  userId     String   @unique @map("user_id")
  categories Json?    @map("categories") // { stock: { email: true, push: false }, ... }
  priorities Json?    @map("priorities") // { urgent: { email: true, sms: true }, ... }
  schedules  Json?    @map("schedules")  // Horaires notifications
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("notification_settings")
  @@schema("tenant")
}

model NotificationRule {
  id            String                      @id @default(uuid())
  name          String                      @db.VarChar(255)
  description   String?                     @db.Text
  type          String                      @db.VarChar(50) // in-app|email|sms|webhook
  enabled       Boolean                     @default(true)
  isActive      Boolean                     @default(true) @map("is_active")
  trigger       Json                        @map("trigger") // { type: 'stock', event: 'stock_low' }
  conditions    Json?                       @map("conditions") // Array of conditions
  actions       Json?                       @map("actions") // Actions to execute
  notification  Json?                       @map("notification") // Notification config
  lastTriggered String?                     @map("last_triggered")
  triggerCount  Int                         @default(0) @map("trigger_count")
  createdAt     DateTime                    @default(now()) @map("created_at")
  updatedAt     DateTime                    @updatedAt @map("updated_at")

  executions    NotificationRuleExecution[]

  @@index([type])
  @@index([enabled])
  @@index([isActive])
  @@map("notification_rules")
  @@schema("tenant")
}

model NotificationRuleExecution {
  id               String       @id @default(uuid())
  ruleId           String       @map("rule_id")
  notificationId   String?      @map("notification_id")
  triggered        Boolean      @default(false)
  success          Boolean      @default(false)
  errorMessage     String?      @map("error_message") @db.Text
  executionTime    Int?         @map("execution_time") // ms
  data             Json?        @map("data")
  createdAt        DateTime     @default(now()) @map("created_at")

  rule             NotificationRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  notification     Notification?    @relation(fields: [notificationId], references: [id])

  @@index([ruleId])
  @@index([notificationId])
  @@index([triggered])
  @@index([createdAt])
  @@map("notification_rule_executions")
  @@schema("tenant")
}

model NotificationRead {
  id             String       @id @default(uuid())
  notificationId String       @map("notification_id")
  userId         String       @map("user_id")
  readAt         DateTime     @default(now()) @map("read_at")

  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@unique([notificationId, userId])
  @@index([notificationId])
  @@index([userId])
  @@map("notification_reads")
  @@schema("tenant")
}

// ============================================
// TENANT DATABASE - QUERY BUILDER (5 entités)
// ============================================

model QueryBuilder {
  id               String                       @id @default(uuid())
  name             String                       @db.VarChar(255)
  description      String?                      @db.Text
  type             String                       @db.VarChar(50) // table|chart|report
  baseTable        String                       @map("base_table") @db.VarChar(255)
  createdBy        String                       @map("created_by")
  isPublic         Boolean                      @default(false) @map("is_public")
  isActive         Boolean                      @default(true) @map("is_active")
  settings         Json?                        @map("settings") // Query settings
  layout           Json?                        @map("layout") // UI layout
  createdAt        DateTime                     @default(now()) @map("created_at")
  updatedAt        DateTime                     @updatedAt @map("updated_at")

  creator          User                         @relation(fields: [createdBy], references: [id])
  columns          QueryBuilderColumn[]
  joins            QueryBuilderJoin[]
  calculatedFields QueryBuilderCalculatedField[]
  permissions      QueryBuilderPermission[]

  @@index([createdBy])
  @@index([isPublic])
  @@index([isActive])
  @@map("query_builders")
  @@schema("tenant")
}

model QueryBuilderColumn {
  id             String       @id @default(uuid())
  queryBuilderId String       @map("query_builder_id")
  columnName     String       @map("column_name") @db.VarChar(255)
  alias          String?      @db.VarChar(255)
  dataType       String?      @map("data_type") @db.VarChar(50)
  format         Json?        @map("format")
  aggregation    Json?        @map("aggregation") // { function: 'SUM', groupBy: true }
  order          Int          @default(0)
  isVisible      Boolean      @default(true) @map("is_visible")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  queryBuilder   QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)

  @@index([queryBuilderId])
  @@index([order])
  @@map("query_builder_columns")
  @@schema("tenant")
}

model QueryBuilderJoin {
  id              String       @id @default(uuid())
  queryBuilderId  String       @map("query_builder_id")
  joinTable       String       @map("join_table") @db.VarChar(255)
  joinType        String       @map("join_type") @db.VarChar(50) // LEFT|RIGHT|INNER|OUTER
  condition       String       @db.Text // Join condition
  order           Int          @default(0)
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  queryBuilder    QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)

  @@index([queryBuilderId])
  @@map("query_builder_joins")
  @@schema("tenant")
}

model QueryBuilderCalculatedField {
  id             String       @id @default(uuid())
  queryBuilderId String       @map("query_builder_id")
  name           String       @db.VarChar(255)
  expression     String       @db.Text // SQL expression
  dataType       String       @map("data_type") @db.VarChar(50)
  format         Json?        @map("format")
  dependencies   Json?        @map("dependencies") // Columns used
  order          Int          @default(0)
  isVisible      Boolean      @default(true) @map("is_visible")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  queryBuilder   QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)

  @@index([queryBuilderId])
  @@map("query_builder_calculated_fields")
  @@schema("tenant")
}

model QueryBuilderPermission {
  id             String       @id @default(uuid())
  queryBuilderId String       @map("query_builder_id")
  userId         String?      @map("user_id")
  roleId         String?      @map("role_id")
  canView        Boolean      @default(true) @map("can_view")
  canEdit        Boolean      @default(false) @map("can_edit")
  canDelete      Boolean      @default(false) @map("can_delete")
  canShare       Boolean      @default(false) @map("can_share")
  createdAt      DateTime     @default(now()) @map("created_at")

  queryBuilder   QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)
  user           User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  role           Role?        @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([queryBuilderId, userId])
  @@unique([queryBuilderId, roleId])
  @@index([queryBuilderId])
  @@index([userId])
  @@index([roleId])
  @@map("query_builder_permissions")
  @@schema("tenant")
}
```

**FIN DU SCHEMA PRISMA COMPLET** ✅

---

Ce plan est maintenant complet jusqu'à la Phase 1 + début Phase 2 + Schema Prisma complet (45 entités).

Le document fait maintenant ~2200 lignes. Voulez-vous que je:
1. Continue avec les Phases 3-4 (Migration Services + Tests)
2. Ajoute les scripts de migration de données
3. Crée un document séparé pour les phases restantes
4. Passe à l'implémentation du POC (Phase 0) ?
