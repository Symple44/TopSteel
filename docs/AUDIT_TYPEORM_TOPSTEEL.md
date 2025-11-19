# Audit TypeORM - TopSteel API

**Date**: 2025-11-19
**Auditeur**: Claude
**Objectif**: Identifier tous les domaines encore en TypeORM pour migration Prisma

---

## 📊 Résumé Exécutif

### Situation Actuelle

```
Total entités TypeORM trouvées: 85 fichiers *.entity.ts
Total avec décorateur @Entity: 82 entités
Modules utilisant TypeOrmModule: 20 modules
```

**Status**: TopSteel est en **HYBRIDE TypeORM + Prisma**

- ✅ **Auth domain** : Partiellement migré vers Prisma (Phase 10)
- ⚠️ **Autres domains** : Encore 100% TypeORM
- ⚠️ **Dépendances** : TypeORM encore dans package.json

---

## 🔍 Détail par Domaine

### Domaines (src/domains/)

#### 1. Auth Domain - HYBRIDE ⚠️

**Status**: Migration Prisma partielle (Phase 10 complétée pour auth)

**Entités TypeORM encore présentes** (8 entités):
- `apps\api\src\domains\auth\core\entities\audit-log.entity.ts`
- `apps\api\src\domains\auth\core\entities\group.entity.ts`
- `apps\api\src\domains\auth\core\entities\mfa-session.entity.ts`
- `apps\api\src\domains\auth\core\entities\module.entity.ts`
- `apps\api\src\domains\auth\core\entities\permission.entity.ts`
- `apps\api\src\domains\auth\core\entities\role-permission.entity.ts`
- `apps\api\src\domains\auth\core\entities\role.entity.ts`
- `apps\api\src\domains\auth\core\entities\user-group.entity.ts`
- `apps\api\src\domains\auth\core\entities\user-mfa.entity.ts`
- `apps\api\src\domains\auth\core\entities\user-role.entity.ts`
- `apps\api\src\domains\auth\core\entities\user-session.entity.ts`
- `apps\api\src\domains\auth\core\entities\user-societe-role.entity.ts`
- `apps\api\src\domains\auth\entities\sms-log.entity.ts`

**Services Prisma existants** (créés en Phase 10):
- ✅ `auth-prisma.service.ts` (users)
- ✅ `role-prisma.service.ts` (roles)
- ✅ `session-prisma.service.ts` (sessions)

**Module**: `apps\api\src\domains\auth\auth.module.ts`
- ⚠️ Utilise encore `TypeOrmModule.forFeature([...])`
- ✅ Services Prisma coexistent avec TypeORM

**Priorité**: 🔴 **HAUTE** - Finir la migration auth (retirer entités TypeORM)

**Actions**:
1. Vérifier si les entités TypeORM sont encore utilisées dans les services
2. Migrer les derniers services vers Prisma
3. Retirer TypeOrmModule.forFeature
4. Supprimer les entités TypeORM
5. Tests complets

**Estimation**: 1 jour

---

#### 2. Users Domain - TypeORM 100% ❌

**Entités TypeORM** (2 entités):
- `apps\api\src\domains\users\entities\user.entity.ts`
- `apps\api\src\domains\users\entities\user-settings.entity.ts`

**Module**: `apps\api\src\domains\users\users.module.ts`
- ⚠️ Utilise `TypeOrmModule.forFeature([User, UserSettings])`

**Priorité**: 🔴 **HAUTE** - Users est critique

**Actions**:
1. Créer `user-prisma.service.ts`
2. Créer `user-settings-prisma.service.ts`
3. Migrer UsersController vers Prisma
4. Mettre à jour UsersModule
5. Tests
6. Supprimer entités TypeORM

**Estimation**: 2 jours

---

#### 3. Partners Domain - TypeORM 100% ❌

**Entités TypeORM** (6 entités):
- `apps\api\src\domains\partners\entities\partner.entity.ts`
- `apps\api\src\domains\partners\entities\partner-site.entity.ts`
- `apps\api\src\domains\partners\entities\partner-group.entity.ts`
- `apps\api\src\domains\partners\entities\partner-interaction.entity.ts`
- `apps\api\src\domains\partners\entities\contact.entity.ts`
- `apps\api\src\domains\partners\entities\partner-address.entity.ts`

