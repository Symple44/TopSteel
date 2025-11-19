# Audit TypeORM - TopSteel Infrastructure (Socle uniquement)

**Date**: 2025-11-19
**Auditeur**: Claude
**Objectif**: Identifier domaines INFRASTRUCTURE à migrer Prisma (exclure logique métier)

---

## 🎯 Principe de Séparation

**TopSteel** = **SOCLE INFRASTRUCTURE** uniquement
- Auth, Users, Roles, Permissions, Sessions
- Multi-tenant (Societes)
- Licensing, Notifications
- Administration (Menu, Parameters, Query Builder)

**Logique Métier** = À déplacer vers applications dédiées (TopTime, etc.)
- Partners, Materials, Inventory, Pricing
- → Branche `cleanup/remove-business-logic`

---

## 📊 Résumé Audit Infrastructure

### Domaines à MIGRER PRISMA (Infrastructure TopSteel)

```
Total entités infrastructure: ~45 entités
Total entités métier (à supprimer): ~23 entités
Total entités à analyser: ~17 entités
```

**Total TypeORM actuel**: 85 entités
**Après cleanup métier**: ~62 entités (à migrer Prisma)

---

## ✅ INFRASTRUCTURE - À Migrer Prisma

### 1. Auth Domain - HYBRIDE ⚠️ (Priorité HAUTE)

**Status**: Migration Prisma partielle (Phase 10)

**Services Prisma existants** ✅ :
- `auth-prisma.service.ts` (users)
- `role-prisma.service.ts` (roles)
- `session-prisma.service.ts` (sessions)
- `groups-prisma.service.ts` (groupes)
- `mfa-prisma.service.ts` (MFA)
- `module-prisma.service.ts` (modules)
- `audit-log-prisma.service.ts` (audit)
- `sms-log-prisma.service.ts` (SMS)
- `tenant-prisma.service.ts` (tenants)
- `user-settings-prisma.service.ts` (settings)

**Entités TypeORM restantes** (13 entités):
- `audit-log.entity.ts`
- `group.entity.ts`
- `mfa-session.entity.ts`
- `module.entity.ts`
- `permission.entity.ts`
- `role-permission.entity.ts`
- `role.entity.ts`
- `user-group.entity.ts`
- `user-mfa.entity.ts`
- `user-role.entity.ts`
- `user-session.entity.ts`
- `user-societe-role.entity.ts`
- `sms-log.entity.ts`

**Actions**:
1. Vérifier si entités TypeORM encore utilisées dans services
2. Retirer TypeOrmModule.forFeature du module
3. Supprimer entités TypeORM
4. Tests complets

**Priorité**: 🔴 **HAUTE**
**Estimation**: 1 jour

---

### 2. Users Domain - TypeORM 100% ❌ (Priorité HAUTE)

**Entités TypeORM** (2 entités):
- `user.entity.ts`
- `user-settings.entity.ts`

**Service Prisma existant** ✅ :
- `user-settings-prisma.service.ts` (déjà créé dans auth/prisma/)

**Actions**:
1. Créer `users-prisma.service.ts`
2. Migrer UsersController vers Prisma
3. Mettre à jour UsersModule
4. Supprimer entités TypeORM

**Priorité**: 🔴 **HAUTE**
**Estimation**: 1.5 jours

---

### 3. Societes Feature - TypeORM 100% ❌ (Priorité HAUTE)

**Entités TypeORM** (4 entités):
- `societe.entity.ts`
- `societe-user.entity.ts`
- `societe-license.entity.ts`
- `site.entity.ts`

**Actions**:
1. Créer `societe-prisma.service.ts`
2. Migrer controllers vers Prisma
3. Mettre à jour module
4. Supprimer entités TypeORM

**Priorité**: 🔴 **HAUTE** - Multi-tenant critique
**Estimation**: 2 jours

---

### 4. Licensing Domain - TypeORM 100% ❌ (Priorité MOYENNE)

