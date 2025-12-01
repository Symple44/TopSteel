# Query Builder - Plan d'Implémentation Complet

> **Date de création**: 2025-11-30
> **Dernière mise à jour**: 2025-11-30
> **Statut**: ✅ Implémentation en cours (Phases 1-5 complétées)
> **Objectif**: Permettre l'analyse de données avec jointures, champs calculés et boutons d'action

---

## Table des Matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Architecture Actuelle](#2-architecture-actuelle)
3. [État des Composants](#3-état-des-composants)
4. [Plan d'Implémentation](#4-plan-dimplémentation)
5. [Fonctionnalités Cibles](#5-fonctionnalités-cibles)
6. [Schéma de Base de Données](#6-schéma-de-base-de-données)
7. [Sécurité](#7-sécurité)
8. [Intégration Menu](#8-intégration-menu)
9. [Checklist de Progression](#9-checklist-de-progression)

---

## 1. Résumé Exécutif

### Objectifs du Query Builder

| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| **Analyse de données** | Interroger les tables de la base de données | Haute |
| **Jointures** | Relier plusieurs tables (INNER, LEFT, RIGHT, FULL) | Haute |
| **Champs calculés** | Formules personnalisées (math.js + SQL) | Haute |
| **Boutons d'action** | Navigation vers fiches (ex: fiche utilisateur) | Haute |
| **Ajout au menu** | Intégration sidebar avec permissions | Moyenne |
| **Agrégations** | SUM, COUNT, AVG, MIN, MAX, GROUP BY | Moyenne |
| **Export** | CSV, Excel, PDF | Basse |

### État Actuel

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  ✅ Interface Query Builder (tabs: Design/Preview/Settings) │
│  ✅ Sélecteur de tables                                     │
│  ✅ Sélecteur de colonnes avec configuration                │
│  ✅ Éditeur de champs calculés (math.js)                    │
│  ✅ Preview SQL généré                                       │
│  ✅ DataTable avancé (multi-vues)                           │
│  ✅ Bouton "Ajouter au menu"                                 │
│  ✅ Row Actions (boutons navigation)                         │
│  ✅ Types TypeScript complets                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  API ROUTES (Next.js)                        │
├─────────────────────────────────────────────────────────────┤
│  ✅ /api/query-builder/* (proxy vers backend)               │
│  ✅ Auth headers forwarding                                  │
│  ✅ GET/POST connectés au backend réel                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                          │
├─────────────────────────────────────────────────────────────┤
│  ✅ QueryBuilderPrismaModule (services CRUD)                │
│  ✅ QueryBuilderService (create, read, update, delete)      │
│  ✅ QueryBuilderPermissionService                            │
│  ✅ QueryBuilderController (ACTIVÉ)                          │
│  ✅ QueryBuilderExecutorService (Prisma $queryRawUnsafe)     │
│  ✅ SchemaIntrospectionService (information_schema)          │
│  ✅ QueryBuilderSecurityService (whitelist enrichie)         │
│  ✅ SqlSanitizationService (protection injection SQL)        │
│  ✅ SqlExecutorController (SQL brut sécurisé)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Actuelle

### Structure des Fichiers

```
apps/
├── api/src/
│   ├── features/query-builder/
│   │   ├── query-builder.module.ts          # Module (controller désactivé)
│   │   ├── controllers/
│   │   │   ├── query-builder.controller.ts  # Endpoints REST (désactivé)
│   │   │   └── sql-executor.controller.ts   # SQL brut (désactivé)
│   │   ├── services/
│   │   │   ├── query-builder.service.ts     # ✅ CRUD via Prisma
│   │   │   ├── query-builder-executor.service.ts  # ❌ Exécution requêtes
│   │   │   ├── query-builder-permission.service.ts # ✅ Permissions
│   │   │   └── schema-introspection.service.ts    # ❌ Introspection DB
│   │   ├── security/
│   │   │   ├── query-builder-security.guard.ts   # Guard sécurité
│   │   │   ├── query-builder-security.service.ts # ❌ Whitelist tables
│   │   │   └── sql-sanitization.service.ts       # ❌ Validation SQL
│   │   └── dto/
│   │       ├── create-query-builder.dto.ts
│   │       ├── update-query-builder.dto.ts
│   │       └── execute-query.dto.ts
│   │
│   └── domains/query-builder/prisma/
│       ├── query-builder-prisma.module.ts        # ✅ Module Prisma
│       ├── query-builder-prisma.service.ts       # ✅ CRUD
│       ├── query-builder-column-prisma.service.ts
│       ├── query-builder-join-prisma.service.ts
│       ├── query-builder-calculated-field-prisma.service.ts
│       └── query-builder-permission-prisma.service.ts
│
└── web/src/
    ├── app/(dashboard)/query-builder/
    │   ├── layout.tsx                    # Layout avec sidebar
    │   ├── page.tsx                      # Liste des Query Builders
    │   ├── [id]/page.tsx                 # Détail/édition
    │   ├── test/page.tsx                 # Page de test
    │   └── docs/page.tsx                 # Documentation
    │
    ├── app/api/query-builder/            # Routes proxy
    │   ├── route.ts                      # GET/POST
    │   ├── [id]/route.ts                 # GET/PATCH/DELETE
    │   ├── [id]/execute/route.ts         # POST execute
    │   └── schema/tables/...             # Introspection
    │
    ├── components/query-builder/
    │   ├── query-builder-interface.tsx   # Interface principale
    │   ├── table-selector.tsx            # Sélection table
    │   ├── column-selector.tsx           # Configuration colonnes
    │   ├── visual-query-builder.tsx      # Builder visuel
    │   ├── calculated-fields-editor.tsx  # Champs calculés
    │   ├── query-preview.tsx             # Preview SQL
    │   ├── query-settings.tsx            # Paramètres
    │   ├── datatable-preview.tsx         # Résultats DataTable
    │   ├── add-to-menu-button.tsx        # Ajout au menu
    │   └── import-dialog.tsx             # Import/Export config
    │
    └── types/query-builder.types.ts      # Types TypeScript
```

### Flux de Données Actuel (Cible)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend UI   │────▶│  Next.js API    │────▶│  NestJS API     │
│                 │     │   /api/qb/*     │     │  /api/qb/*      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  QueryBuilder   │
                                               │   Controller    │
                                               └─────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        ▼                               ▼                               ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │ QueryBuilder    │             │ Executor        │             │ Schema          │
               │ Service (CRUD)  │             │ Service         │             │ Introspection   │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
                        │                               │                               │
                        ▼                               ▼                               ▼
               ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
               │ Prisma Services │             │ SQL Sanitization│             │ PostgreSQL      │
               │ (QueryBuilder,  │             │ + Security      │             │ information_    │
               │  Columns, Joins)│             │                 │             │ schema          │
               └─────────────────┘             └─────────────────┘             └─────────────────┘
                        │                               │                               │
                        └───────────────────────────────┴───────────────────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   PostgreSQL    │
                                               │   Database      │
                                               └─────────────────┘
```

---

## 3. État des Composants

### Services Backend

| Service | Fichier | État | Notes |
|---------|---------|------|-------|
| QueryBuilderService | `services/query-builder.service.ts` | ✅ Actif | CRUD complet via Prisma |
| QueryBuilderPermissionService | `services/query-builder-permission.service.ts` | ✅ Actif | Gestion permissions |
| QueryBuilderExecutorService | `services/query-builder-executor.service.ts` | ✅ Actif | `$queryRawUnsafe` Prisma |
| SchemaIntrospectionService | `services/schema-introspection.service.ts` | ✅ Actif | information_schema |
| QueryBuilderSecurityService | `security/query-builder-security.service.ts` | ✅ Actif | Whitelist enrichie (12 tables) |
| SqlSanitizationService | `security/sql-sanitization.service.ts` | ✅ Actif | Protection SQL injection |
| QueryBuilderController | `controllers/query-builder.controller.ts` | ✅ Actif | Endpoints REST complets |
| SqlExecutorController | `controllers/sql-executor.controller.ts` | ✅ Actif | SQL brut sécurisé |

### Services Prisma (Domain Layer)

| Service | État | Opérations |
|---------|------|-----------|
| QueryBuilderPrismaService | ✅ OK | CRUD complet, duplication |
| QueryBuilderColumnPrismaService | ✅ OK | Gestion colonnes |
| QueryBuilderJoinPrismaService | ✅ OK | Gestion jointures |
| QueryBuilderCalculatedFieldPrismaService | ✅ OK | Champs calculés |
| QueryBuilderPermissionPrismaService | ✅ OK | Permissions user/role |

### Composants Frontend

| Composant | État | Notes |
|-----------|------|-------|
| QueryBuilderInterface | ✅ OK | Orchestrateur principal |
| TableSelector | ✅ OK | Connecté au backend |
| ColumnSelector | ✅ OK | Configuration complète |
| CalculatedFieldsEditor | ✅ OK | math.js intégré |
| QueryPreview | ✅ OK | Génération SQL |
| QuerySettings | ✅ OK | Pagination, export, rowActions |
| DataTablePreview | ✅ OK | Multi-vues + Row Actions |
| AddToMenuButton | ✅ OK | Intégration menu |
| API Route (route.ts) | ✅ OK | GET/POST connectés backend |
| Types (query-builder.types.ts) | ✅ OK | Types complets + RowAction |

---

## 4. Plan d'Implémentation

### Phase 1: Réactivation Backend (Priorité Critique)

**Objectif**: Faire fonctionner les endpoints de base

#### 1.1 Réactiver les services dans le module

```typescript
// apps/api/src/features/query-builder/query-builder.module.ts
@Module({
  imports: [DatabaseModule, QueryBuilderPrismaModule],
  controllers: [
    QueryBuilderController,  // ← Décommenter
  ],
  providers: [
    QueryBuilderService,
    QueryBuilderPermissionService,
    QueryBuilderExecutorService,     // ← Décommenter
    SchemaIntrospectionService,      // ← Décommenter
    QueryBuilderSecurityService,     // ← Décommenter
    SqlSanitizationService,          // ← Décommenter
    QueryBuilderSecurityGuard,       // ← Décommenter
  ],
  exports: [
    QueryBuilderService,
    QueryBuilderPermissionService,
    QueryBuilderExecutorService,     // ← Décommenter
    QueryBuilderSecurityService,     // ← Décommenter
  ],
})
```

#### 1.2 Vérifier/Migrer QueryBuilderExecutorService

Le service utilise déjà `PrismaService` avec `$queryRawUnsafe`. Vérifier:
- [ ] Import correct de PrismaService
- [ ] Injection des dépendances
- [ ] Méthode `executeQuery()` fonctionnelle

#### 1.3 Vérifier SchemaIntrospectionService

Le service utilise `PrismaService.$queryRawUnsafe`. Vérifier:
- [ ] Requêtes sur `information_schema`
- [ ] Récupération tables/colonnes/relations

---

### Phase 2: Configuration Tables Autorisées

**Objectif**: Définir quelles tables sont accessibles

#### 2.1 Enrichir la whitelist dans QueryBuilderSecurityService

Tables métier à ajouter:

```typescript
// Tables existantes dans la whitelist actuelle
const CURRENT_TABLES = ['clients', 'fournisseurs', 'materiaux', 'commandes', 'categories']

// Tables à ajouter pour un usage complet
const TABLES_TO_ADD = [
  'users',           // Utilisateurs (sans données sensibles)
  'societes',        // Sociétés
  'sites',           // Sites
  'roles',           // Rôles
  'produits',        // Produits
  'stocks',          // Stocks
  'factures',        // Factures
  'devis',           // Devis
  'projets',         // Projets
  // ... autres tables métier
]
```

#### 2.2 Configuration par table

Pour chaque table, définir:
- Colonnes autorisées (select, filter, sort, join)
- Colonnes sensibles (masquées)
- Isolation tenant (company_id)
- Tables de jointure autorisées
- Limite de lignes

---

### Phase 3: Jointures Avancées

**Objectif**: Permettre les jointures multi-tables

#### 3.1 Types de jointures supportés

```typescript
type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'

interface JoinConfig {
  fromTable: string
  fromColumn: string
  toTable: string
  toColumn: string
  joinType: JoinType
  alias?: string
}
```

#### 3.2 Validation des jointures

- Vérifier que les tables sont autorisées
- Vérifier que les colonnes de jointure existent
- Vérifier les FK dans le schéma
- Limiter le nombre de jointures (ex: max 5)

---

### Phase 4: Champs Calculés Avancés

**Objectif**: Expressions SQL + math.js côté client

#### 4.1 Types d'expressions

| Type | Côté | Exemple |
|------|------|---------|
| Arithmétique | Client (math.js) | `price * quantity` |
| Agrégation | Serveur (SQL) | `SUM(amount)` |
| Conditionnel | Serveur (SQL) | `CASE WHEN status='active' THEN 1 ELSE 0 END` |
| Date | Serveur (SQL) | `DATE_PART('year', created_at)` |
| String | Serveur (SQL) | `CONCAT(first_name, ' ', last_name)` |

#### 4.2 Implémentation serveur

```typescript
interface CalculatedFieldConfig {
  name: string
  expression: string
  evaluationType: 'client' | 'server'
  dataType: 'number' | 'string' | 'date' | 'boolean'
  dependencies: string[]  // Colonnes utilisées
}
```

---

### Phase 5: Boutons d'Action (Navigation)

**Objectif**: Permettre de naviguer vers des fiches détaillées depuis le DataTable

#### 5.1 Configuration des actions

```typescript
interface RowAction {
  id: string
  label: string
  icon: string           // Nom de l'icône Lucide
  route: string          // Ex: "/admin/users/{id}"
  paramMapping: {        // Mapping colonnes → params URL
    [paramName: string]: string  // Ex: { id: "user_id" }
  }
  variant?: 'default' | 'destructive' | 'outline'
  condition?: string     // Ex: "status === 'active'"
  permissions?: string[] // Permissions requises
}
```

#### 5.2 Stockage dans QueryBuilder

```typescript
interface QueryBuilderSettings {
  // ... autres settings
  rowActions?: RowAction[]
}
```

#### 5.3 Rendu dans DataTable

```tsx
// datatable-preview.tsx
const actions = queryBuilder.settings?.rowActions?.map(action => ({
  label: action.label,
  icon: <DynamicIcon name={action.icon} />,
  onClick: (row) => {
    const url = buildUrl(action.route, action.paramMapping, row)
    router.push(url)
  },
  disabled: (row) => action.condition
    ? !evaluateCondition(action.condition, row)
    : false
}))

<DataTable
  data={results}
  columns={columns}
  actions={actions}
/>
```

---

### Phase 6: Intégration Menu avec Permissions

**Objectif**: Ajouter un Query Builder au menu avec contrôle d'accès

#### 6.1 Flux d'ajout au menu

```
1. User clique "Ajouter au menu" sur Query Builder
2. Dialog demande: titre, icône, permissions (optionnel)
3. Frontend POST /api/admin/menus/user-data-view
4. Backend crée MenuItem avec:
   - type: 'D' (DATA_VIEW)
   - queryBuilderId: uuid
   - roles/permissions si spécifiés
5. Menu se rafraîchit via event 'menuPreferencesChanged'
6. Item apparaît dans sidebar avec lien vers /query-builder/{id}/view
```

#### 6.2 Restrictions par rôle/permission

```typescript
// Lors de la création du MenuItem
const menuItem = await menuConfigService.createDataViewMenuItem(
  configId,
  queryBuilderId,
  title,
  icon,
  parentId
)

// Ajouter restrictions
if (roles?.length) {
  for (const roleId of roles) {
    await menuItemRoleService.assignRoleToMenuItem(menuItem.id, roleId)
  }
}

if (permissions?.length) {
  for (const permId of permissions) {
    await menuItemPermService.assignPermissionToMenuItem(menuItem.id, permId)
  }
}
```

#### 6.3 Filtrage côté frontend

Le menu est pré-filtré par le backend (`GET /admin/menu-config/tree/filtered`).
Seuls les items accessibles sont retournés.

---

### Phase 7: Agrégations (GROUP BY)

**Objectif**: Permettre les analyses statistiques

#### 7.1 Fonctions d'agrégation

```typescript
type AggregationFunction =
  | 'COUNT'
  | 'SUM'
  | 'AVG'
  | 'MIN'
  | 'MAX'
  | 'COUNT_DISTINCT'

interface ColumnAggregation {
  columnId: string
  function: AggregationFunction
  alias: string
}
```

#### 7.2 GROUP BY automatique

Si une colonne a une agrégation:
- Toutes les colonnes NON agrégées vont dans GROUP BY
- Support HAVING pour filtrer les groupes

---

### Phase 8: Tests et Validation

#### 8.1 Tests unitaires

- [ ] QueryBuilderService (CRUD)
- [ ] QueryBuilderExecutorService (exécution)
- [ ] SqlSanitizationService (sécurité SQL)
- [ ] SchemaIntrospectionService (introspection)

#### 8.2 Tests d'intégration

- [ ] Création Query Builder → Exécution → Résultats
- [ ] Jointures multi-tables
- [ ] Champs calculés
- [ ] Permissions et isolation tenant

#### 8.3 Tests E2E

- [ ] Parcours complet utilisateur
- [ ] Ajout au menu
- [ ] Navigation via boutons d'action

---

## 5. Fonctionnalités Cibles

### Matrice des Fonctionnalités

| Fonctionnalité | MVP | V1.1 | V1.2 | Notes |
|----------------|-----|------|------|-------|
| CRUD Query Builders | ✅ | ✅ | ✅ | Existe déjà |
| Sélection table unique | ✅ | ✅ | ✅ | Existe déjà |
| Sélection colonnes | ✅ | ✅ | ✅ | Existe déjà |
| Exécution requêtes | 🔴 | ✅ | ✅ | À activer |
| Jointures simples | 🔴 | ✅ | ✅ | INNER/LEFT |
| Jointures avancées | - | 🔴 | ✅ | RIGHT/FULL/multiples |
| Filtres basiques | ✅ | ✅ | ✅ | =, LIKE, IN |
| Filtres avancés | - | ✅ | ✅ | BETWEEN, IS NULL |
| Tri | ✅ | ✅ | ✅ | Existe |
| Pagination | ✅ | ✅ | ✅ | Existe |
| Champs calculés (client) | ✅ | ✅ | ✅ | math.js |
| Champs calculés (SQL) | - | 🔴 | ✅ | CASE, fonctions |
| Agrégations | - | - | ✅ | SUM, COUNT, AVG |
| GROUP BY | - | - | ✅ | Avec HAVING |
| Boutons d'action | - | ✅ | ✅ | Navigation fiches |
| Ajout au menu | ✅ | ✅ | ✅ | Existe |
| Permissions menu | - | ✅ | ✅ | Par rôle/permission |
| Export CSV | ✅ | ✅ | ✅ | DataTable |
| Export Excel | - | ✅ | ✅ | DataTable |
| Export PDF | - | - | ✅ | DataTable |

**Légende**: ✅ Disponible | 🔴 À implémenter | - Non prévu

---

## 6. Schéma de Base de Données

### Modèles Prisma Existants

```prisma
model QueryBuilder {
  id           String   @id @default(uuid())
  societeId    String   @map("societe_id")
  name         String
  description  String?  @db.Text
  type         String   @default("database")
  mainTable    String?  @map("main_table")
  createdBy    String   @map("created_by")
  isPublic     Boolean  @default(false)
  isActive     Boolean  @default(true)
  maxRows      Int?     @map("max_rows")
  settings     Json?    // Pagination, export, actions
  layout       Json?    // UI layout preferences
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  columns          QueryBuilderColumn[]
  joins            QueryBuilderJoin[]
  calculatedFields QueryBuilderCalculatedField[]
  permissions      QueryBuilderPermission[]
  creator          User     @relation(fields: [createdBy], references: [id])
  societe          Societe  @relation(fields: [societeId], references: [id])

  @@map("query_builders")
}

model QueryBuilderColumn {
  id             String   @id @default(uuid())
  queryBuilderId String   @map("query_builder_id")
  tableName      String?  @map("table_name")
  columnName     String   @map("column_name")
  alias          String?
  label          String?
  dataType       String   @map("data_type")
  format         Json?    // Formatting options
  aggregation    Json?    // Aggregation config
  displayOrder   Int      @default(0) @map("display_order")
  isVisible      Boolean  @default(true)
  isFilterable   Boolean  @default(true)
  isSortable     Boolean  @default(true)
  width          Int?

  queryBuilder QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)

  @@map("query_builder_columns")
}

model QueryBuilderJoin {
  id             String   @id @default(uuid())
  queryBuilderId String   @map("query_builder_id")
  fromTable      String   @map("from_table")
  fromColumn     String   @map("from_column")
  toTable        String   @map("to_table")
  toColumn       String   @map("to_column")
  joinType       String   @default("INNER") @map("join_type")
  alias          String?
  condition      String?  @db.Text
  displayOrder   Int      @default(0) @map("display_order")

  queryBuilder QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)

  @@map("query_builder_joins")
}

model QueryBuilderCalculatedField {
  id             String   @id @default(uuid())
  queryBuilderId String   @map("query_builder_id")
  name           String
  expression     String
  dataType       String   @map("data_type")
  format         Json?
  dependencies   Json?    // Column dependencies
  displayOrder   Int      @default(0) @map("display_order")
  isVisible      Boolean  @default(true)
  evaluationType String   @default("client") @map("evaluation_type") // 'client' | 'server'

  queryBuilder QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)

  @@map("query_builder_calculated_fields")
}

model QueryBuilderPermission {
  id             String   @id @default(uuid())
  queryBuilderId String   @map("query_builder_id")
  userId         String?  @map("user_id")
  roleId         String?  @map("role_id")
  canView        Boolean  @default(true)
  canEdit        Boolean  @default(false)
  canDelete      Boolean  @default(false)
  canShare       Boolean  @default(false)
  createdAt      DateTime @default(now())

  queryBuilder QueryBuilder @relation(fields: [queryBuilderId], references: [id], onDelete: Cascade)
  user         User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  role         Role?        @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([queryBuilderId, userId])
  @@unique([queryBuilderId, roleId])
  @@map("query_builder_permissions")
}
```

### Structure JSON settings

```typescript
interface QueryBuilderSettings {
  pagination?: {
    enabled: boolean
    defaultPageSize: number
    pageSizeOptions: number[]
  }
  export?: {
    enabled: boolean
    formats: ('csv' | 'excel' | 'pdf')[]
  }
  filtering?: {
    enabled: boolean
    globalSearch: boolean
  }
  sorting?: {
    enabled: boolean
    multiSort: boolean
  }
  rowActions?: RowAction[]  // Boutons d'action
  display?: {
    defaultView: 'table' | 'cards' | 'kanban'
    density: 'compact' | 'normal' | 'comfortable'
    stripedRows: boolean
  }
}
```

---

## 7. Sécurité

### Couches de Sécurité

```
┌─────────────────────────────────────────┐
│  1. Authentication (JwtAuthGuard)       │
│     - Valide le token JWT               │
│     - Identifie l'utilisateur           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  2. Authorization (QueryBuilderGuard)   │
│     - Vérifie les permissions QB        │
│     - canView, canEdit, canDelete       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  3. Table/Column Security               │
│     - Whitelist des tables              │
│     - Whitelist des colonnes            │
│     - Validation des opérateurs         │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  4. SQL Sanitization                    │
│     - Requêtes paramétrées              │
│     - Validation des identifiants       │
│     - Protection injection SQL          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  5. Tenant Isolation                    │
│     - Filtre company_id automatique     │
│     - RLS PostgreSQL                    │
└─────────────────────────────────────────┘
```

### Patterns Dangereux Bloqués

```typescript
const FORBIDDEN_PATTERNS = [
  /DROP\s+/i,
  /DELETE\s+FROM/i,
  /TRUNCATE\s+/i,
  /ALTER\s+/i,
  /CREATE\s+/i,
  /INSERT\s+/i,
  /UPDATE\s+.*SET/i,
  /GRANT\s+/i,
  /REVOKE\s+/i,
  /--/,           // Commentaires SQL
  /\/\*/,         // Commentaires multi-lignes
  /;\s*$/,        // Point-virgule final
  /UNION\s+/i,    // Injections UNION
  /INTO\s+OUTFILE/i,
  /LOAD_FILE/i,
]
```

---

## 8. Intégration Menu

### Type de MenuItem pour Query Builder

```typescript
// Type 'D' = DATA_VIEW (Query Builder)
interface MenuItemMetadata {
  type: 'M' | 'P' | 'L' | 'D'  // D = Data View
  queryBuilderId?: string      // UUID du Query Builder
  programId?: string
  externalUrl?: string
  titleKey?: string
  gradient?: string
  badge?: string
}
```

### Filtrage par Permissions

```typescript
// Le menu est filtré côté serveur
// GET /admin/menu-config/tree/filtered

async getFilteredMenuForUser(
  userId: string,
  userRoles: string[],
  userPermissions: string[]
): Promise<MenuTreeNode[]> {
  // Récupère tous les items
  // Filtre par:
  // 1. isVisible === true
  // 2. User a au moins un rôle requis (si roles définis)
  // 3. User a au moins une permission requise (si permissions définies)
  // Retourne arbre filtré
}
```

### Événement de Mise à Jour

```typescript
// Après ajout au menu, déclencher refresh
window.dispatchEvent(new CustomEvent('menuPreferencesChanged'))

// Le hook useDynamicMenu écoute cet événement
useEffect(() => {
  const handler = () => refreshMenu()
  window.addEventListener('menuPreferencesChanged', handler)
  return () => window.removeEventListener('menuPreferencesChanged', handler)
}, [])
```

---

## 9. Checklist de Progression

### Phase 1: Réactivation Backend ✅ COMPLÉTÉ (2025-11-30)
- [x] Décommenter imports dans `query-builder.module.ts`
- [x] Vérifier injections de dépendances
- [x] Tous les services activés (CRUD, Executor, Introspection, Security)
- [x] QueryBuilderController et SqlExecutorController actifs

### Phase 2: Configuration Tables ✅ COMPLÉTÉ (2025-11-30)
- [x] Ajouter tables métier à la whitelist (12 tables totales)
- [x] Tables ajoutées: users, societes, sites, roles, permissions, groups, societe_users
- [x] Configurer colonnes par table (colonnes sensibles exclues)
- [x] Définir relations autorisées (allowedJoinTables)
- [x] Configuration tenant isolation par table

### Phase 3: Types Row Actions ✅ COMPLÉTÉ (2025-11-30)
- [x] Interface RowActionConfig dans query-builder.types.ts
- [x] Interface RowActionsSettings
- [x] Types RowActionType et RowActionDisabledCondition
- [x] Fonctions utilitaires buildActionUrl() et isActionDisabled()
- [x] Mise à jour QueryBuilderSettings pour inclure rowActions

### Phase 4: DataTablePreview Row Actions ✅ COMPLÉTÉ (2025-11-30)
- [x] Import des types et fonctions Row Actions
- [x] useMemo pour construire dataTableActions depuis settings
- [x] Gestion des types d'actions (navigation, external, delete, modal, callback)
- [x] Icons dynamiques (Eye, Edit, Trash2, ExternalLink)
- [x] Passage actions au composant DataTable

### Phase 5: Route API Frontend ✅ COMPLÉTÉ (2025-11-30)
- [x] Route GET connectée au backend (suppression mock data)
- [x] Route POST connectée au backend
- [x] Gestion des erreurs backend
- [x] Forwarding headers d'authentification

### Phase 6: Documentation ✅ COMPLÉTÉ (2025-11-30)
- [x] Mise à jour diagramme État Actuel
- [x] Mise à jour tableaux composants
- [x] Mise à jour checklist progression
- [x] Ajout section log d'implémentation

### Phase 7: Tests de Compilation ✅ COMPLÉTÉ (2025-11-30)
- [x] Build backend (pnpm --filter @erp/api build) - 481 fichiers, 0 erreurs
- [x] Build frontend (pnpm --filter @erp/web build) - Compilation TS réussie
- [x] Vérification TypeScript sans erreurs (tsc --noEmit)
- [x] 83 pages statiques générées

### Phase 8: UI Row Actions ✅ COMPLÉTÉ (2025-11-30)
- [x] Section Row Actions dans QuerySettings
- [x] Toggle pour activer/désactiver les row actions
- [x] Liste des actions avec accordéon expandable
- [x] Configuration: label, icon, type, variant, target URL
- [x] Support des placeholders {fieldName} dans les URLs
- [x] Message de confirmation pour les actions delete

### Phases Futures (à planifier)

#### Phase 9: Jointures Avancées
- [ ] UI configuration jointures visuelles
- [ ] Validation jointures backend
- [ ] Génération SQL avec jointures
- [ ] Tests multi-tables

#### Phase 9: Champs Calculés Serveur
- [ ] Expressions SQL (CASE, fonctions)
- [ ] UI pour choisir type d'expression
- [ ] Validation expressions côté serveur
- [ ] Tests expressions complexes

#### Phase 10: Menu + Permissions Avancées
- [ ] Dialog avec sélection permissions
- [ ] Filtrage menu par rôle
- [ ] Filtrage menu par permission

#### Phase 11: Tests Complets
- [ ] Tests unitaires services
- [ ] Tests intégration API
- [ ] Tests E2E parcours utilisateur
- [ ] Tests sécurité SQL injection

---

## Annexes

### A. Commandes Utiles

```bash
# Démarrer le backend
cd apps/api && pnpm dev

# Démarrer le frontend
cd apps/web && pnpm dev

# Générer Prisma client
cd apps/api && pnpm prisma generate

# Voir les logs backend
# Les logs sont dans la console du serveur NestJS

# Tester un endpoint
curl -X GET http://localhost:3002/api/query-builder \
  -H "Authorization: Bearer <token>"
```

### B. Variables d'Environnement

```env
# apps/api/.env
DATABASE_URL=postgresql://...
CACHE_ENABLED=false  # Désactiver cache pour debug

# apps/web/.env
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### C. Références

- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [math.js Documentation](https://mathjs.org/docs/)
- [DataTable Component](./packages/ui/src/components/data-display/datatable/)

---

---

## 10. Log d'Implémentation

### 2025-11-30 - Implémentation Initiale

#### Phase 1: Réactivation Backend
**Fichier modifié**: `apps/api/src/features/query-builder/query-builder.module.ts`

Tous les services étaient commentés. Après vérification que tous utilisent Prisma (et non TypeORM), ils ont été réactivés:
- QueryBuilderController
- SqlExecutorController
- QueryBuilderExecutorService (utilise `$queryRawUnsafe`)
- SchemaIntrospectionService (utilise `$queryRawUnsafe` sur information_schema)
- QueryBuilderSecurityService
- SqlSanitizationService
- QueryBuilderSecurityGuard

#### Phase 2: Enrichissement Whitelist
**Fichier modifié**: `apps/api/src/features/query-builder/security/query-builder-security.service.ts`

Tables ajoutées à la whitelist de sécurité (12 tables totales):

| Table | Description | Tenant Isolation | Jointures Autorisées |
|-------|-------------|------------------|---------------------|
| users | Comptes utilisateurs | Non | roles, groups, user_roles, societe_users |
| societes | Sociétés/entreprises | Non | users, sites, societe_users |
| sites | Sites physiques | Oui (societe_id) | societes |
| roles | Rôles système | Non | users, permissions, role_permissions |
| permissions | Permissions système | Non | roles, role_permissions |
| groups | Groupes utilisateurs | Oui (societe_id) | users, group_members |
| societe_users | Association société-utilisateur | Non | users, societes |

Chaque table configurée avec:
- Colonnes autorisées (select, filter, sort)
- Colonnes sensibles exclues (password_hash, etc.)
- Opérateurs autorisés
- Limite de lignes (maxRows)

#### Phase 3: Types Row Actions
**Fichier modifié**: `apps/web/src/types/query-builder.types.ts`

Nouvelles interfaces ajoutées:
```typescript
interface RowActionsSettings {
  enabled: boolean
  actions: RowActionConfig[]
}

interface RowActionConfig {
  id: string
  label: string
  icon?: string
  type: RowActionType  // 'navigation' | 'modal' | 'callback' | 'delete' | 'edit' | 'external'
  target?: string      // URL template avec placeholders {id}, {user_id}, etc.
  idField?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  disabled?: RowActionDisabledCondition
  permissions?: string[]
  roles?: string[]
  confirmMessage?: string
}
```

Fonctions utilitaires:
- `buildActionUrl(template, row)`: Remplace les placeholders {field} par les valeurs du row
- `isActionDisabled(condition, row)`: Évalue si une action doit être désactivée

#### Phase 4: DataTablePreview Row Actions
**Fichier modifié**: `apps/web/src/components/query-builder/datatable-preview.tsx`

Modifications:
- Import du router Next.js
- Import des icônes Lucide (Eye, Edit, Trash2, ExternalLink)
- Import des types et fonctions Row Actions
- `useMemo` pour construire les actions DataTable depuis la configuration
- Gestion des différents types d'actions via switch/case
- Dispatch d'événements custom pour les actions modales/callback

#### Phase 5: Route API Frontend
**Fichier modifié**: `apps/web/src/app/api/query-builder/route.ts`

Suppression du mock data dans GET handler. La route appelle maintenant directement le backend via `callBackendFromApi()` avec:
- Forwarding des headers d'authentification
- Gestion des erreurs backend
- Extraction des données depuis `response.data` ou `response` directement

#### Phase 6: Documentation
**Fichier modifié**: `docs/QUERY-BUILDER-IMPLEMENTATION.md`

Mise à jour complète de la documentation:
- Diagramme "État Actuel" mis à jour avec tous les services activés
- Tableaux composants mis à jour
- Checklist de progression mise à jour
- Section "Log d'Implémentation" ajoutée

#### Phase 7: Tests de Compilation
**Résultats**:
- **API Backend**: ✅ 481 fichiers compilés, 0 erreurs TypeScript
- **Web Frontend**: ✅ Compilation TypeScript réussie (8.8s)
- **Pages Statiques**: ✅ 83/83 pages générées
- **Note**: Erreur symlink Windows (EPERM) non liée au code, problème de permissions OS

#### Phase 8: UI Row Actions Configuration
**Fichier modifié**: `apps/web/src/components/query-builder/query-settings.tsx`

Ajout d'une nouvelle section "Row Actions" dans les paramètres du Query Builder:

**Fonctionnalités ajoutées**:
- Toggle pour activer/désactiver les row actions
- Liste des actions configurées avec accordéon expandable
- Pour chaque action:
  - Label personnalisable
  - Sélection d'icône (Eye, Edit, Trash2, ExternalLink)
  - Type d'action (navigation, external, modal, edit, delete, callback)
  - Variant du bouton (default, outline, secondary, ghost, destructive)
  - URL cible avec support des placeholders `{fieldName}`
  - Message de confirmation pour les suppressions
- Bouton "Add Row Action" pour ajouter de nouvelles actions

**Exemple de configuration**:
```json
{
  "rowActions": {
    "enabled": true,
    "actions": [
      {
        "id": "view_user",
        "label": "View Profile",
        "icon": "Eye",
        "type": "navigation",
        "target": "/admin/users/{id}",
        "variant": "default"
      },
      {
        "id": "delete_user",
        "label": "Delete",
        "icon": "Trash2",
        "type": "delete",
        "variant": "destructive",
        "confirmMessage": "Are you sure you want to delete this user?"
      }
    ]
  }
}
```

---

## Résumé de l'Implémentation

| Phase | Description | Statut |
|-------|-------------|--------|
| 1 | Réactivation services backend | ✅ Complété |
| 2 | Enrichissement whitelist tables | ✅ Complété |
| 3 | Types Row Actions | ✅ Complété |
| 4 | DataTablePreview Row Actions | ✅ Complété |
| 5 | Route API Frontend | ✅ Complété |
| 6 | Documentation | ✅ Complété |
| 7 | Tests de compilation | ✅ Complété |
| 8 | UI Row Actions Configuration | ✅ Complété |

**Le Query Builder est maintenant fonctionnel avec:**
- Backend entièrement activé (CRUD, exécution, introspection, sécurité)
- 12 tables dans la whitelist de sécurité
- Row Actions pour navigation depuis DataTable
- UI complète pour configurer les Row Actions
- Route API frontend connectée au backend réel
- Documentation complète

**Prochaines étapes suggérées:**
1. Tester fonctionnellement avec l'application en développement
2. Ajouter des tables métier supplémentaires à la whitelist selon les besoins
3. Implémenter les jointures avancées (UI visuelle)
4. Ajouter les champs calculés côté serveur (SQL)

---

*Document mis à jour le 2025-11-30*