**Module**: `apps\api\src\domains\partners\partners.module.ts`

**Priorité**: 🟡 **MOYENNE**

**Actions**: Migration complète vers Prisma

**Estimation**: 2 jours

---

#### 4. Materials Domain - TypeORM 100% ❌

**Entités TypeORM** (2 entités):
- `apps\api\src\domains\materials\entities\material.entity.ts`
- `apps\api\src\domains\materials\entities\material-movement.entity.ts`

**Module**: `apps\api\src\domains\materials\materials.module.ts`

**Priorité**: 🟡 **MOYENNE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1 jour

---

#### 5. Licensing Domain - TypeORM 100% ❌

**Entités TypeORM** (4 entités):
- `apps\api\src\domains\licensing\entities\license.entity.ts`
- `apps\api\src\domains\licensing\entities\license-usage.entity.ts`
- `apps\api\src\domains\licensing\entities\license-activation.entity.ts`
- `apps\api\src\domains\licensing\entities\license-feature.entity.ts`

**Module**: `apps\api\src\domains\licensing\licensing.module.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1.5 jours

---

#### 6. Inventory Domain - TypeORM 100% ❌

**Entités TypeORM** (1 entité):
- `apps\api\src\domains\inventory\entities\stock-movement.entity.ts`

**Module**: `apps\api\src\domains\inventory\inventory.module.ts`

**Priorité**: 🟡 **MOYENNE**

**Actions**: Migration complète vers Prisma

**Estimation**: 0.5 jour

---

#### 7. Notifications Domain - TypeORM 100% ❌

**Entités TypeORM** (4 entités):
- `apps\api\src\domains\notifications\entities\notification-rule.entity.ts`
- `apps\api\src\domains\notifications\entities\notification-action.entity.ts`
- `apps\api\src\domains\notifications\entities\notification-condition.entity.ts`
- `apps\api\src\domains\notifications\entities\notification-execution.entity.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1 jour

---

#### 8. Admin Domain - TypeORM 100% ❌

**Entités TypeORM** (3 entités):
- `apps\api\src\domains\admin\entities\menu-configuration.entity.ts`
- `apps\api\src\domains\admin\entities\menu-item.entity.ts`
- `apps\api\src\domains\admin\entities\menu-item-action.entity.ts`
- `apps\api\src\domains\admin\entities\user-menu-preference.entity.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1 jour

---

### Features (src/features/)

#### 9. Societes Feature - TypeORM 100% ❌

**Entités TypeORM** (3 entités):
- `apps\api\src\features\societes\entities\societe.entity.ts`
- `apps\api\src\features\societes\entities\societe-user.entity.ts`
- `apps\api\src\features\societes\entities\societe-license.entity.ts`
- `apps\api\src\features\societes\entities\site.entity.ts`

**Module**: `apps\api\src\features\societes\societes.module.ts`

**Priorité**: 🔴 **HAUTE** - Multi-tenant critique

**Actions**: Migration complète vers Prisma

**Estimation**: 2 jours

---

#### 10. Pricing Feature - TypeORM 100% ❌

**Entités TypeORM** (8 entités):

**Pricing main**:
- `apps\api\src\features\pricing\entities\pricing-log.entity.ts`
- `apps\api\src\features\pricing\entities\sales-history.entity.ts`
- `apps\api\src\features\pricing\entities\webhook-delivery.entity.ts`
- `apps\api\src\features\pricing\entities\webhook-event.entity.ts`
- `apps\api\src\features\pricing\entities\webhook-subscription.entity.ts`

**Pricing module**:
- `apps\api\src\modules\pricing\entities\customer-sector-assignment.entity.ts`
- `apps\api\src\modules\pricing\entities\sector-coefficient.entity.ts`
- `apps\api\src\modules\pricing\entities\btp-index.entity.ts`

**Modules**:
- `apps\api\src\features\pricing\pricing.module.ts`
- `apps\api\src\modules\pricing\pricing.module.ts`

**Priorité**: 🟡 **MOYENNE**

**Actions**: Migration complète vers Prisma

**Estimation**: 2 jours

---

#### 11. Shared Feature - TypeORM 100% ❌

**Entités TypeORM** (5 entités):
- `apps\api\src\features\shared\entities\shared-process.entity.ts`
- `apps\api\src\features\shared\entities\shared-quality-standard.entity.ts`
- `apps\api\src\features\shared\entities\shared-supplier.entity.ts`
- `apps\api\src\features\shared\entities\shared-data-registry.entity.ts`
- `apps\api\src\features\shared\entities\shared-material.entity.ts`

**Module**: `apps\api\src\features\shared\shared.module.ts`

**Priorité**: 🟡 **MOYENNE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1.5 jours

---

#### 12. Notifications Feature - TypeORM 100% ❌

**Entités TypeORM** (7 entités):
- `apps\api\src\features\notifications\entities\notifications.entity.ts`
- `apps\api\src\features\notifications\entities\notification-event.entity.ts`
- `apps\api\src\features\notifications\entities\notification-read.entity.ts`
- `apps\api\src\features\notifications\entities\notification-rule.entity.ts`
- `apps\api\src\features\notifications\entities\notification-rule-execution.entity.ts`
- `apps\api\src\features\notifications\entities\notification-settings.entity.ts`
- `apps\api\src\features\notifications\entities\notification-template.entity.ts`

**Module**: `apps\api\src\features\notifications\notifications.module.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1.5 jours

