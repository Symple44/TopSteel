# Guide de Migration Prisma pour Développeurs

**Date**: 2025-01-18
**Version**: 1.0
**Audience**: Développeurs backend souhaitant migrer des modules TypeORM vers Prisma

## Table des Matières

1. [Introduction](#introduction)
2. [Prérequis](#prérequis)
3. [Vue d'ensemble de la migration](#vue-densemble)
4. [Guide étape par étape](#guide-étape-par-étape)
5. [Patterns & Bonnes pratiques](#patterns--bonnes-pratiques)
6. [Exemples concrets](#exemples-concrets)
7. [Troubleshooting](#troubleshooting)

## Introduction

Ce guide vous accompagne dans la migration d'un module TypeORM vers Prisma. Il est basé sur l'expérience réussie de la migration des modules Auth, Users, Societes, Notifications, Parameters et Admin.

### Pourquoi Prisma ?

✅ **Type-safety** : Typage complet end-to-end
✅ **Developer Experience** : Autocomplétion excellente, erreurs claires
✅ **Performance** : Requêtes optimisées, connection pooling natif
✅ **Multi-tenant** : Support natif de plusieurs bases de données
✅ **Migrations** : Gestion simple et sûre des schémas

## Prérequis

Avant de commencer une migration :

- ✅ Compréhension du module TypeORM existant
- ✅ Accès aux bases de données (auth + tenant)
- ✅ Connaissance de base de Prisma (https://www.prisma.io/docs)
- ✅ Tests existants pour le module (fortement recommandé)

## Vue d'Ensemble

### Architecture Actuelle

**TypeORM** (modules non-migrés) :
```
src/domains/partners/
├── entities/           # TypeORM entities
├── repositories/       # TypeORM repositories
├── services/          # Business logic
└── partners.module.ts # Module config
```

**Prisma** (modules migrés) :
```
src/domains/auth/
├── entities/          # TypeORM entities (deprecated)
├── prisma/           # Nouveau dossier Prisma
│   ├── auth-prisma.service.ts
│   ├── role-prisma.service.ts
│   ├── session-prisma.service.ts
│   ├── __tests__/    # Tests Prisma
│   ├── auth-prisma.module.ts
│   └── index.ts      # Exports
├── auth.controller.ts # Contrôleur standard
└── auth.module.ts    # Module (imports Prisma)
```

### Étapes de Migration

1. **Schéma Prisma** : Définir le schéma dans `prisma/schema.prisma`
2. **Services Prisma** : Créer les services dans `domains/[nom]/prisma/`
3. **Tests** : Écrire les tests unitaires
4. **Contrôleurs** : Créer les contrôleurs standards (sans `-prisma`)
5. **Module** : Configurer le module Prisma
6. **Intégration** : Ajouter au `ApiControllersModule`
7. **Migration des données** : Si nécessaire
8. **Validation E2E** : Tests d'intégration complets
9. **Nettoyage** : Retirer le code TypeORM

## Guide Étape par Étape

### Étape 1 : Schéma Prisma

Dans `apps/api/prisma/schema.prisma`, ajoutez vos modèles :

```prisma
// Exemple : Migration du module Partners
model Partner {
  id          Int      @id @default(autoincrement())
  code        String   @unique @db.VarChar(50)
  name        String   @db.VarChar(200)
  type        PartnerType
  email       String?  @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")

  // Relations
  contacts    Contact[]
  sites       PartnerSite[]

  @@map("partners")
}

enum PartnerType {
  CLIENT
  SUPPLIER
  BOTH
}

model Contact {
  id         Int      @id @default(autoincrement())
  partnerId  Int      @map("partner_id")
  firstName  String   @map("first_name") @db.VarChar(100)
  lastName   String   @map("last_name") @db.VarChar(100)
  email      String   @db.VarChar(255)

  partner    Partner  @relation(fields: [partnerId], references: [id])

  @@map("contacts")
}
```

**Points clés** :
- ✅ Respecter les noms de tables existants avec `@@map()`
- ✅ Mapper les colonnes snake_case avec `@map()`
- ✅ Utiliser les bons types PostgreSQL avec `@db.VarChar()`, etc.
- ✅ Définir les relations (One-to-Many, Many-to-Many)

Générer le client :
```bash
cd apps/api && pnpm prisma generate
```

### Étape 2 : Services Prisma

Créez `src/domains/partners/prisma/partner-prisma.service.ts` :

```typescript
import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/core/database/prisma/prisma.service'
import type { Partner, Prisma } from '@prisma/client'

@Injectable()
export class PartnerPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trouver tous les partners
   */
  async findAll(where?: Prisma.PartnerWhereInput): Promise<Partner[]> {
    return this.prisma.partner.findMany({
      where: {
        deletedAt: null, // Soft delete
        ...where,
      },
      include: {
        contacts: true,
        sites: true,
      },
      orderBy: { name: 'asc' },
    })
  }

  /**
   * Trouver un partner par ID
   */
  async findById(id: number): Promise<Partner> {
    const partner = await this.prisma.partner.findUnique({
      where: { id },
      include: {
        contacts: true,
        sites: true,
      },
    })

    if (!partner || partner.deletedAt) {
      throw new NotFoundException(`Partner with ID ${id} not found`)
    }

    return partner
  }

  /**
   * Créer un nouveau partner
   */
  async create(data: Prisma.PartnerCreateInput): Promise<Partner> {
    return this.prisma.partner.create({
      data,
      include: {
        contacts: true,
        sites: true,
      },
    })
  }

  /**
   * Mettre à jour un partner
   */
  async update(id: number, data: Prisma.PartnerUpdateInput): Promise<Partner> {
    await this.findById(id) // Vérifier l'existence

    return this.prisma.partner.update({
      where: { id },
      data,
      include: {
        contacts: true,
        sites: true,
      },
    })
  }

  /**
   * Soft delete d'un partner
   */
  async remove(id: number): Promise<Partner> {
    await this.findById(id) // Vérifier l'existence

    return this.prisma.partner.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    })
  }
}
```

**Patterns importants** :
- ✅ Utiliser les types générés `Prisma.PartnerWhereInput`, etc.
- ✅ Inclure les relations avec `include`
- ✅ Gérer le soft delete avec `deletedAt`
- ✅ Lever `NotFoundException` quand approprié
- ✅ Documenter chaque méthode avec JSDoc

### Étape 3 : Tests Unitaires

Créez `src/domains/partners/prisma/__tests__/partner-prisma.service.spec.ts` :

```typescript
import { Test, type TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/core/database/prisma/prisma.service'
import { PartnerPrismaService } from '../partner-prisma.service'
import { mockPrismaService } from '@/__tests__/helpers/prisma-mock-factory'

describe('PartnerPrismaService', () => {
  let service: PartnerPrismaService
  let prisma: ReturnType<typeof mockPrismaService>

  beforeEach(async () => {
    prisma = mockPrismaService()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerPrismaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile()

    service = module.get<PartnerPrismaService>(PartnerPrismaService)
  })

  describe('findAll', () => {
    it('should return all partners', async () => {
      const mockPartners = [
        { id: 1, name: 'Partner A', code: 'PA001', type: 'CLIENT' },
        { id: 2, name: 'Partner B', code: 'PB002', type: 'SUPPLIER' },
      ]

      prisma.partner.findMany.mockResolvedValue(mockPartners)

      const result = await service.findAll()

      expect(result).toEqual(mockPartners)
      expect(prisma.partner.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null },
        include: { contacts: true, sites: true },
        orderBy: { name: 'asc' },
      })
    })
  })

  describe('findById', () => {
    it('should return a partner by id', async () => {
      const mockPartner = { id: 1, name: 'Partner A', deletedAt: null }
      prisma.partner.findUnique.mockResolvedValue(mockPartner)

      const result = await service.findById(1)

      expect(result).toEqual(mockPartner)
    })

    it('should throw NotFoundException if partner not found', async () => {
      prisma.partner.findUnique.mockResolvedValue(null)

      await expect(service.findById(999)).rejects.toThrow(NotFoundException)
    })
  })

  // ... autres tests
})
```

Utilisez le helper `mockPrismaService` de `@/__tests__/helpers/prisma-mock-factory.ts`

### Étape 4 : Contrôleur Standard

Créez `src/domains/partners/partners.controller.ts` :

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { CombinedSecurityGuard } from '@/infrastructure/security/guards/combined-security.guard'
import { Roles } from '@/domains/auth/decorators/roles.decorator'
import { PartnerPrismaService } from './prisma/partner-prisma.service'
import { CreatePartnerDto, UpdatePartnerDto } from './dto'

@ApiTags('partners')
@ApiBearerAuth()
@Controller('partners') // Route standard : /api/partners
@UseGuards(CombinedSecurityGuard)
export class PartnersController {
  constructor(private readonly partnerService: PartnerPrismaService) {}

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'List all partners' })
  async findAll() {
    return this.partnerService.findAll()
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get partner by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partnerService.findById(id)
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new partner' })
  async create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnerService.create(createPartnerDto)
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update partner' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ) {
    return this.partnerService.update(id, updatePartnerDto)
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete partner (soft delete)' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.partnerService.remove(id)
  }
}
```

**Points clés** :
- ✅ Route standard **sans** suffixe `-prisma` : `@Controller('partners')`
- ✅ Guards de sécurité : `CombinedSecurityGuard`
- ✅ Décorateurs Swagger pour documentation API
- ✅ DTOs pour validation

### Étape 5 : Module Prisma

Créez `src/domains/partners/prisma/partners-prisma.module.ts` :

```typescript
import { Module } from '@nestjs/common'
import { PrismaModule } from '@/core/database/prisma/prisma.module'
import { PartnerPrismaService } from './partner-prisma.service'
import { ContactPrismaService } from './contact-prisma.service'
import { PartnerSitePrismaService } from './partner-site-prisma.service'

@Module({
  imports: [PrismaModule],
  providers: [
    PartnerPrismaService,
    ContactPrismaService,
    PartnerSitePrismaService,
  ],
  exports: [
    PartnerPrismaService,
    ContactPrismaService,
    PartnerSitePrismaService,
  ],
})
export class PartnersPrismaModule {}
```

Et fichier d'exports `src/domains/partners/prisma/index.ts` :

```typescript
export { PartnerPrismaService } from './partner-prisma.service'
export { ContactPrismaService } from './contact-prisma.service'
export { PartnerSitePrismaService } from './partner-site-prisma.service'
export { PartnersPrismaModule } from './partners-prisma.module'
```

### Étape 6 : Intégration dans ApiControllersModule

Modifiez `src/domains/api-controllers.module.ts` :

```typescript
import { Module } from '@nestjs/common'
import { AuthModule } from './auth/auth.module'
// ... autres imports ...
import { PartnersPrismaModule } from './partners/prisma/partners-prisma.module'
import { PartnersController } from './partners/partners.controller'

@Module({
  imports: [
    AuthModule,
    // ... autres modules ...
    PartnersPrismaModule, // Nouveau module
  ],
  controllers: [
    // ... autres contrôleurs ...
    PartnersController, // Nouveau contrôleur
  ],
})
export class ApiControllersModule {}
```

### Étape 7 : Migration des Données (si nécessaire)

Si vous devez migrer les données existantes :

```typescript
// scripts/migrate-partners-data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migratePartners() {
  // Migration logic ici
  console.log('Migration completed')
}

migratePartners()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect())
```

### Étape 8 : Validation E2E

Testez vos endpoints :

```bash
# Démarrer le serveur
pnpm dev:api

# Tester les routes
curl http://localhost:3002/api/partners
curl http://localhost:3002/api/partners/1
```

### Étape 9 : Nettoyage

Une fois validé :

1. ✅ Supprimer les anciens contrôleurs TypeORM
2. ✅ Marquer les entités TypeORM comme `@deprecated`
3. ✅ Mettre à jour la documentation
4. ✅ Commit et push

## Patterns & Bonnes Pratiques

### 1. Gestion des Transactions

```typescript
async createPartnerWithContacts(data) {
  return this.prisma.$transaction(async (tx) => {
    const partner = await tx.partner.create({ data: ... })
    const contacts = await tx.contact.createMany({ data: ... })
    return { partner, contacts }
  })
}
```

### 2. Relations Complexes

```typescript
// Charger partenaire avec contacts ET adresses des contacts
const partner = await this.prisma.partner.findUnique({
  where: { id },
  include: {
    contacts: {
      include: {
        addresses: true,
      },
    },
    sites: true,
  },
})
```

### 3. Filtres Réutilisables

```typescript
// Créer des where clauses réutilisables
const activePartnersWhere: Prisma.PartnerWhereInput = {
  deletedAt: null,
  type: { in: ['CLIENT', 'BOTH'] },
}

const partners = await this.prisma.partner.findMany({
  where: activePartnersWhere,
})
```

### 4. Pagination

```typescript
async findAllPaginated(page: number, limit: number) {
  const skip = (page - 1) * limit

  const [partners, total] = await Promise.all([
    this.prisma.partner.findMany({
      skip,
      take: limit,
      where: { deletedAt: null },
    }),
    this.prisma.partner.count({
      where: { deletedAt: null },
    }),
  ])

  return {
    data: partners,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }
}
```

### 5. Multi-Tenant

```typescript
// Utiliser la bonne datasource selon le contexte
constructor(
  private readonly prisma: PrismaService, // auth database
  @Inject('TENANT_PRISMA') private readonly tenantPrisma: PrismaService, // tenant database
) {}
```

## Exemples Concrets

Consultez les modules déjà migrés pour des exemples complets :

1. **Auth** : `src/domains/auth/prisma/`
   - Services: AuthPrismaService, RolePrismaService, SessionPrismaService
   - Contrôleurs: auth.controller.ts, roles.controller.ts, sessions.controller.ts
   - Tests: `__tests__/auth-prisma.service.spec.ts`

2. **Users** : `src/domains/users/prisma/`
   - Service simple avec relations
   - Gestion des settings utilisateur

3. **Societes** : `src/domains/societes/prisma/`
   - Relations complexes (Societes → Sites → Users)
   - Multi-tenant

## Troubleshooting

### Erreur : "Cannot find module '@prisma/client'"

```bash
cd apps/api && pnpm prisma generate
```

### Erreur : "Table does not exist"

Vérifiez que le schéma Prisma correspond exactement aux tables existantes :
- Noms de tables avec `@@map()`
- Noms de colonnes avec `@map()`

### Erreur : Dépendance circulaire

Évitez d'importer des modules qui s'importent mutuellement. Utilisez `forwardRef()` si nécessaire.

### Tests qui échouent

Assurez-vous d'utiliser le mock Prisma :
```typescript
import { mockPrismaService } from '@/__tests__/helpers/prisma-mock-factory'
```

## Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Résumé Migration Phases 1-9](./PRISMA_MIGRATION_COMPLETE_SUMMARY.md)
- [Analyse Post-Migration](./POST_MIGRATION_TYPEORM_ANALYSIS.md)

## Support

Pour toute question sur la migration Prisma, consultez :
1. La documentation existante dans `/docs`
2. Les exemples de code dans les modules migrés
3. L'équipe backend TopSteel

---

**Bon courage avec votre migration !** 🚀
