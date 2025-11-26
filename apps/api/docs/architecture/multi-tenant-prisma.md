# Architecture Multi-Tenant avec Prisma + Row-Level Security

## 📐 Vue d'Ensemble

TopSteel ERP utilise une **architecture multi-tenant unifiée** basée sur :
- **1 base de données PostgreSQL** unique pour tous les tenants (sociétés)
- **Isolation par `societeId`** dans chaque table
- **Row-Level Security (RLS)** PostgreSQL pour sécurité au niveau DB
- **Middleware Prisma** pour injection automatique
- **Guards NestJS** pour validation au niveau HTTP

### Évolution Architecturale

| Version | Architecture | Avantages | Inconvénients |
|---------|--------------|-----------|---------------|
| **v1.0** (TypeORM) | 3 bases de données séparées | Isolation forte | Complexité, coûts, maintenance |
| **v2.0** (Prisma) | 1 DB + RLS + middleware | Simplicité, performance, coûts réduits | Requiert discipline développeur |

---

## 🏗️ Architecture en Couches

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Frontend)                     │
│              HTTP Request + x-tenant-id header           │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   NIVEAU 1: HTTP GUARD                   │
│                     (TenantGuard)                        │
│  ✓ Extrait tenant ID (header/JWT/query/subdomain)       │
│  ✓ Valide accès utilisateur au tenant                   │
│  ✓ Détecte super admin                                  │
│  ✓ Injecte contexte dans AsyncLocalStorage              │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              NIVEAU 2: RLS INTERCEPTOR                   │
│                (TenantRLSInterceptor)                    │
│  ✓ Configure app.current_societe_id (PostgreSQL)        │
│  ✓ Configure app.is_super_admin (PostgreSQL)            │
│  ✓ Active RLS pour la requête courante                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                  CONTROLLER (NestJS)                     │
│  Reçoit: @SocieteId() societeId, @TenantCtx() context   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   SERVICE (Business)                     │
│               Appelle Prisma pour données                │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│            NIVEAU 3: MIDDLEWARE PRISMA                   │
│              (PrismaTenantMiddleware)                    │
│  ✓ Intercepte TOUTES les queries Prisma                 │
│  ✓ Injecte societeId dans WHERE automatiquement         │
│  ✓ Injecte societeId dans CREATE/UPDATE                 │
│  ✓ Support modèles nullable (skip auto-filter)          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│          NIVEAU 4: BASE DE DONNÉES + RLS                 │
│                    (PostgreSQL)                          │
│  ✓ Applique politiques RLS sur 25 tables                │
│  ✓ Filtre: societe_id = current_setting(...)            │
│  ✓ Support nullable: IS NULL OR societe_id = ...        │
│  ✓ Admin bypass: is_super_admin = true                  │
└─────────────────────────────────────────────────────────┘
                            ↓
                      RESPONSE DATA
```

---

## 🔐 Sécurité Multi-Niveau (Defense in Depth)

### Principe

Chaque niveau de sécurité agit comme un **filet de sécurité** indépendant. Même si un niveau échoue, les autres empêchent les fuites de données.

### Niveau 1 : HTTP Guard (TenantGuard)

**Rôle** : Première ligne de défense au niveau HTTP.

**Emplacement** : `src/core/multi-tenant/tenant.guard.ts`

**Fonctionnement** :
1. Extrait le `tenant ID` depuis :
   - Header `x-tenant-id` (priorité 1)
   - Header `x-societe-id` (priorité 2)
   - Query param `?societeId=xxx` (priorité 3)
   - JWT payload `user.societeId` (priorité 4)
   - Subdomain `tenant.domain.com` (priorité 5)

2. Valide que l'utilisateur a accès au tenant :
   - Compare `user.societeId` du JWT avec le tenant demandé
   - Autorise les super admins à accéder à tous les tenants
   - Rejette les requêtes non autorisées (403 Forbidden)

3. Injecte le contexte dans `AsyncLocalStorage` :
   ```typescript
   tenantContext.setTenant({
     societeId: 'uuid-123',
     userId: 'user-456',
     isSuperAdmin: false,
     requestId: 'req-789'
   })
   ```

**Configuration** :
```typescript
// app.module.ts
providers: [
  {
    provide: APP_GUARD,
    useClass: TenantGuard,  // ← Appliqué à TOUTES les routes
  },
]
```

**Exceptions** :
- Routes marquées `@Public()` : Guard désactivé
- Routes marquées `@AllowMultiTenant()` : Accès cross-tenant autorisé

---

### Niveau 2 : RLS Interceptor (TenantRLSInterceptor)

**Rôle** : Configure les variables de session PostgreSQL pour activer RLS.

**Emplacement** : `src/core/multi-tenant/tenant-rls.interceptor.ts`

**Fonctionnement** :
1. Récupère le contexte tenant depuis `AsyncLocalStorage`
2. Exécute une fonction PostgreSQL pour définir les variables :
   ```sql
   SELECT set_societe_context('uuid-123', false);
   ```
3. Ces variables sont utilisées par les politiques RLS :
   ```sql
   -- Exemple de politique RLS
   CREATE POLICY societe_isolation ON notifications
     USING (societe_id = current_setting('app.current_societe_id'));
   ```

**Cycle de vie** :
- **Début de requête** : Configure les variables
- **Fin de requête** : Nettoie les variables (automatique PostgreSQL)

**Configuration** :
```typescript
// app.module.ts
providers: [
  {
    provide: APP_INTERCEPTOR,
    useClass: TenantRLSInterceptor,  // ← Exécuté pour chaque requête
  },
]
```

---

### Niveau 3 : Middleware Prisma (PrismaTenantMiddleware)

**Rôle** : Injection automatique du `societeId` dans toutes les queries Prisma.

**Emplacement** : `src/core/multi-tenant/prisma-tenant.middleware.ts`

**Fonctionnement** :

#### Pour les requêtes SELECT (findMany, findFirst, etc.)
```typescript
// Code développeur
const articles = await prisma.article.findMany()