---

#### 13. Parameters Feature - TypeORM 100% ❌

**Entités TypeORM** (3 entités):
- `apps\api\src\features\parameters\entities\parameter-system.entity.ts`
- `apps\api\src\features\parameters\entities\parameter-application.entity.ts`
- `apps\api\src\features\parameters\entities\parameter-client.entity.ts`

**Module**: `apps\api\src\features\parameters\parameters.module.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1 jour

---

#### 14. Admin Feature - TypeORM 100% ❌

**Entités TypeORM** (7 entités):
- `apps\api\src\features\admin\entities\menu-configuration.entity.ts`
- `apps\api\src\features\admin\entities\menu-configuration-simple.entity.ts`
- `apps\api\src\features\admin\entities\menu-item.entity.ts`
- `apps\api\src\features\admin\entities\menu-item-permission.entity.ts`
- `apps\api\src\features\admin\entities\menu-item-role.entity.ts`
- `apps\api\src\features\admin\entities\user-menu-item-preference.entity.ts`
- `apps\api\src\features\admin\entities\user-menu-preferences.entity.ts`
- `apps\api\src\features\admin\entitites\system-parameter.entity.ts`
- `apps\api\src\features\admin\entitites\system-setting.entity.ts`

**Module**: `apps\api\src\features\admin\admin.module.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1.5 jours

---

#### 15. Menu Feature - TypeORM 100% ❌

**Entités TypeORM** (2 entités):
- `apps\api\src\features\menu\entities\discovered-page.entity.ts`
- `apps\api\src\features\menu\entities\user-menu-preference.entity.ts`

**Module**: `apps\api\src\features\menu\menu.module.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 0.5 jour

---

#### 16. Query Builder Feature - TypeORM 100% ❌

**Entités TypeORM** (5 entités):
- `apps\api\src\features\query-builder\entities\query-builder.entity.ts`
- `apps\api\src\features\query-builder\entities\query-builder-calculated-field.entity.ts`
- `apps\api\src\features\query-builder\entities\query-builder-column.entity.ts`
- `apps\api\src\features\query-builder\entities\query-builder-join.entity.ts`
- `apps\api\src\features\query-builder\entities\query-builder-permission.entity.ts`

**Module**: `apps\api\src\features\query-builder\query-builder.module.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 1 jour

---

#### 17. UI Preferences Feature - TypeORM 100% ❌

**Entités TypeORM** (3 entités):
- `apps\api\src\api\entities\datatable-hierarchical-preferences.entity.ts`
- `apps\api\src\api\entities\datatable-hierarchy-order.entity.ts`
- `apps\api\src\api\entities\ui-preferences-reorderable-list.entity.ts`

**Module**: `apps\api\src\features\ui-preferences\ui-preferences.module.ts`

**Priorité**: 🟢 **BASSE**

**Actions**: Migration complète vers Prisma

**Estimation**: 0.5 jour

---

## 📊 Récapitulatif par Priorité

### 🔴 Priorité HAUTE (Migration immédiate)

| Domain/Feature | Entités | Estimation | Raison |
|----------------|---------|------------|--------|
| **Auth** (finir migration) | 13 entités | 1 jour | Phase 10 partielle, infrastructure critique |
| **Users** | 2 entités | 2 jours | Dépendance auth, utilisation intensive |
| **Societes** | 4 entités | 2 jours | Multi-tenant critique |

