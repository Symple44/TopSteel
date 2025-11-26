# Tenant-Aware Cache Module

Module de cache multi-tenant avec isolation automatique par société.

## Fonctionnalités

- ✅ **Isolation automatique**: Chaque tenant a son propre espace de cache
- ✅ **Pattern de clés**: `societe:{societeId}:{resource}:{id}`
- ✅ **Deux implémentations**:
  - **Memory**: Cache en mémoire pour développement/tests
  - **Redis**: Cache distribué pour production
- ✅ **Operations standard**: get, set, invalidate, getOrSet
- ✅ **Invalidation par pattern**: Invalider plusieurs clés à la fois
- ✅ **TTL configurables**: Expiration automatique des clés
- ✅ **Statistiques**: Monitoring du cache par tenant

## Configuration

### Variables d'environnement

```env
# Provider: memory (dev) ou redis (prod)
CACHE_PROVIDER=memory

# Activer/désactiver le cache
CACHE_ENABLED=true

# TTL par défaut (secondes)
CACHE_DEFAULT_TTL=3600

# Configuration Redis (si CACHE_PROVIDER=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=secret
REDIS_DB=0
```

### Import dans AppModule

```typescript
import { CacheModule } from './core/cache/cache.module'

@Module({
  imports: [
    // ... autres modules
    CacheModule, // ✅ Module global
  ],
})
export class AppModule {}
```

## Usage

### Injection du service

```typescript
import { Injectable, Inject } from '@nestjs/common'
import { TenantCacheService } from '@/core/cache'

@Injectable()
export class UserService {
  constructor(
    // Option 1: Injection directe (Memory cache)
    private readonly cache: TenantCacheService,

    // Option 2: Injection avec token (Memory ou Redis selon config)
    @Inject('TENANT_CACHE') private readonly cache: TenantCacheService,
  ) {}
}
```

### Opérations CRUD

#### Get (Récupérer)

```typescript
// Récupérer un utilisateur du cache
const user = await this.cache.get<User>('users', userId)

if (!user) {
  // Cache miss - récupérer de la DB
  const user = await this.prisma.user.findUnique({ where: { id: userId } })
  await this.cache.set('users', userId, user, 3600)
}
```

#### Set (Mettre en cache)

```typescript
// Mettre en cache avec TTL de 1 heure (défaut)
await this.cache.set('users', userId, userData)

// Mettre en cache avec TTL personnalisé (5 minutes)
await this.cache.set('users', userId, userData, 300)

// Mettre en cache sans ID (clé de resource uniquement)
await this.cache.set('settings', undefined, settingsData, 7200)
```

#### Invalidate (Invalider)

```typescript
// Invalider un utilisateur spécifique
await this.cache.invalidate('users', userId)

// Invalider une resource entière
await this.cache.invalidate('settings')
```

#### Get or Set (Pattern courant)

```typescript
// Récupérer du cache OU calculer si absent
const user = await this.cache.getOrSet(
  'users',
  userId,
  async () => {
    // Cette fonction n'est appelée que si cache miss
    return await this.prisma.user.findUnique({
      where: { id: userId },
    })
  },
  3600 // TTL optionnel
)
```

### Invalidation avancée

#### Par pattern

```typescript
// Invalider tous les utilisateurs
await this.cache.invalidatePattern('users:*')

// Invalider toutes les notifications d'un user
await this.cache.invalidatePattern(`notifications:user-${userId}:*`)

// Invalider avec wildcard complexe
await this.cache.invalidatePattern('settings:category-*:enabled')
```

#### Par tenant

```typescript
// Invalider TOUT le cache du tenant actuel
const count = await this.cache.invalidateTenant()
console.log(`${count} clés invalidées`)

// Invalider le cache d'un autre tenant (super admin uniquement)
await this.cache.invalidateTenant('autre-societe-id')
```

### Statistiques et monitoring

```typescript
// Obtenir les stats du cache pour le tenant actuel
const stats = await this.cache.getStats()
console.log(`
  Tenant: ${stats.tenant}
  Total Keys: ${stats.totalKeys}
  Memory Usage: ${stats.memoryUsage} // Redis uniquement
  Available: ${stats.available}
`)

// Stats pour un autre tenant
const stats = await this.cache.getStats('autre-societe-id')
```

## Exemples d'usage

### Exemple 1: Cache de notifications

```typescript
@Injectable()
export class NotificationsService {
  constructor(
    @Inject('TENANT_CACHE') private cache: TenantCacheService,
    private prisma: PrismaService
  ) {}

  async getNotifications(userId: string): Promise<Notification[]> {
    return await this.cache.getOrSet(
      'notifications',
      `user-${userId}`,
      async () => {
        return await this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      },
      300 // Cache 5 minutes
    )
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'read' },
    })

    // Invalider le cache des notifications
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    })

    await this.cache.invalidate('notifications', `user-${notification.userId}`)
  }
}
```

### Exemple 2: Cache de paramètres

```typescript
@Injectable()
export class SettingsService {
  constructor(
    @Inject('TENANT_CACHE') private cache: TenantCacheService,
    private prisma: PrismaService
  ) {}

  async getSettings(): Promise<Settings> {
    return await this.cache.getOrSet(
      'settings',
      undefined, // Pas d'ID - une seule clé par tenant
      async () => {
        return await this.prisma.systemSetting.findMany()
      },
      7200 // Cache 2 heures
    )
  }

  async updateSetting(key: string, value: any): Promise<void> {
    await this.prisma.systemSetting.update({
      where: { key },
      data: { value },
    })

    // Invalider TOUS les settings
    await this.cache.invalidate('settings')
  }
}
```

### Exemple 3: Cache de requêtes complexes

