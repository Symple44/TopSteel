# Cleanup Business Logic - Status Report

**Date**: 2025-11-19
**Branche**: `cleanup/remove-business-logic`
**Objectif**: Retirer toute logique métier de TopSteel (garder infrastructure uniquement)

---

## ✅ Terminé

### 1. Domaines métier supprimés (100+ fichiers)

- ✅ **Partners** (6 entités, controllers, services, DTOs) - 24 fichiers
- ✅ **Materials** (2 entités, controllers, services) - 12 fichiers
- ✅ **Inventory** (1 entité, controllers, services) - 18 fichiers
- ✅ **Pricing** (8 entités feature + 3 entités module) - 24 fichiers

**Total supprimé**: ~100 fichiers

---

### 2. Modules nettoyés

**✅ business.module.ts**:
```typescript
// AVANT
@Module({
  imports: [PartnersModule, InventoryModule, MaterialsModule],
  exports: [PartnersModule, InventoryModule, MaterialsModule],
})

// APRÈS
@Module({
  imports: [],  // Domaines métier retirés
  exports: [],
})
```

**✅ features.module.ts**:
```typescript
// Retiré:
- PricingUnifiedModule (import + exports)

// Gardé (infrastructure):
- AdminModule, MenuModule, ParametersModule
- SocietesModule, SharedModule (multi-tenant)
- QueryBuilderModule, SearchModule
- UIPreferencesModule
```

---

## ⚠️ À Terminer

### Erreurs TypeScript restantes (17 erreurs)

#### 1. multi-tenant-database.config.ts (11 erreurs)

**Fichier**: `src/core/database/config/multi-tenant-database.config.ts`

**Problème**: Imports d'entités métier supprimées

**Lignes à retirer**:
```typescript
// Ligne 17-23: Partners, Materials, Inventory
import { Article } from '../../../domains/inventory/entities/article.entity'
import { Material } from '../../../domains/materials/entities/material.entity'
import { Contact } from '../../../domains/partners/entities/contact.entity'
import { Partner } from '../../../domains/partners/entities/partner.entity'
import { PartnerAddress } from '../../../domains/partners/entities/partner-address.entity'
import { PartnerGroup } from '../../../domains/partners/entities/partner-group.entity'
import { PartnerSite } from '../../../domains/partners/entities/partner-site.entity'

// Ligne 44: Pricing
import * as PricingEntities from '../../../features/pricing/entities'

// Ligne 53-56: Pricing modules
import { BTPIndex } from '../../../modules/pricing/entities/btp-index.entity'
import { CustomerSectorAssignment } from '../../../modules/pricing/entities/customer-sector-assignment.entity'
import { SectorCoefficient } from '../../../modules/pricing/entities/sector-coefficient.entity'
```

**Action**: Retirer ces imports + retirer des arrays d'entités

---

#### 2. database.module.ts (3 erreurs)

**Fichier**: `src/core/database/database.module.ts`

**Problème**: Imports pricing

**Lignes à retirer**:
```typescript
// Ligne 25-28
import { BTPIndex } from '../../modules/pricing/entities/btp-index.entity'
import { CustomerSectorAssignment } from '../../modules/pricing/entities/customer-sector-assignment.entity'
import { SectorCoefficient } from '../../modules/pricing/entities/sector-coefficient.entity'
```

**Action**: Retirer ces imports + retirer des arrays d'entités

---

#### 3. auth.module.ts (1 erreur)

**Fichier**: `src/domains/auth/auth.module.ts`

**Problème**: Import controller legacy manquant

**Ligne à retirer**:
```typescript
// Ligne 29
import { SessionsLegacyController } from './legacy/sessions-legacy.controller'
```

**Action**:
- Soit retirer l'import + retirer du module
- Soit créer le fichier legacy manquant

---

#### 4. role-auth.module.ts (1 erreur)

**Fichier**: `src/domains/auth/role-auth.module.ts`

**Problème**: Import controller legacy manquant

**Ligne à retirer**:
```typescript
// Ligne 16
import { RoleLegacyController } from './legacy/role-legacy.controller'
```

**Action**:
- Soit retirer l'import + retirer du module
- Soit créer le fichier legacy manquant

---

#### 5. auth-prisma.service.ts (1 erreur)

**Fichier**: `src/domains/auth/prisma/auth-prisma.service.ts`