**Total HAUTE**: 19 entités, **5 jours**

---

### 🟡 Priorité MOYENNE (Migration semaine 2)

| Domain/Feature | Entités | Estimation |
|----------------|---------|------------|
| **Partners** | 6 entités | 2 jours |
| **Materials** | 2 entités | 1 jour |
| **Inventory** | 1 entité | 0.5 jour |
| **Pricing** | 8 entités | 2 jours |
| **Shared** | 5 entités | 1.5 jours |

**Total MOYENNE**: 22 entités, **7 jours**

---

### 🟢 Priorité BASSE (Migration semaine 3)

| Domain/Feature | Entités | Estimation |
|----------------|---------|------------|
| **Licensing** | 4 entités | 1.5 jours |
| **Notifications (domain)** | 4 entités | 1 jour |
| **Notifications (feature)** | 7 entités | 1.5 jours |
| **Admin (domain)** | 4 entités | 1 jour |
| **Admin (feature)** | 9 entités | 1.5 jours |
| **Parameters** | 3 entités | 1 jour |
| **Menu** | 2 entités | 0.5 jour |
| **Query Builder** | 5 entités | 1 jour |
| **UI Preferences** | 3 entités | 0.5 jour |

**Total BASSE**: 41 entités, **10 jours**

---

## 📅 Planning de Migration Recommandé

### Semaine 1 - Priorité HAUTE (5 jours)

**Jour 1**:
- ✅ Audit TypeORM (ce document)
- 🔨 Auth: Finir migration Prisma (retirer entités TypeORM restantes)

**Jours 2-3**:
- 🔨 Users: Migration complète Prisma

**Jours 4-5**:
- 🔨 Societes: Migration complète Prisma

**Validation semaine 1**:
- [ ] Auth 100% Prisma
- [ ] Users 100% Prisma
- [ ] Societes 100% Prisma
- [ ] Tests passent

---

### Semaine 2 - Priorité MOYENNE (7 jours)

**Jours 6-7**:
- 🔨 Partners: Migration complète

**Jours 8-9**:
- 🔨 Pricing: Migration complète

**Jour 10**:
- 🔨 Materials: Migration complète

**Jour 11**:
- 🔨 Shared: Migration complète

**Jour 12**:
- 🔨 Inventory: Migration complète

**Validation semaine 2**:
- [ ] Tous domaines MOYENNE migrés
- [ ] Tests passent
- [ ] API fonctionne

---

### Semaine 3 - Priorité BASSE (10 jours)

**Jours 13-22**:
- 🔨 Migration domaines BASSE priorité
- 🔨 Tests complets
- 🔨 Documentation

**Validation finale**:
- [ ] 0 entités TypeORM
- [ ] TypeORM retiré de package.json
- [ ] 100% tests passent
- [ ] API production-ready

---

## ✅ Checklist de Migration Globale

### Phase 1 - Préparation
- [x] Audit TypeORM complet (ce document)
- [ ] Backup complet base de données
- [ ] Backup code (branche git)
- [ ] Environnement de test configuré

### Phase 2 - Migration par Domaine
- [ ] Auth domain (finir migration)
- [ ] Users domain
- [ ] Societes feature
- [ ] Partners domain
- [ ] Materials domain
- [ ] Inventory domain
- [ ] Pricing feature
- [ ] Shared feature
- [ ] Licensing domain
- [ ] Notifications (domain + feature)
- [ ] Admin (domain + feature)
- [ ] Parameters feature
- [ ] Menu feature
- [ ] Query Builder feature
- [ ] UI Preferences feature

### Phase 3 - Nettoyage Final
- [ ] Supprimer toutes les entités TypeORM (*.entity.ts)
- [ ] Retirer TypeOrmModule.forFeature de tous les modules
- [ ] Désinstaller TypeORM: `npm uninstall typeorm @nestjs/typeorm`
- [ ] Supprimer data-source*.ts
- [ ] Vérifier 0 imports TypeORM: `grep -r "from 'typeorm'" src/`

### Phase 4 - Validation
- [ ] 0 erreurs TypeScript: `npm run build`
- [ ] 100% tests passent: `npm test`
- [ ] API démarre: `npm run dev`
- [ ] Tests E2E critiques passent
- [ ] Documentation mise à jour