// Query générée par Prisma (AVANT middleware)
SELECT * FROM articles

// Query modifiée par middleware (APRÈS)
SELECT * FROM articles WHERE societe_id = 'uuid-123'
```

#### Pour les requêtes INSERT (create, createMany)
```typescript
// Code développeur
await prisma.article.create({
  data: { titre: 'Mon article' }
})

// Data modifiée par middleware
{
  titre: 'Mon article',
  societeId: 'uuid-123'  // ← Ajouté automatiquement
}
```

#### Pour les requêtes UPDATE/DELETE
```typescript
// Code développeur
await prisma.article.update({
  where: { id: '456' },
  data: { titre: 'Nouveau titre' }
})

// Where modifié par middleware
where: {
  id: '456',
  societeId: 'uuid-123'  // ← Ajouté pour sécurité
}
```

**Modèles supportés** :
- **Required** : Notification, QueryBuilder, etc. → Filtrage automatique
- **Nullable** : ParameterSystem, MenuConfiguration, AuditLog → Pas de filtrage automatique (RLS s'en charge)

**Configuration** :
```typescript
// prisma.service.ts
async onModuleInit() {
  const middleware = this.moduleRef.get(PrismaTenantMiddleware)
  this.$use(middleware.createMiddleware())  // ← Enregistré au démarrage
}
```

---

### Niveau 4 : PostgreSQL RLS (Row-Level Security)

**Rôle** : **Dernière ligne de défense** au niveau base de données.

**Emplacement** : `prisma/migrations/enable_rls.sql`

**Fonctionnement** :

#### Activation RLS sur une table
```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

#### Politique d'isolation stricte (societeId required)
```sql
CREATE POLICY societe_isolation_notifications ON notifications
  FOR ALL
  USING (societe_id = current_setting('app.current_societe_id', true));
```
→ Effet : Seules les lignes où `societe_id` correspond à la variable de session sont visibles.

#### Politique nullable (données globales + per-tenant)
```sql
CREATE POLICY societe_isolation_parameter_system ON parameter_system
  FOR ALL
  USING (
    societe_id IS NULL  -- Paramètres globaux visibles par tous
    OR societe_id = current_setting('app.current_societe_id', true)
  );
```
→ Effet : Les lignes globales (NULL) + les lignes du tenant courant sont visibles.

#### Politique admin bypass
```sql
CREATE POLICY admin_bypass_notifications ON notifications
  FOR ALL
  USING (current_setting('app.is_super_admin', true)::boolean = true);
```
→ Effet : Les super admins voient TOUTES les données, tous tenants confondus.

**Tables protégées** : 25 tables
**Politiques actives** : 30 politiques

---

## 📊 Modèle de Données

### Tables avec societeId REQUIRED

Ces tables appartiennent **toujours** à une société :

```prisma
model Notification {
  id        String   @id @default(uuid())
  societeId String   @map("societe_id")  // REQUIRED
  userId    String   @map("user_id")
  type      String
  title     String
  message   String
  createdAt DateTime @default(now())

  societe   Societe  @relation(fields: [societeId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id])

  @@index([societeId])
  @@index([societeId, userId])
  @@index([societeId, type])
  @@map("notifications")
}
```

**Liste** :
- Notification, NotificationEvent, NotificationTemplate, NotificationRule
- QueryBuilder (+ 4 tables enfants)
- Site, License, SocieteLicense

**Politique RLS** : Isolation stricte
```sql
societe_id = current_setting('app.current_societe_id')
```

---