**Entités TypeORM** (4 entités):
- `license.entity.ts`
- `license-usage.entity.ts`
- `license-activation.entity.ts`
- `license-feature.entity.ts`

**Actions**:
1. Créer `license-prisma.service.ts`
2. Migrer controllers
3. Supprimer entités TypeORM

**Priorité**: 🟡 **MOYENNE** - Infrastructure licensing
**Estimation**: 1.5 jours

---

### 5. Notifications Domain - TypeORM 100% ❌ (Priorité MOYENNE)

**Entités TypeORM** (4 entités domain):
- `notification-rule.entity.ts`
- `notification-action.entity.ts`
- `notification-condition.entity.ts`
- `notification-execution.entity.ts`

**Entités TypeORM** (7 entités feature):
- `notifications.entity.ts`
- `notification-event.entity.ts`
- `notification-read.entity.ts`
- `notification-rule.entity.ts`
- `notification-rule-execution.entity.ts`
- `notification-settings.entity.ts`
- `notification-template.entity.ts`

**Total**: 11 entités (domain + feature)

**Actions**:
1. Consolider domain + feature
2. Créer `notification-prisma.service.ts`
3. Migrer controllers
4. Supprimer entités TypeORM

**Priorité**: 🟡 **MOYENNE** - Infrastructure notifications
**Estimation**: 2 jours

---

### 6. Parameters Feature - TypeORM 100% ❌ (Priorité BASSE)

**Entités TypeORM** (3 entités):
- `parameter-system.entity.ts`
- `parameter-application.entity.ts`
- `parameter-client.entity.ts`

**Actions**:
1. Créer `parameter-prisma.service.ts`
2. Migrer controllers
3. Supprimer entités TypeORM

**Priorité**: 🟢 **BASSE** - Infrastructure paramètres
**Estimation**: 1 jour

---

### 7. Admin Feature - TypeORM 100% ❌ (Priorité BASSE)

**Entités TypeORM** (9 entités):
- `menu-configuration.entity.ts`
- `menu-configuration-simple.entity.ts`
- `menu-item.entity.ts`
- `menu-item-permission.entity.ts`
- `menu-item-role.entity.ts`
- `user-menu-item-preference.entity.ts`
- `user-menu-preferences.entity.ts`
- `system-parameter.entity.ts`
- `system-setting.entity.ts`

**Admin Domain** (4 entités):
- `menu-configuration.entity.ts`
- `menu-item.entity.ts`
- `menu-item-action.entity.ts`
- `user-menu-preference.entity.ts`

**Total**: 13 entités (domain + feature, avec doublons)

**Actions**:
1. Consolider domain + feature (éliminer doublons)
2. Créer `menu-prisma.service.ts`
3. Créer `system-settings-prisma.service.ts`
4. Migrer controllers
5. Supprimer entités TypeORM

**Priorité**: 🟢 **BASSE** - Infrastructure admin
**Estimation**: 1.5 jours

---

### 8. Menu Feature - TypeORM 100% ❌ (Priorité BASSE)

**Entités TypeORM** (2 entités):
- `discovered-page.entity.ts`
- `user-menu-preference.entity.ts`

**Note**: Consolider avec Admin feature (doublons)

**Priorité**: 🟢 **BASSE**
**Estimation**: Inclus dans Admin (0.5 jour si séparé)

---

### 9. Query Builder Feature - TypeORM 100% ❌ (Priorité BASSE)

**Entités TypeORM** (5 entités):
- `query-builder.entity.ts`
- `query-builder-calculated-field.entity.ts`
- `query-builder-column.entity.ts`
- `query-builder-join.entity.ts`
- `query-builder-permission.entity.ts`

**Actions**:
1. Créer `query-builder-prisma.service.ts`
2. Migrer controllers
3. Supprimer entités TypeORM

**Priorité**: 🟢 **BASSE** - Infrastructure query builder
**Estimation**: 1 jour

---