---

## 🚨 Risques Identifiés

### Risque 1: Relations Complexes

**Problème**: Certaines entités ont des relations complexes (self-referential, many-to-many)

**Exemples**:
- Menu items (parent/child)
- User groups
- Role permissions

**Mitigation**:
- Mapper soigneusement les relations dans Prisma schema
- Tests approfondis des relations
- Migration progressive (1 domaine à la fois)

---

### Risque 2: Requêtes Custom TypeORM

**Problème**: QueryBuilder TypeORM utilisé dans certains services

**Exemples**:
- Recherche avancée
- Reporting complexe
- Filtres dynamiques

**Mitigation**:
- Identifier toutes les utilisations de QueryBuilder
- Convertir en Prisma client (ou raw SQL si nécessaire)
- Tests de performance

---

### Risque 3: Transactions

**Problème**: Transactions TypeORM à convertir

**Mitigation**:
- Utiliser `prisma.$transaction()`
- Tester les rollbacks
- Vérifier les contraintes d'intégrité

---

## 💡 Recommandations

### 1. Migration Incrémentale

✅ **Faire**: Migrer 1 domaine à la fois
❌ **Éviter**: Migrer tous les domaines en parallèle

**Raison**: Plus facile à tester, moins risqué, rollback plus simple

---

### 2. Tests Automatisés

✅ **Faire**: Écrire des tests avant de migrer
❌ **Éviter**: Migrer sans tests

**Template**:
```typescript
describe('UserPrismaService', () => {
  it('should create user', async () => {
    // Test création
  });

  it('should find user by email', async () => {
    // Test recherche
  });

  it('should update user', async () => {
    // Test mise à jour
  });
});
```

---

### 3. Pattern de Service Prisma

**Template à réutiliser**:

```typescript
// src/domains/[domain]/prisma/[domain]-prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { [Entity], Prisma } from '@prisma/client';

@Injectable()
export class [Domain]PrismaService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<[Entity] | null> {
    return this.prisma.[entity].findUnique({
      where: { id },
      include: {
        // Relations
      },
    });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.[Entity]WhereInput;
    orderBy?: Prisma.[Entity]OrderByWithRelationInput;
  }): Promise<[Entity][]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.[entity].findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async create(data: Prisma.[Entity]CreateInput): Promise<[Entity]> {
    return this.prisma.[entity].create({ data });
  }

  async update(
    id: string,
    data: Prisma.[Entity]UpdateInput
  ): Promise<[Entity]> {
    return this.prisma.[entity].update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<[Entity]> {
    return this.prisma.[entity].delete({
      where: { id },
    });
  }

  async count(where?: Prisma.[Entity]WhereInput): Promise<number> {
    return this.prisma.[entity].count({ where });
  }
}
```

---

## 📈 Métriques de Progression

| Métrique | Actuel | Objectif |
|----------|--------|----------|
| **Entités TypeORM** | 85 | 0 |
| **Modules TypeORM** | 20 | 0 |
| **Domaines migrés** | 1 (Auth partiel) | 17 |
| **Services Prisma** | 3 (Auth) | ~50+ |
| **Tests couverture** | ~17 tests | 80%+ |

---

## 📚 Documents Associés

- `PHASE_10_COMPLETION_REPORT.md` - Auth domain migration (partielle)
- `PLAN_MIGRATION_TOPTIME_MICROSERVICES_V2.md` - Plan global
- `RESUME_MIGRATION_MICROSERVICES_V2.md` - Résumé exécutif

---

## 🎯 Actions Immédiates

### Pour Démarrer Aujourd'hui

```bash
# 1. Créer branche de migration
cd C:\GitHub\TopSteel
git checkout -b feature/complete-prisma-migration

# 2. Commencer par Auth (finir Phase 10)
cd apps/api/src/domains/auth

# 3. Identifier services encore en TypeORM
grep -r "Repository<" . --include="*.ts"

# 4. Créer services Prisma manquants
# (suivre template ci-dessus)

# 5. Tests
npm test -- auth
```

---

**Créé par**: Claude
**Date**: 2025-11-19
**Prochaine étape**: Migration Auth domain (finir Phase 10)
**Durée estimée totale**: **22 jours** (3 semaines pleines + 1 jour)
