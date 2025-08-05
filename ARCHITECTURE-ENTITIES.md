# Architecture des Entités Partagées

## Vue d'ensemble

Le projet TopSteel utilise maintenant une architecture d'entités partagées pour éviter la duplication entre les APIs et garantir la cohérence des données.

## Structure

```
TopSteel/
├── packages/
│   └── erp-entities/              # 📦 Package d'entités partagées
│       ├── src/
│       │   ├── base/              # Entités de base
│       │   ├── companies/         # Entités sociétés  
│       │   ├── inventory/         # Entités stocks/articles
│       │   └── index.ts           # Exports principaux
│       ├── package.json
│       └── README.md
├── apps/
│   ├── api/                       # 🔧 API ERP principale
│   │   └── src/domains/inventory/entities/
│   │       └── article.entity.ts  # Re-export depuis @erp/entities
│   └── marketplace-api/           # 🛒 API Marketplace
│       └── src/shared/entities/erp/
│           ├── article.entity.ts  # Re-export depuis @erp/entities
│           └── societe.entity.ts  # Re-export depuis @erp/entities
```

## Entités partagées

### 🏗️ Entités de base
- **BaseEntity** : ID, timestamps, soft delete, versioning
- **BaseAuditEntity** : + audit trail (créé/modifié par qui)
- **CommonEntity** : pour données partagées (pas de societeId)
- **TenantEntity** : pour données spécifiques à une société (avec societeId)
- **BusinessEntity** : entité métier avec validation et méthodes communes

### 🏢 Entité Societe
- Gestion des sociétés/tenants
- Configuration marketplace intégrée
- Support multi-tenant avec bases de données dédiées

### 📦 Entité Article
- Gestion complète des articles (matières premières, produits finis, etc.)
- Méthodes métier intégrées (calcul stock, valorisation, etc.)
- Support marketplace avec settings dédiés

## Avantages

### ✅ Cohérence garantie
- Les deux APIs utilisent exactement les mêmes définitions
- Impossibilité de désynchronisation entre les APIs
- Évolution centralisée des schémas

### 🔧 Maintenance simplifiée
- Un seul endroit pour modifier les entités
- Propagation automatique des changements
- Réduction drastique de la duplication de code

### 🚀 Évolutivité
- Ajout facile de nouvelles entités partagées
- Support d'autres APIs futures
- Architecture monorepo optimisée

## Utilisation

### Import direct (recommandé)
```typescript
import { Article, Societe, ArticleType } from '@erp/entities'
```

### Re-export local (compatibilité)
```typescript
// Les APIs re-exportent pour maintenir la compatibilité
import { Article } from '../entities/article.entity'
```

## Commandes utiles

```bash
# Build du package partagé
cd packages/erp-entities && pnpm build

# Vérification TypeScript globale
pnpm type-check

# Test des APIs
cd apps/api && pnpm type-check
cd apps/marketplace-api && pnpm type-check
```

---

*Cette architecture garantit la cohérence des données entre toutes les APIs tout en simplifiant la maintenance.*