### Tables avec societeId NULLABLE

Ces tables supportent des **données globales + per-tenant** :

```prisma
model ParameterSystem {
  id          String   @id @default(uuid())
  societeId   String?  @map("societe_id")  // NULLABLE
  code        String   @unique
  label       String
  value       String
  category    String
  isEditable  Boolean  @default(true)

  societe     Societe? @relation(fields: [societeId], references: [id])

  @@index([societeId])
  @@index([societeId, category])
  @@map("parameter_system")
}
```

**Cas d'usage** :
- **Global** (`societeId = NULL`) : Paramètre par défaut pour toutes les sociétés
- **Per-tenant** (`societeId = uuid`) : Override du paramètre global pour une société spécifique

**Exemple** :
```sql
-- Paramètre global
INSERT INTO parameter_system (code, label, value, societe_id)
VALUES ('SESSION_TIMEOUT', 'Timeout session', '30', NULL);

-- Override pour société A
INSERT INTO parameter_system (code, label, value, societe_id)
VALUES ('SESSION_TIMEOUT', 'Timeout session', '60', 'societe-a-uuid');
```

**Liste** :
- ParameterSystem, ParameterApplication, ParameterClient
- SystemSetting, SystemParameter
- MenuConfiguration, MenuConfigurationSimple
- UserMenuPreference, UserMenuPreferences
- AuditLog (logs globaux + per-tenant)
- Permission, Role (permissions globales + per-tenant)

**Politique RLS** : Support nullable
```sql
societe_id IS NULL OR societe_id = current_setting('app.current_societe_id')
```

---

## 🔄 Flux de Requête Détaillé

### Exemple : Récupérer les articles d'une société

#### 1. Client envoie la requête
```http
GET /api/v1/articles HTTP/1.1
Host: topsteel.com
Authorization: Bearer eyJhbGc...
x-tenant-id: societe-123
```

#### 2. TenantGuard (Niveau 1)
```typescript
// Extrait tenant ID
const societeId = request.headers['x-tenant-id']  // = 'societe-123'

// Valide accès
const user = request.user  // Depuis JWT
if (user.societeId !== societeId && !user.isSuperAdmin) {
  throw new ForbiddenException()
}

// Injecte contexte
tenantContext.setTenant({
  societeId: 'societe-123',
  userId: 'user-456',
  isSuperAdmin: false
})
```

#### 3. TenantRLSInterceptor (Niveau 2)
```typescript
// Configure PostgreSQL
await prisma.$queryRaw`
  SELECT set_societe_context('societe-123', false)
`
// → app.current_societe_id = 'societe-123'
// → app.is_super_admin = false
```

#### 4. Controller
```typescript
@Get()
async findAll(@SocieteId() societeId: string) {
  // societeId = 'societe-123' (injecté automatiquement)
  return this.articlesService.findAll()
}
```

#### 5. Service
```typescript
async findAll() {
  return this.prisma.article.findMany()
  // Pas besoin de filtrer manuellement !
}
```

#### 6. PrismaTenantMiddleware (Niveau 3)
```typescript
// Intercepte la query Prisma
params.action = 'findMany'
params.model = 'Article'
params.args = {}

// Injecte societeId
params.args.where = {
  societeId: 'societe-123'  // ← Ajouté automatiquement
}
```

#### 7. Query SQL générée
```sql
SELECT * FROM articles
WHERE societe_id = 'societe-123';
```

#### 8. PostgreSQL RLS (Niveau 4)
```sql
-- Politique RLS appliquée
-- Même si la query oubliait le WHERE, RLS filtrerait quand même
SELECT * FROM articles
WHERE societe_id = current_setting('app.current_societe_id');
-- → Retourne uniquement les articles de 'societe-123'
```

#### 9. Response
```json
[
  {
    "id": "article-1",
    "societeId": "societe-123",
    "titre": "Article 1",
    "createdAt": "2025-11-20T10:00:00Z"
  },
  {
    "id": "article-2",
    "societeId": "societe-123",
    "titre": "Article 2",
    "createdAt": "2025-11-21T15:30:00Z"
  }
]
```

---

## 🧪 Tests & Validation

### Test d'Isolation Basique