```typescript
@Injectable()
export class DashboardService {
  constructor(
    @Inject('TENANT_CACHE') private cache: TenantCacheService,
    private prisma: PrismaService
  ) {}

  async getDashboardData(userId: string): Promise<DashboardData> {
    return await this.cache.getOrSet(
      'dashboard',
      userId,
      async () => {
        // Requête complexe et coûteuse
        const [orders, revenue, customers] = await Promise.all([
          this.prisma.order.count({ where: { userId } }),
          this.prisma.order.aggregate({
            where: { userId },
            _sum: { total: true },
          }),
          this.prisma.customer.count({ where: { userId } }),
        ])

        return {
          totalOrders: orders,
          totalRevenue: revenue._sum.total || 0,
          totalCustomers: customers,
        }
      },
      600 // Cache 10 minutes
    )
  }

  async invalidateDashboard(userId: string): Promise<void> {
    await this.cache.invalidate('dashboard', userId)
  }
}
```

## Clés de cache

### Structure des clés

```
societe:{societeId}:{resource}:{id}
```

### Exemples

```
societe:abc123:users:user-456
societe:abc123:notifications:user-789
societe:abc123:settings
societe:abc123:dashboard:user-123
societe:xyz789:users:user-456  ← Tenant différent, même userId
```

### Isolation

Chaque tenant a son propre espace de noms dans le cache:

```typescript
// Tenant A
await cache.set('users', 'user-1', { name: 'Alice' })
// Clé: societe:tenant-a:users:user-1

// Tenant B (même userId, données différentes)
await cache.set('users', 'user-1', { name: 'Bob' })
// Clé: societe:tenant-b:users:user-1

// ✅ Aucune collision - isolation complète
```

## Patterns d'invalidation

### Wildcards supportés

- `*`: Match n'importe quoi
- `?`: Match un seul caractère

### Exemples

```typescript
// Tous les utilisateurs
await cache.invalidatePattern('users:*')

// Toutes les notifications d'un user
await cache.invalidatePattern(`notifications:user-${userId}:*`)

// Tous les settings d'une catégorie
await cache.invalidatePattern('settings:category-*')

// Pattern complexe
await cache.invalidatePattern('reports:2024-*:monthly')
```

## Bonnes pratiques

### ✅ DO

1. **Utiliser getOrSet** pour simplifier le code:
   ```typescript
   const data = await cache.getOrSet('resource', id, async () => fetchData())
   ```

2. **Invalider après modification**:
   ```typescript
   await prisma.user.update(...)
   await cache.invalidate('users', userId)
   ```

3. **TTL adapté au cas d'usage**:
   ```typescript
   await cache.set('static-config', undefined, data, 86400) // 24h
   await cache.set('live-prices', undefined, data, 60)       // 1min
   ```

4. **Nommer les resources clairement**:
   ```typescript
   'users' | 'notifications' | 'orders' | 'settings'
   ```

### ❌ DON'T

1. **Ne PAS cacher des données sensibles sans chiffrement**:
   ```typescript
   // ❌ BAD
   await cache.set('passwords', userId, password)
   ```

2. **Ne PAS oublier d'invalider**:
   ```typescript
   // ❌ BAD
   await prisma.user.update(...)
   // Cache obsolète!
   ```

3. **Ne PAS utiliser de clés trop génériques**:
   ```typescript
   // ❌ BAD
   await cache.set('data', undefined, ...)

   // ✅ GOOD
   await cache.set('user-preferences', userId, ...)
   ```

4. **Ne PAS mettre en cache des données trop volumineuses**:
   ```typescript
   // ❌ BAD (>1MB)
   await cache.set('all-orders', undefined, millionsOfOrders)

   // ✅ GOOD (paginer)
   await cache.set('orders', `page-${page}`, ordersPage)
   ```

## Migration Memory → Redis

Pour passer de Memory à Redis:

1. **Installer ioredis**:
   ```bash
   pnpm add ioredis
   pnpm add -D @types/ioredis
   ```

2. **Configurer Redis**:
   ```env
   CACHE_PROVIDER=redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=secret
   ```

3. **Redémarrer l'application**:
   ```bash
   pnpm dev
   ```

Le code de votre application reste **identique** - le module choisit automatiquement le bon provider.

## Tests

### Tester avec Memory Cache

```typescript
describe('UserService', () => {
  let service: UserService
  let cache: TenantCacheService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        TenantCacheService,
        TenantContextService,
      ],
    }).compile()

    service = module.get<UserService>(UserService)
    cache = module.get<TenantCacheService>(TenantCacheService)
  })

  it('should cache user data', async () => {
    // First call - cache miss
    const user1 = await service.getUser('user-123')

    // Second call - cache hit
    const user2 = await service.getUser('user-123')

    expect(user1).toEqual(user2)

    // Verify cache hit
    const cached = await cache.get('users', 'user-123')
    expect(cached).toBeDefined()
  })
})
```

## Monitoring

### Endpoints de monitoring (à créer)

```typescript
@Controller('admin/cache')
export class CacheController {
  constructor(@Inject('TENANT_CACHE') private cache: TenantCacheService) {}

  @Get('stats')
  async getStats(@SocieteId() societeId: string) {
    return await this.cache.getStats(societeId)
  }

  @Delete('invalidate/:resource')
  async invalidateResource(@Param('resource') resource: string) {
    await this.cache.invalidatePattern(`${resource}:*`)
    return { message: `Cache invalidated for resource: ${resource}` }
  }

  @Delete('flush')
  async flushTenant(@SocieteId() societeId: string) {
    const count = await this.cache.invalidateTenant(societeId)
    return { message: `Flushed ${count} keys for tenant ${societeId}` }
  }
}
```

---

**Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: 2025-11-21
