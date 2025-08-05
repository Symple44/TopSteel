# @erp/entities

Package d'entités TypeORM partagées pour l'ERP TopSteel.

## Description

Ce package contient toutes les entités TypeORM communes utilisées par les différentes APIs de l'ERP :
- **API principale** (`apps/api`) - API ERP complète
- **API marketplace** (`apps/marketplace-api`) - API marketplace multi-tenant

## Structure

### Entités de base
- `BaseEntity` - Entité de base avec id, dates de création/modification, soft delete
- `BaseAuditEntity` - Entité avec audit trail (créé par, modifié par)
- `CommonEntity` - Entité pour données communes (base partagée)
- `TenantEntity` - Entité pour données spécifiques à une société
- `BusinessEntity` - Entité métier avec validation et méthodes communes

### Entités métier
- `Article` - Gestion des articles (matières premières, produits finis, etc.)
- `Societe` - Gestion des sociétés/tenants avec configuration marketplace

## Utilisation

### Installation
Le package est automatiquement disponible dans le workspace :
```json
{
  "dependencies": {
    "@erp/entities": "workspace:*"
  }
}
```

### Import
```typescript
import { Article, ArticleType, Societe, BusinessEntity } from '@erp/entities'
```

### Re-export dans les APIs
Les APIs re-exportent les entités partagées pour maintenir la compatibilité :

```typescript
// apps/api/src/domains/inventory/entities/article.entity.ts
export {
  Article,
  ArticleType,
  ArticleStatus,
  UniteStock,
  MethodeValorisationStock
} from '@erp/entities'
```

## Architecture multi-tenant

### Hiérarchie des entités
```
BaseEntity
├── BaseAuditEntity
    ├── CommonEntity (pas de societeId)
    │   └── Societe
    ├── TenantEntity (avec societeId)
    │   └── BusinessEntity
    │       └── Article
    └── ShareableEntity (partageable entre sociétés)
```

### Contexte tenant
```typescript
interface ITenantContext {
  societeId: string
  siteId?: string
  userId: string
}
```

## Scripts de build

- `pnpm build` - Compile le package avec tsup
- `pnpm dev` - Mode watch pour développement
- `pnpm type-check` - Vérification TypeScript

## Synchronisation des APIs

Les deux APIs utilisent exactement les mêmes définitions d'entités grâce à ce package partagé, garantissant :
- Cohérence des structures de données
- Maintenance centralisée
- Évolution synchronisée des schémas