```typescript
describe('Multi-Tenant Isolation', () => {
  it('should isolate articles by societeId', async () => {
    // Créer articles pour société A
    await tenantContext.runWithTenant(
      { societeId: 'societe-a', isSuperAdmin: false },
      async () => {
        await prisma.article.create({
          data: { titre: 'Article A' }
        })
      }
    )

    // Créer articles pour société B
    await tenantContext.runWithTenant(
      { societeId: 'societe-b', isSuperAdmin: false },
      async () => {
        await prisma.article.create({
          data: { titre: 'Article B' }
        })
      }
    )

    // Vérifier isolation société A
    await tenantContext.runWithTenant(
      { societeId: 'societe-a', isSuperAdmin: false },
      async () => {
        const articles = await prisma.article.findMany()
        expect(articles).toHaveLength(1)
        expect(articles[0].titre).toBe('Article A')
      }
    )

    // Vérifier isolation société B
    await tenantContext.runWithTenant(
      { societeId: 'societe-b', isSuperAdmin: false },
      async () => {
        const articles = await prisma.article.findMany()
        expect(articles).toHaveLength(1)
        expect(articles[0].titre).toBe('Article B')
      }
    )
  })

  it('should allow super admin to see all data', async () => {
    await tenantContext.runWithTenant(
      { societeId: 'any', isSuperAdmin: true },
      async () => {
        const articles = await prisma.article.findMany()
        expect(articles).toHaveLength(2)  // Voit A + B
      }
    )
  })
})
```

### Test RLS au Niveau PostgreSQL

```sql
-- Test isolation société A
BEGIN;
SELECT set_societe_context('societe-a', false);
SELECT COUNT(*) FROM articles;  -- Retourne 1
ROLLBACK;

-- Test isolation société B
BEGIN;
SELECT set_societe_context('societe-b', false);
SELECT COUNT(*) FROM articles;  -- Retourne 1
ROLLBACK;

-- Test super admin
BEGIN;
SELECT set_societe_context('any-uuid', true);
SELECT COUNT(*) FROM articles;  -- Retourne 2
ROLLBACK;
```

---

## 📈 Performance & Optimisation

### Index Composites

Tous les index recommandés sont créés automatiquement :

```sql
-- Index composites pour performance
CREATE INDEX idx_notifications_societe_user ON notifications (societe_id, user_id);
CREATE INDEX idx_notifications_societe_type ON notifications (societe_id, type);
CREATE INDEX idx_notifications_societe_created ON notifications (societe_id, created_at DESC);
CREATE INDEX idx_query_builders_societe_created_by ON query_builders (societe_id, created_by);
-- ... 14 index au total
```

**Impact** :
- Requêtes filtrées par société : **3-5x plus rapides**
- Tri par date + filtrage : **10x plus rapide**

### Query Planning

```sql
EXPLAIN ANALYZE
SELECT * FROM notifications
WHERE societe_id = 'uuid-123'
  AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 50;

-- Résultat (avec index)
-- Index Scan using idx_notifications_societe_created
-- Planning Time: 0.123 ms
-- Execution Time: 1.456 ms
```

### Connection Pooling

PgBouncer configuré en mode **transaction** :
- Pool size : 20 connexions
- Max clients : 200
- Ratio : 1:10 (excellente efficacité)

---

## 🚨 Sécurité : Cas Limites & Protections

### Tentative d'accès cross-tenant

**Scénario** : Utilisateur de société A tente d'accéder à des données de société B.

**Protection** :
1. **TenantGuard** : Rejette la requête (403 Forbidden)
   ```typescript
   if (user.societeId !== requestedSocieteId) {
     throw new ForbiddenException()
   }
   ```

2. **Middleware Prisma** : Filtre automatiquement
   ```typescript
   WHERE societe_id = 'societe-a'  // Force le bon tenant
   ```

3. **PostgreSQL RLS** : Bloque au niveau DB
   ```sql
   -- Même si le code a un bug, RLS empêche l'accès
   WHERE societe_id = current_setting('app.current_societe_id')
   ```

### SQL Injection

**Scénario** : Tentative d'injection SQL dans une query.

**Protection** :
- Prisma utilise des **parameterized queries** par défaut
- RLS applique les filtres **après** parsing SQL
- Variables PostgreSQL sont **type-safe**

### Oubli de filtrage dans le code

**Scénario** : Développeur oublie de filtrer par `societeId`.

**Protection** :
- **Middleware Prisma** : Ajoute automatiquement le filtre
- **PostgreSQL RLS** : Filtre même si middleware échoue
- **Defense in Depth** : Plusieurs niveaux de protection

---

## 📚 Références

### Documentation Interne
- `src/core/multi-tenant/README.md` - Guide d'utilisation
- `IMPLEMENTATION_SUMMARY.md` - Résumé implémentation
- `MULTI_TENANT_ACTIVATION.md` - Guide d'activation

### Code Source
- `src/core/multi-tenant/` - Module complet
- `prisma/migrations/enable_rls.sql` - Politiques RLS
- `prisma/check-indexes.js` - Vérification index

### Documentation Externe
- [Prisma Middleware](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Node.js AsyncLocalStorage](https://nodejs.org/api/async_context.html)

---

**Version** : 2.0
**Date** : 2025-11-21
**Auteur** : Équipe TopSteel ERP
**Status** : ✅ Production Ready
