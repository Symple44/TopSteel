# Multi-Tenant Module (v2.0)

Architecture unifiée : **Single Database + Row-Level Security (RLS)**

## 📐 Architecture

### Principes

- **1 base de données PostgreSQL** pour tous les tenants
- **Isolation par `societeId`** dans chaque table
- **Row-Level Security (RLS)** PostgreSQL pour sécurité au niveau DB
- **Injection automatique** du `societeId` via middleware Prisma
- **AsyncLocalStorage** pour contexte thread-safe par requête

### Flux d'une requête

```
1. Client → HTTP Request + x-tenant-id header
   ↓
2. TenantGuard
   - Valide le tenant ID
   - Vérifie l'accès utilisateur
   - Injecte contexte dans AsyncLocalStorage
   ↓
3. TenantRLSInterceptor
   - Configure variables PostgreSQL (app.current_societe_id)
   - Active RLS pour la requête
   ↓
4. Controller
   - Reçoit la requête
   - Accède au contexte via decorators
   ↓
5. PrismaTenantMiddleware
   - Intercepte les queries Prisma
   - Injecte societeId automatiquement
   ↓
6. PostgreSQL + RLS
   - Applique les politiques RLS
   - Filtre les données au niveau DB
   ↓
7. Response → Client
```

### Composants

| Composant | Rôle | Responsabilité |
|-----------|------|----------------|
| **TenantContextService** | Gestion du contexte | AsyncLocalStorage pour stocker `societeId`, `userId`, `isSuperAdmin` |
| **TenantGuard** | Validation & Injection | Extrait tenant ID, valide accès, injecte contexte |
| **TenantRLSInterceptor** | Configuration RLS | Définit variables PostgreSQL pour RLS |
| **PrismaTenantMiddleware** | Injection Prisma | Injecte `societeId` dans queries Prisma |

## 🚀 Installation

### 1. Importer le module

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core'
import { MultiTenantModule, TenantGuard, TenantRLSInterceptor } from './core/multi-tenant'

@Module({
  imports: [
    MultiTenantModule,  // ← Importer le module
    // ... autres modules
  ],
  providers: [
    // Guard global pour toutes les routes
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // Interceptor global pour RLS
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantRLSInterceptor,
    },
  ],
})
export class AppModule {}
```

### 2. Intégrer le middleware Prisma

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaTenantMiddleware } from './core/multi-tenant'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor(private readonly tenantMiddleware: PrismaTenantMiddleware) {
    super()
  }

  async onModuleInit() {
    await this.$connect()

    // Enregistrer le middleware tenant
    this.$use(this.tenantMiddleware.createMiddleware())
  }
}
```

## 📝 Usage

### Dans les Controllers

#### 1. Route protégée par tenant (défaut)

```typescript
import { Controller, Get } from '@nestjs/common'
import { SocieteId } from '@/core/multi-tenant'

@Controller('articles')
export class ArticlesController {
  @Get()
  async findAll(@SocieteId() societeId: string) {
    // societeId est automatiquement injecté depuis le contexte
    return this.articlesService.findAll(societeId)
  }
}
```

#### 2. Accéder au contexte complet

```typescript
import { TenantCtx, TenantContext } from '@/core/multi-tenant'

@Get('profile')
async getProfile(@TenantCtx() ctx: TenantContext) {
  const { societeId, userId, isSuperAdmin } = ctx

  if (isSuperAdmin) {
    return this.profileService.getAdminProfile(userId)
  }

  return this.profileService.getUserProfile(societeId, userId)
}
```

#### 3. Route publique (pas de tenant)

```typescript
import { Public } from '@/core/multi-tenant'

@Public()
@Get('health')
async health() {
  return { status: 'ok' }
}
```

#### 4. Route admin multi-tenant

```typescript
import { AllowMultiTenant, IsSuperAdmin } from '@/core/multi-tenant'

@AllowMultiTenant()
@Get('admin/all-societes')
async getAllSocietes(@IsSuperAdmin() isAdmin: boolean) {
  if (!isAdmin) {
    throw new ForbiddenException()
  }

  return this.societesService.findAll()
}
```

### Dans les Services

Le middleware Prisma injecte automatiquement le `societeId`, mais vous pouvez aussi accéder au contexte explicitement :