### 10. UI Preferences Feature - TypeORM 100% ❌ (Priorité BASSE)

**Entités TypeORM** (3 entités):
- `datatable-hierarchical-preferences.entity.ts`
- `datatable-hierarchy-order.entity.ts`
- `ui-preferences-reorderable-list.entity.ts`

**Actions**:
1. Créer `ui-preferences-prisma.service.ts`
2. Migrer controllers
3. Supprimer entités TypeORM

**Priorité**: 🟢 **BASSE** - Infrastructure UI
**Estimation**: 0.5 jour

---

## ❌ MÉTIER - À Supprimer (Branche cleanup/remove-business-logic)

### 1. Partners Domain - TypeORM ❌ SUPPRIMER

**Entités TypeORM** (6 entités):
- `partner.entity.ts`
- `partner-site.entity.ts`
- `partner-group.entity.ts`
- `partner-interaction.entity.ts`
- `contact.entity.ts`
- `partner-address.entity.ts`

**Action**: 🗑️ **SUPPRIMER** - Logique métier
**Branche**: `cleanup/remove-business-logic`

---

### 2. Materials Domain - TypeORM ❌ SUPPRIMER

**Entités TypeORM** (2 entités):
- `material.entity.ts`
- `material-movement.entity.ts`

**Action**: 🗑️ **SUPPRIMER** - Logique métier
**Branche**: `cleanup/remove-business-logic`

---

### 3. Inventory Domain - TypeORM ❌ SUPPRIMER

**Entités TypeORM** (1 entité):
- `stock-movement.entity.ts`

**Action**: 🗑️ **SUPPRIMER** - Logique métier
**Branche**: `cleanup/remove-business-logic`

---

### 4. Pricing Feature - TypeORM ❌ SUPPRIMER

**Entités TypeORM** (8 entités):
- `pricing-log.entity.ts`
- `sales-history.entity.ts`
- `webhook-delivery.entity.ts`
- `webhook-event.entity.ts`
- `webhook-subscription.entity.ts`
- `customer-sector-assignment.entity.ts`
- `sector-coefficient.entity.ts`
- `btp-index.entity.ts`

**Action**: 🗑️ **SUPPRIMER** - Logique métier
**Branche**: `cleanup/remove-business-logic`

---

## 🤔 À ANALYSER - Shared Feature

### Shared Feature - TypeORM ? (À décider)

**Entités TypeORM** (5 entités):
- `shared-process.entity.ts`
- `shared-quality-standard.entity.ts`
- `shared-supplier.entity.ts`
- `shared-data-registry.entity.ts`
- `shared-material.entity.ts`

**Question**:
- Si **infrastructure** (partage entre sociétés) → Migrer Prisma
- Si **métier** → Supprimer

**Action**: ⏸️ **À DÉCIDER avec équipe**

**Si infrastructure**:
- Priorité: 🟡 MOYENNE
- Estimation: 1.5 jours

**Si métier**:
- Action: 🗑️ SUPPRIMER
- Branche: `cleanup/remove-business-logic`

---

## 📊 Récapitulatif Infrastructure (À migrer Prisma)

### 🔴 Priorité HAUTE (4.5 jours)

| Domain/Feature | Entités | Services Prisma existants | Estimation |
|----------------|---------|---------------------------|------------|
| **Auth** | 13 | ✅ 10 services | 1 jour |
| **Users** | 2 | ✅ 1 service | 1.5 jours |
| **Societes** | 4 | ❌ À créer | 2 jours |

**Total HAUTE**: 19 entités, **4.5 jours**

---

### 🟡 Priorité MOYENNE (3.5 jours + Shared?)

| Domain/Feature | Entités | Estimation |
|----------------|---------|------------|
| **Licensing** | 4 | 1.5 jours |
| **Notifications** | 11 | 2 jours |
| **Shared** (si infra) | 5 | 1.5 jours |

**Total MOYENNE**: 15-20 entités, **3.5-5 jours**

---