**Problème**: Propriété `acronyme` n'existe pas dans UserSelect

**Ligne 74**:
```typescript
acronyme: true,  // ❌ Cette propriété n'existe pas
```

**Action**: Retirer cette ligne

---

## 📋 Checklist de Finalisation

- [ ] Nettoyer `multi-tenant-database.config.ts` (retirer 11 imports métier)
- [ ] Nettoyer `database.module.ts` (retirer 3 imports pricing)
- [ ] Nettoyer `auth.module.ts` (retirer SessionsLegacyController)
- [ ] Nettoyer `role-auth.module.ts` (retirer RoleLegacyController)
- [ ] Corriger `auth-prisma.service.ts` (retirer `acronyme`)
- [ ] Vérifier compilation: `npx tsc --noEmit`
- [ ] Tests: `npm test`
- [ ] Commit final

---

## 🚀 Commandes de Finalisation

```bash
# 1. Nettoyer fichiers de config
# Éditer manuellement:
# - src/core/database/config/multi-tenant-database.config.ts
# - src/core/database/database.module.ts
# - src/domains/auth/auth.module.ts
# - src/domains/auth/role-auth.module.ts
# - src/domains/auth/prisma/auth-prisma.service.ts

# 2. Vérifier compilation
cd C:/GitHub/TopSteel/apps/api
npx tsc --noEmit

# 3. Si OK, commit
git add -A
git commit -m "cleanup: Remove business logic domains

- Removed Partners domain (6 entities)
- Removed Materials domain (2 entities)
- Removed Inventory domain (1 entity)
- Removed Pricing feature (8 entities)
- Cleaned business.module.ts (empty)
- Cleaned features.module.ts (removed PricingUnifiedModule)
- Fixed database config references

TopSteel is now infrastructure-only (Auth, Users, Societes, Licensing, etc.)"

# 4. Pousser branche
git push -u origin cleanup/remove-business-logic
```

---

## 📊 Impact

### Avant Cleanup
- **Entités TypeORM totales**: 85
- **Domaines métier**: 4 (Partners, Materials, Inventory, Pricing)
- **Fichiers totaux**: ~600+

### Après Cleanup
- **Entités TypeORM restantes**: ~62 (infrastructure uniquement)
- **Domaines métier**: 0
- **Fichiers supprimés**: ~100
- **Réduction scope migration Prisma**: -27% entités

### Architecture TopSteel

**TopSteel = Socle Infrastructure**:
- ✅ Auth (Users, Roles, Permissions, Sessions, MFA)
- ✅ Multi-tenant (Societes, Sites)
- ✅ Licensing
- ✅ Notifications
- ✅ Administration (Menu, Parameters)
- ✅ Shared (ressources partagées multi-tenant)
- ✅ Query Builder
- ✅ UI Preferences
- ✅ Search

**Logique Métier → Applications dédiées**:
- ❌ Partners → TopCRM (futur)
- ❌ Materials → TopSteel Business (futur)
- ❌ Inventory → TopSteel Business (futur)
- ❌ Pricing → TopSteel Business (futur)

---

## 🎯 Prochaines Étapes

### Court terme (aujourd'hui)

1. ✅ Finaliser cleanup (corriger 17 erreurs TypeScript)
2. ✅ Commit + push branche `cleanup/remove-business-logic`
3. ✅ Tests compilation

### Moyen terme (semaine prochaine)

4. **Migration Prisma infrastructure** (12-14 jours)
   - Auth (finir migration)
   - Users
   - Societes
   - Licensing
   - Notifications
   - Shared
   - Admin/Parameters
   - Query Builder
   - UI Preferences

5. **Retrait TypeORM complet**
   - `npm uninstall typeorm @nestjs/typeorm`
   - Supprimer data-source*.ts
   - 0 entités TypeORM

---

## 📈 Bénéfices

✅ **Architecture clarifiée**: TopSteel = infrastructure pure
✅ **Réduction complexité**: -100 fichiers métier
✅ **Scope migration réduit**: 62 entités au lieu de 85 (-27%)
✅ **Maintenance simplifiée**: Séparation claire infra/métier
✅ **Évolutivité**: Facile d'ajouter TopTime, TopCRM, TopProject

---

**Créé par**: Claude
**Date**: 2025-11-19
**Branche**: `cleanup/remove-business-logic`
**Status**: ⚠️ En cours (17 erreurs TypeScript à corriger)
