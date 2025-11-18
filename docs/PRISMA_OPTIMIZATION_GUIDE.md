# Guide d'Optimisation Prisma

**Date**: 2025-01-18
**Version**: 1.0

## Table des Matières

1. [Connection Pooling](#connection-pooling)
2. [Query Optimization](#query-optimization)
3. [Indexation](#indexation)
4. [Caching](#caching)
5. [Monitoring & Metrics](#monitoring--metrics)
6. [Best Practices](#best-practices)

## Connection Pooling

### Configuration Recommandée

Le connection pooling est crucial pour les performances en production. Prisma gère automatiquement un pool de connexions.

#### Variables d'Environnement

Ajoutez ces paramètres à votre URL de connexion PostgreSQL :

```env
# apps/api/.env
DATABASE_URL="postgresql://user:password@localhost:5432/topsteel_auth?schema=public&connection_limit=20&pool_timeout=30"
DATABASE_URL_DIRECT="postgresql://user:password@localhost:5432/topsteel_auth?schema=public"
DATABASE_URL_SHADOW="postgresql://user:password@localhost:5432/topsteel_shadow?schema=public"
```

**Paramètres importants** :
- `connection_limit=20` : Limite de connexions dans le pool (par défaut: CPU * 2 + 1)
- `pool_timeout=30` : Timeout pour obtenir une connexion du pool (en secondes)

#### Calcul du Pool Size Optimal

```
Formule recommandée:
pool_size = (nombre_de_workers * 2) + quelques_connexions_extra

Exemple pour une API avec 4 workers:
pool_size = (4 * 2) + 5 = 13 connexions

Pour production avec 8 CPUs:
pool_size = (8 * 2) + 10 = 26 connexions
```

### Configuration Multi-Tenant

Pour les applications multi-tenant comme TopSteel :

```typescript
// apps/api/src/core/database/prisma/prisma.service.ts
import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    const connectionLimit = process.env.NODE_ENV === 'production' ? 20 : 10

    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL + `?connection_limit=${connectionLimit}`,
        },
      },
    })
  }
}
```

## Query Optimization

### 1. N+1 Query Problem

❌ **Mauvais** : Problème N+1
```typescript
// Récupère les users puis fait une requête par user pour les sessions
const users = await prisma.user.findMany()
for (const user of users) {
  const sessions = await prisma.userSession.findMany({
    where: { userId: user.id }
  })
}
// Total: 1 query + N queries = N+1 queries
```

✅ **Bon** : Utiliser `include` ou `select`
```typescript
const users = await prisma.user.findMany({
  include: {
    sessions: true,
  },
})
// Total: 1 seule query avec JOIN
```

### 2. Select Only What You Need

❌ **Mauvais** : Récupérer tous les champs
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
})
// Retourne tous les champs même si on n'a besoin que du nom
```

✅ **Bon** : Sélectionner uniquement les champs nécessaires
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    email: true,
  },
})
// Réduit la taille de la réponse et le temps de transfert
```

### 3. Pagination Efficace

❌ **Mauvais** : Offset pagination pour grandes tables
```typescript
// Lent pour les grandes offsets (ex: page 1000)
const users = await prisma.user.findMany({
  skip: 10000,
  take: 20,
})
```

✅ **Bon** : Cursor-based pagination
```typescript
const users = await prisma.user.findMany({
  take: 20,
  cursor: {
    id: lastSeenUserId,
  },
  orderBy: {
    id: 'asc',
  },
})
// Beaucoup plus rapide, même pour des millions de records
```

### 4. Batch Operations

❌ **Mauvais** : Boucle avec requêtes individuelles
```typescript
for (const data of usersData) {
  await prisma.user.create({ data })
}
// N queries
```

✅ **Bon** : Utiliser `createMany`
```typescript
await prisma.user.createMany({
  data: usersData,
})
// 1 seule query bulk insert
```

### 5. Transactions

Utilisez les transactions pour garantir l'atomicité :

```typescript
const result = await prisma.$transaction(async (tx) => {
  // Créer l'utilisateur
  const user = await tx.user.create({
    data: {
      email: 'user@example.com',
      username: 'user',
    },
  })

  // Créer les settings
  const settings = await tx.userSettings.create({
    data: {
      userId: user.id,
      theme: 'dark',
    },
  })

  return { user, settings }
})
// Soit tout réussit, soit tout rollback
```

**Interactive Transactions** :
```typescript
await prisma.$transaction(
  async (tx) => {
    // Operations here
  },
  {
    maxWait: 5000, // Maximum wait time in ms
    timeout: 10000, // Transaction timeout in ms
    isolationLevel: 'Serializable', // Isolation level
  },
)
```

## Indexation

### Indices dans schema.prisma

Les indices sont essentiels pour les performances. Ajoutez-les pour :
- Les colonnes fréquemment utilisées dans `WHERE`
- Les colonnes utilisées dans `ORDER BY`
- Les foreign keys
- Les champs `unique`

```prisma
model User {
  id       String   @id @default(uuid())
  email    String   @unique
  username String   @unique
  isActive Boolean  @default(true)
  createdAt DateTime @default(now())

  // Indices pour améliorer les performances
  @@index([email])        // Recherche par email
  @@index([username])     // Recherche par username
  @@index([isActive])     // Filtrer par actif/inactif
  @@index([createdAt])    // Tri par date création
  @@index([email, isActive]) // Index composite
}
```

### Indices Composites

Pour les requêtes complexes :

```prisma
model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  isRevoked Boolean @default(false)

  // Index composite pour la requête :
  // WHERE userId = X AND expiresAt > NOW() AND isRevoked = false
  @@index([userId, expiresAt, isRevoked])
}
```

### Vérification des Indices Manquants

Utilisez `EXPLAIN ANALYZE` en PostgreSQL :

```sql
EXPLAIN ANALYZE
SELECT * FROM users
WHERE email = 'test@example.com' AND is_active = true;
```

Si vous voyez `Seq Scan` au lieu de `Index Scan`, ajoutez un index !

## Caching

### 1. Query Caching avec Redis

```typescript
import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { RedisService } from '@/infrastructure/cache/redis.service'

@Injectable()
export class CachedUserService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findUserById(id: string) {
    // Vérifier le cache
    const cached = await this.redis.get(`user:${id}`)
    if (cached) {
      return JSON.parse(cached)
    }

    // Sinon requête DB
    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    // Stocker dans le cache (expire après 1h)
    await this.redis.set(`user:${id}`, JSON.stringify(user), 3600)

    return user
  }
}
```

### 2. Prisma Accelerate (Cloud Caching)

Pour les applications en production, considérez [Prisma Accelerate](https://www.prisma.io/accelerate) qui offre :
- Global database caching
- Connection pooling à l'échelle
- Query acceleration

## Monitoring & Metrics

### 1. Activer les Metrics Prisma

Dans `schema.prisma` :
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["metrics", "tracing"]
}
```

Dans votre service :
```typescript
import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { Cron, CronExpression } from '@nestjs/schedule'

@Injectable()
export class PrismaMetricsService {
  private readonly logger = new Logger(PrismaMetricsService.name)

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async logMetrics() {
    const metrics = await this.prisma.$metrics.json()

    this.logger.log({
      message: 'Prisma Metrics',
      counters: metrics.counters,
      gauges: metrics.gauges,
      histograms: metrics.histograms,
    })
  }
}
```

### 2. Query Logging

Log les requêtes lentes :

```typescript
constructor() {
  super({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  })

  // @ts-ignore
  this.$on('query', (e) => {
    if (e.duration > 100) { // Log si > 100ms
      this.logger.warn(`Slow query detected:`, {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      })
    }
  })
}
```

### 3. OpenTelemetry Integration

Pour le tracing distribué :

```typescript
import { PrismaClient } from '@prisma/client'
import { trace } from '@opentelemetry/api'

const prisma = new PrismaClient()

// Enable tracing
prisma.$use(async (params, next) => {
  const span = trace.getTracer('prisma').startSpan(`prisma.${params.model}.${params.action}`)

  try {
    const result = await next(params)
    span.setStatus({ code: 0 })
    return result
  } catch (error) {
    span.setStatus({ code: 2, message: error.message })
    throw error
  } finally {
    span.end()
  }
})
```

## Best Practices

### 1. Utiliser `$queryRaw` avec Précaution

❌ Risque d'injection SQL :
```typescript
const email = userInput
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`
)
// DANGEREUX !
```

✅ Utiliser les paramètres :
```typescript
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`
// Prisma échappe automatiquement les paramètres
```

### 2. Soft Deletes

Implémentez les soft deletes de manière cohérente :

```typescript
// Middleware pour filtrer automatiquement les deletedAt
prisma.$use(async (params, next) => {
  if (params.model && params.action === 'findMany') {
    params.args.where = {
      ...params.args.where,
      deletedAt: null,
    }
  }

  return next(params)
})
```

### 3. Error Handling

Gérez les erreurs Prisma de manière appropriée :

```typescript
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

try {
  await prisma.user.create({ data: userData })
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    // P2002: Unique constraint violation
    if (error.code === 'P2002') {
      throw new ConflictException('Email already exists')
    }
    // P2025: Record not found
    if (error.code === 'P2025') {
      throw new NotFoundException('User not found')
    }
  }
  throw error
}
```

### 4. Type Safety

Exploitez le typage Prisma :

```typescript
import { Prisma } from '@prisma/client'

// Types générés automatiquement
type User = Prisma.UserGetPayload<{}>
type UserWithSessions = Prisma.UserGetPayload<{
  include: { sessions: true }
}>

// Input types
type CreateUserInput = Prisma.UserCreateInput
type UpdateUserInput = Prisma.UserUpdateInput
type UserWhereInput = Prisma.UserWhereInput
```

### 5. Connection Lifecycle

Gérez correctement le cycle de vie des connexions :

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect()
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

## Checklist d'Optimisation

Avant de déployer en production :

- ✅ Connection pooling configuré correctement
- ✅ Indices ajoutés sur toutes les colonnes fréquemment filtrées
- ✅ Aucun problème N+1 détecté
- ✅ Pagination cursor-based pour grandes tables
- ✅ Caching Redis pour données fréquemment accédées
- ✅ Monitoring et metrics activés
- ✅ Query logging pour requêtes lentes
- ✅ Transactions utilisées correctement
- ✅ Error handling robuste
- ✅ Tests de charge effectués

## Ressources

- [Prisma Performance Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Connection Pool Sizing](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Query Optimization](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance)
- [Prisma Metrics](https://www.prisma.io/docs/concepts/components/prisma-client/metrics)
- [Prisma Accelerate](https://www.prisma.io/accelerate)

---

**Optimisé pour TopSteel ERP** 🚀