### 🟢 Priorité BASSE (4.5 jours)

| Feature | Entités | Estimation |
|---------|---------|------------|
| **Parameters** | 3 | 1 jour |
| **Admin** | 13 | 1.5 jours |
| **Menu** | 2 | Inclus Admin |
| **Query Builder** | 5 | 1 jour |
| **UI Preferences** | 3 | 0.5 jour |

**Total BASSE**: 26 entités, **4.5 jours**

---

## 📊 Récapitulatif Métier (À supprimer)

| Domain/Feature | Entités | Action |
|----------------|---------|--------|
| **Partners** | 6 | 🗑️ Supprimer |
| **Materials** | 2 | 🗑️ Supprimer |
| **Inventory** | 1 | 🗑️ Supprimer |
| **Pricing** | 8 | 🗑️ Supprimer |

**Total MÉTIER**: 17 entités → Branche `cleanup/remove-business-logic`

---

## 📅 Planning de Migration (Infrastructure uniquement)

### Semaine 1 - Priorité HAUTE (4.5 jours)

**Jour 1**:
- ✅ Audit infrastructure
- 🔨 Auth: Retirer entités TypeORM restantes

**Jours 2-3**:
- 🔨 Users: Migration Prisma complète

**Jours 4-5**:
- 🔨 Societes: Migration Prisma complète

**Validation**:
- [ ] Auth 100% Prisma
- [ ] Users 100% Prisma
- [ ] Societes 100% Prisma

---

### Semaine 2 - Priorité MOYENNE (3.5-5 jours)

**Jours 6-7**:
- 🔨 Licensing: Migration Prisma

**Jours 8-9**:
- 🔨 Notifications: Migration Prisma

**Jour 10** (si Shared = infrastructure):
- 🔨 Shared: Migration Prisma

**Validation**:
- [ ] Licensing 100% Prisma
- [ ] Notifications 100% Prisma
- [ ] Shared 100% Prisma (si applicable)

---

### Semaine 3 - Priorité BASSE + Cleanup (4.5 jours)

**Jours 11-13**:
- 🔨 Parameters, Admin, Query Builder, UI Preferences

**Jours 14-15**:
- 🗑️ **Branche cleanup/remove-business-logic**
  - Supprimer Partners domain
  - Supprimer Materials domain
  - Supprimer Inventory domain
  - Supprimer Pricing feature

**Validation finale**:
- [ ] Tous domaines infrastructure migrés Prisma
- [ ] Tous domaines métier supprimés
- [ ] TypeORM retiré de package.json
- [ ] Tests passent

---

## 📋 Branche cleanup/remove-business-logic

### Objectif

Retirer toute logique métier de TopSteel pour le transformer en **socle infrastructure pur**.

### Domaines à supprimer

```bash
# Créer branche
git checkout -b cleanup/remove-business-logic

# Supprimer domaines métier
rm -rf apps/api/src/domains/partners
rm -rf apps/api/src/domains/materials
rm -rf apps/api/src/domains/inventory
rm -rf apps/api/src/features/pricing

# Si Shared = métier
rm -rf apps/api/src/features/shared

# Nettoyer imports
# Retirer de business.module.ts
# Retirer de features.module.ts

# Tests
npm run build
npm test

# Commit
git add .
git commit -m "cleanup: Remove business logic domains (Partners, Materials, Inventory, Pricing)"
```

### Modules à nettoyer

**Fichier**: `apps/api/src/domains/business.module.ts`
```typescript
// AVANT
@Module({
  imports: [
    PartnersModule,  // ❌ À retirer
    MaterialsModule, // ❌ À retirer
    InventoryModule, // ❌ À retirer
    // ...
  ],
})

// APRÈS
@Module({
  imports: [
    // Domaines métier retirés
  ],
})
```

**Fichier**: `apps/api/src/features/features.module.ts`
```typescript
// AVANT
@Module({
  imports: [
    PricingModule,  // ❌ À retirer
    SharedModule,   // ❌ À retirer (si métier)
    // ...
  ],
})

// APRÈS
@Module({
  imports: [
    // Features métier retirées
  ],
})
```