```typescript
import { Injectable } from '@nestjs/common'
import { TenantContextService } from '@/core/multi-tenant'
import { PrismaService } from '@/prisma'

@Injectable()
export class ArticlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService
  ) {}

  async findAll() {
    // Option 1: Laisser le middleware injecter automatiquement
    return this.prisma.article.findMany()
    // → Prisma middleware ajoute automatiquement: WHERE societeId = current

    // Option 2: Accès explicite au contexte
    const societeId = this.tenantContext.getSocieteId()
    return this.prisma.article.findMany({
      where: { societeId }
    })
  }

  async create(data: CreateArticleDto) {
    // Le middleware injecte automatiquement societeId
    return this.prisma.article.create({
      data
      // societeId sera ajouté automatiquement
    })
  }
}
```

### Background Jobs / Workers

Pour les tâches background sans contexte HTTP :

```typescript
import { Injectable } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { TenantContextService } from '@/core/multi-tenant'

@Injectable()
export class ReportsService {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly prisma: PrismaService
  ) {}

  @Cron('0 0 * * *')  // Tous les jours à minuit
  async generateDailyReports() {
    // Récupérer toutes les sociétés
    const societes = await this.prisma.societe.findMany()

    // Exécuter pour chaque société avec son propre contexte
    for (const societe of societes) {
      await this.tenantContext.runWithTenant(
        {
          societeId: societe.id,
          isSuperAdmin: false,
        },
        async () => {
          // Tout le code ici a accès au contexte tenant
          await this.generateReportForSociete()
        }
      )
    }
  }

  private async generateReportForSociete() {
    // Le contexte tenant est défini, les queries sont filtrées automatiquement
    const articles = await this.prisma.article.findMany()
    // ...
  }
}
```

## 🔒 Sécurité

### Niveaux de sécurité

1. **Application (Guard)** : Validation au niveau HTTP
2. **Application (Middleware Prisma)** : Injection automatique dans les queries
3. **Base de données (RLS)** : Filtrage au niveau PostgreSQL

### Super Admin

Les super admins peuvent :
- Accéder à tous les tenants
- Bypass les filtres RLS PostgreSQL
- Visualiser toutes les données

Détection automatique :
```typescript
user.role === 'SUPER_ADMIN'
// ou
user.isSuperAdmin === true
```

### Modèles avec societeId nullable

Certains modèles ont `societeId` nullable pour supporter des données globales + per-tenant :

- `ParameterSystem`, `ParameterApplication`, `ParameterClient`
- `SystemSetting`, `SystemParameter`
- `MenuConfiguration`, `MenuConfigurationSimple`
- `AuditLog`

Pour ces modèles :
- RLS permet : `societeId IS NULL OR societeId = current`
- Middleware ne filtre PAS automatiquement (car données globales possibles)
- Vous devez gérer la logique métier explicitement

```typescript
// Récupérer paramètres globaux + société
const params = await prisma.parameterSystem.findMany({
  where: {
    OR: [
      { societeId: null },  // Paramètres globaux
      { societeId: ctx.societeId }  // Paramètres de la société
    ]
  }
})
```

## 🔍 Debugging

### Logs

Le module log automatiquement :

```typescript
[TenantGuard] Tenant context set: societeId=abc-123, userId=user-456, isSuperAdmin=false
[TenantRLSInterceptor] Setting RLS session: societeId=abc-123, isSuperAdmin=false
[PrismaTenantMiddleware] Injected societeId in WHERE for Article.findMany
```

### Vérifier le contexte

```typescript
import { TenantContextService } from '@/core/multi-tenant'

constructor(private readonly tenantContext: TenantContextService) {}

getDebugInfo() {
  return this.tenantContext.getDebugInfo()
}

// Retourne:
// {
//   hasTenant: true,
//   context: {
//     societeId: 'abc-123',
//     userId: 'user-456',
//     isSuperAdmin: false,
//     requestStartTime: 1234567890,
//     requestId: 'req-789'
//   },
//   requestDuration: 45  // ms
// }
```

### Vérifier RLS en DB

```sql
-- Vérifier les tables avec RLS activé
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true;

-- Vérifier les politiques RLS
SELECT *
FROM pg_policies
WHERE schemaname = 'public';

-- Tester l'isolation
BEGIN;
SELECT set_societe_context('societe-1'::uuid, false);
SELECT * FROM notifications;  -- Ne retourne que les notifications de societe-1
ROLLBACK;
```

## 📚 Exemples Complets

### API REST typique