### Tests après cleanup

```bash
# Vérifier que l'API démarre
npm run dev

# Vérifier 0 erreurs TypeScript
npm run build

# Vérifier tests
npm test

# Vérifier endpoints infrastructure fonctionnent
curl http://localhost:4000/api/auth/validate-token
curl http://localhost:4000/api/users
curl http://localhost:4000/api/societes
```

---

## ✅ Checklist Migration Infrastructure

### Phase 1 - Préparation
- [x] Audit infrastructure vs métier
- [ ] Backup complet
- [ ] Créer branche feature/complete-prisma-migration
- [ ] Créer branche cleanup/remove-business-logic

### Phase 2 - Migration Infrastructure Prisma
- [ ] Auth (finir migration)
- [ ] Users
- [ ] Societes
- [ ] Licensing
- [ ] Notifications
- [ ] Décider Shared (infra ou métier)
- [ ] Parameters
- [ ] Admin/Menu
- [ ] Query Builder
- [ ] UI Preferences

### Phase 3 - Cleanup Métier
- [ ] Créer branche cleanup/remove-business-logic
- [ ] Supprimer Partners
- [ ] Supprimer Materials
- [ ] Supprimer Inventory
- [ ] Supprimer Pricing
- [ ] Supprimer Shared (si métier)
- [ ] Nettoyer imports/modules
- [ ] Tests

### Phase 4 - Finalisation
- [ ] Retirer TypeORM package.json
- [ ] Supprimer data-source*.ts
- [ ] 0 imports TypeORM
- [ ] 0 entités TypeORM
- [ ] Tests 100% passent
- [ ] Documentation

---

## 📈 Métriques Infrastructure

| Métrique | Avant | Après Migration | Après Cleanup |
|----------|-------|-----------------|---------------|
| **Entités TypeORM** | 85 | ~62 | ~0 |
| **Domaines** | 14 | 10 | 6 |
| **Features** | 13 | 10 | 7 |
| **Modules TypeORM** | 20 | ~13 | 0 |
| **Services Prisma** | 10 (auth) | ~40 | ~40 |

---

## 🎯 Estimation Finale

### Migration Infrastructure Prisma
- Priorité HAUTE: 4.5 jours
- Priorité MOYENNE: 3.5-5 jours
- Priorité BASSE: 4.5 jours
- **Total Migration**: **12.5-14 jours**

### Cleanup Métier
- Suppression domaines: 0.5 jour
- Nettoyage imports: 0.5 jour
- Tests: 0.5 jour
- **Total Cleanup**: **1.5 jours**

### **TOTAL GLOBAL**: **14-15.5 jours** (3 semaines)

---

## 🚀 Actions Immédiates

### Option 1: Commencer par Migration Prisma

```bash
cd C:\GitHub\TopSteel
git checkout -b feature/complete-prisma-migration

# Commencer par Auth
cd apps/api/src/domains/auth
# Retirer entités TypeORM
# Tests
```

### Option 2: Commencer par Cleanup Métier (Plus rapide)

```bash
cd C:\GitHub\TopSteel
git checkout -b cleanup/remove-business-logic

# Supprimer domaines métier
rm -rf apps/api/src/domains/partners
rm -rf apps/api/src/domains/materials
rm -rf apps/api/src/domains/inventory
rm -rf apps/api/src/features/pricing

# Tests
npm run build
npm test
```

**Recommandation**: **Option 2** (Cleanup d'abord)
- Plus rapide (1.5 jour vs. 12 jours)
- Réduit scope migration Prisma
- Clarifie architecture TopSteel
- Puis migration Prisma sur infrastructure pure

---

**Créé par**: Claude
**Date**: 2025-11-19
**Next**: Décider Shared (infrastructure ou métier) + choisir Option 1 ou 2