```typescript
@Controller('products')
@UseGuards(TenantGuard)  // Optionnel si APP_GUARD global
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@SocieteId() societeId: string) {
    return this.productsService.findAll()
    // Service n'a pas besoin de societeId, middleware l'injecte
  }

  @Post()
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto)
    // societeId injecté automatiquement
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id)
    // Filtré automatiquement par societeId
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id)
    // Ne peut supprimer que si societeId correspond
  }
}
```

### Envoi du tenant ID depuis le client

```typescript
// Option 1: Header HTTP (recommandé)
fetch('/api/v1/products', {
  headers: {
    'Authorization': 'Bearer <jwt>',
    'x-tenant-id': 'societe-uuid-123'
  }
})

// Option 2: Query param (fallback)
fetch('/api/v1/products?societeId=societe-uuid-123')

// Option 3: JWT (automatique si présent)
// Le JWT contient { societeId: 'societe-uuid-123' }
```

## 🧪 Tests

### Tests unitaires

```typescript
import { Test } from '@nestjs/testing'
import { TenantContextService } from '@/core/multi-tenant'
import { ArticlesService } from './articles.service'

describe('ArticlesService', () => {
  let service: ArticlesService
  let tenantContext: TenantContextService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ArticlesService, TenantContextService, PrismaService],
    }).compile()

    service = module.get(ArticlesService)
    tenantContext = module.get(TenantContextService)
  })

  it('should isolate data by tenant', async () => {
    // Configurer le contexte tenant pour le test
    await tenantContext.runWithTenant(
      {
        societeId: 'test-societe-1',
        isSuperAdmin: false,
      },
      async () => {
        const articles = await service.findAll()

        // Vérifier que tous les articles appartiennent au tenant
        articles.forEach(article => {
          expect(article.societeId).toBe('test-societe-1')
        })
      }
    )
  })
})
```

### Tests d'intégration

```typescript
import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'

describe('Multi-Tenant Integration', () => {
  let app: INestApplication

  it('should isolate articles by tenant', async () => {
    // Société 1
    const response1 = await request(app.getHttpServer())
      .get('/articles')
      .set('x-tenant-id', 'societe-1')
      .set('Authorization', 'Bearer <jwt>')
      .expect(200)

    // Société 2
    const response2 = await request(app.getHttpServer())
      .get('/articles')
      .set('x-tenant-id', 'societe-2')
      .set('Authorization', 'Bearer <jwt>')
      .expect(200)

    // Les données doivent être différentes
    expect(response1.body).not.toEqual(response2.body)
  })
})
```

## 🚨 Troubleshooting

### Erreur: "No tenant context found"

**Cause**: Le `TenantGuard` n'est pas appliqué à la route.

**Solution**:
- Vérifier que `APP_GUARD` est configuré globalement
- Ou ajouter `@UseGuards(TenantGuard)` sur le controller/route

### Erreur: "Tenant ID is required"

**Cause**: Aucun tenant ID trouvé dans la requête.

**Solution**:
- Ajouter header `x-tenant-id`
- Ou inclure `societeId` dans le JWT
- Ou marquer la route comme `@Public()`

### Les données d'un autre tenant sont visibles

**Cause**: RLS ou middleware non configuré correctement.

**Solution**:
1. Vérifier que RLS est activé : `node verify-rls.js`
2. Vérifier les logs du middleware
3. Tester manuellement en SQL :
```sql
SELECT set_societe_context('societe-1'::uuid, false);
SELECT * FROM articles;
```

## 📊 Performance

### Recommendations

1. **Index composites** sur `(societeId, ...)`
2. **Connection pooling** avec PgBouncer
3. **Cache Redis** avec préfixes `societe:{id}:*`
4. **Pagination** systématique

### Monitoring

```typescript
// Durée de la requête
const { requestDuration } = tenantContext.getDebugInfo()
console.log(`Request took ${requestDuration}ms`)
```

## 🔄 Migration depuis l'ancienne architecture

Si vous aviez TypeORM avec 3 bases de données séparées :

1. ✅ Consolidez les 3 DB en 1 seule
2. ✅ Ajoutez `societeId` partout (fait)
3. ✅ Activez RLS (fait)
4. ✅ Remplacez `TenantPrismaService.getTenantClient()` par le nouveau système
5. ✅ Supprimez les références à l'ancien `TenantGuard`

## 📖 Références

- [Prisma Middleware Documentation](https://www.prisma.io/docs/concepts/components/prisma-client/middleware)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Node.js AsyncLocalStorage](https://nodejs.org/api/async_context.html)
