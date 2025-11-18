# Phase 9 - Dépréciation TypeORM et Promotion Prisma ✅

**Date:** 2025-01-18
**Status:** 📋 EN COURS
**Objectif:** Faire de Prisma LE système principal (supprimer suffixes `-prisma`)

---

## Contexte

Après les phases 1-8, nous avons:
- ✅ 77 endpoints Prisma fonctionnels
- ✅ 0 erreurs TypeScript
- ✅ Tests critiques validés (82 tests passants)
- ✅ Infrastructure Multi-Tenant complète

**Problème Actuel:** Double système confus
```
/users          → TypeORM (ancien)
/users-prisma   → Prisma (nouveau) ✅
```

**Objectif Phase 9:** Système unique Prisma
```
/users          → Prisma ✅ (principal)
/users-legacy   → TypeORM (deprecated)
```

---

## Contrôleurs Prisma à Migrer

### Inventaire Complet (10 contrôleurs, 77 endpoints)

| # | Contrôleur | Route Actuelle | Route Cible | Endpoints | Priorité |
|---|------------|----------------|-------------|-----------|----------|
| 1 | **auth-prisma.controller.ts** | `/auth-prisma` | `/auth` | ? | ⭐⭐⭐ |
| 2 | **users-prisma.controller.ts** | `/users-prisma` | `/users` | 8 | ⭐⭐⭐ |
| 3 | **roles-prisma.controller.ts** | `/roles-prisma` | `/roles` | 10 | ⭐⭐⭐ |
| 4 | **sessions-prisma.controller.ts** | `/sessions-prisma` | `/sessions` | 10 | ⭐⭐⭐ |
| 5 | **societes-prisma.controller.ts** | `/societes-prisma` | `/societes` | 11 | ⭐⭐⭐ |
| 6 | **societe-licenses-prisma.controller.ts** | `/societe-licenses-prisma` | `/societe-licenses` | 13 | ⭐⭐ |
| 7 | **societe-users-prisma.controller.ts** | `/societe-users-prisma` | `/societe-users` | 13 | ⭐⭐ |
| 8 | **sites-prisma.controller.ts** | `/sites-prisma` | `/sites` | 12 | ⭐⭐ |
| 9 | **notifications-prisma.controller.ts** | `/notifications-prisma` | `/notifications` | ? | ⭐ |
| 10 | **parameters-prisma.controller.ts** | `/parameters-prisma` | `/parameters` | ? | ⭐ |

**Total:** 10 contrôleurs, 77 endpoints

---

## Stratégie de Migration

### Approche: Renommer Prisma, Déplacer TypeORM

**Pas de suppression** - TypeORM reste disponible en legacy pour rollback si nécessaire

### Étapes Détaillées

**Phase 9.1: Analyse ✅ (Complétée)**
- [x] Inventaire des 10 contrôleurs Prisma
- [x] Identification routes actuelles
- [x] Création plan de migration

**Phase 9.2: Préparation Structure**
- [ ] Créer dossier `legacy/` pour controllers TypeORM
- [ ] Créer mapping routes (ancien → nouveau)
- [ ] Documenter breaking changes

**Phase 9.3: Migration Contrôleurs Prisma**
- [ ] Renommer routes dans @Controller() decorators
- [ ] Mettre à jour tags Swagger
- [ ] Vérifier guards et interceptors

**Phase 9.4: Déplacement TypeORM vers Legacy**
- [ ] Déplacer controllers TypeORM vers `/legacy`
- [ ] Ajouter `@deprecated` warnings
- [ ] Créer redirections temporaires (optionnel)

**Phase 9.5: Mise à Jour Modules**
- [ ] Mettre à jour imports dans modules
- [ ] Vérifier app.module.ts
- [ ] Mettre à jour tests si nécessaire

**Phase 9.6: Validation**
- [ ] Compiler TypeScript (0 erreurs)
- [ ] Lancer serveur dev
- [ ] Tester endpoints Swagger
- [ ] Lancer tests unitaires

**Phase 9.7: Documentation**
- [ ] CHANGELOG.md (breaking changes)
- [ ] Migration guide pour frontend
- [ ] Update README.md
- [ ] API documentation

---

## Plan de Migration Détaillé

### Phase 9.2: Préparation (30 min)

**Actions:**
1. Créer structure legacy
```bash
mkdir -p src/domains/auth/legacy
mkdir -p src/domains/users/legacy
mkdir -p src/domains/notifications/legacy
# etc.
```

2. Créer document mapping routes
```markdown
# Route Mapping
/auth → /auth-prisma (nouveau principal)
/auth-legacy → /auth (ancien TypeORM)
```

### Phase 9.3: Migration Contrôleurs Prisma (2-3h)

**Pour chaque contrôleur:**

**Exemple: users-prisma.controller.ts**

**AVANT:**
```typescript
@Controller('users-prisma')
@ApiTags('👥 Users (Prisma)')
export class UsersPrismaController {
  // ...
}
```

**APRÈS:**
```typescript
@Controller('users')
@ApiTags('👥 Users')
export class UsersController {  // Renommer classe aussi
  // ...
}
```

**Checklist par contrôleur:**
- [ ] Renommer @Controller('xxx-prisma') → @Controller('xxx')
- [ ] Renommer @ApiTags('Xxx (Prisma)') → @ApiTags('Xxx')
- [ ] Renommer classe: XxxPrismaController → XxxController
- [ ] Renommer fichier: xxx-prisma.controller.ts → xxx.controller.ts
- [ ] Mettre à jour imports dans module
- [ ] Mettre à jour exports

**Scripts d'aide:**
```bash
# Vérifier toutes les routes Prisma
grep -r "@Controller('.*-prisma')" src/

# Vérifier ApiTags
grep -r "@ApiTags.*Prisma" src/
```

### Phase 9.4: Déplacement TypeORM vers Legacy (1-2h)

**Pour chaque contrôleur TypeORM:**

**Exemple: users.controller.ts (TypeORM)**

1. **Déplacer fichier**
```bash
mv src/domains/users/controllers/users.controller.ts \
   src/domains/users/legacy/users-legacy.controller.ts
```

2. **Ajouter deprecation**
```typescript
/**
 * @deprecated Use UsersController (Prisma) instead
 * This controller is kept for backward compatibility only
 * Will be removed in v2.0.0
 */
@Controller('users-legacy')
@ApiTags('👥 Users (Legacy - Deprecated)')
@ApiDeprecated() // Si disponible
export class UsersLegacyController {
  // ... code inchangé
}
```

3. **Mettre à jour module**
```typescript
// users.module.ts
import { UsersController } from './users.controller' // Nouveau Prisma
import { UsersLegacyController } from './legacy/users-legacy.controller' // Ancien

@Module({
  controllers: [
    UsersController,        // Principal
    UsersLegacyController,  // Deprecated
  ],
})
```

### Phase 9.5: Mise à Jour Modules (30 min)

**Fichiers à mettre à jour:**

1. **app.module.ts**
```typescript
// Vérifier que tous les modules Prisma sont importés
import { UsersPrismaModule } from './domains/users/prisma/users-prisma.module'
// Plus besoin du module TypeORM dans imports principaux
```

2. **Modules de domaine**
Vérifier chaque module pour imports corrects

### Phase 9.6: Validation (1h)

**Tests de compilation:**
```bash
pnpm type-check
# Doit être 0 erreurs
```

**Tests serveur:**
```bash
pnpm dev
# Vérifier que le serveur démarre sans erreur
```

**Tests Swagger:**
```
http://localhost:3000/api
- Vérifier que routes /users, /auth, etc. existent
- Vérifier que routes /-legacy existent aussi
- Vérifier tags corrects
```

**Tests unitaires:**
```bash
pnpm test
# 82+ tests doivent passer
```

**Tests E2E (si disponibles):**
```bash
pnpm test:e2e
```

### Phase 9.7: Documentation (1h)

**1. CHANGELOG.md**
```markdown
## [2.0.0] - 2025-01-18

### BREAKING CHANGES
- All Prisma routes now use standard names (removed `-prisma` suffix)
- TypeORM controllers moved to `/xxx-legacy` routes
- TypeORM is now deprecated and will be removed in v3.0.0

### Migration Guide
**Frontend applications must update API endpoints:**

BEFORE:
- POST /auth-prisma/login
- GET /users-prisma
- GET /societes-prisma

AFTER:
- POST /auth/login
- GET /users
- GET /societes

**Backward compatibility (temporary):**
Legacy routes still available:
- POST /auth-legacy/login (deprecated)
- GET /users-legacy (deprecated)

### New Features
- Prisma is now the primary ORM
- All endpoints tested and validated
- Multi-tenant infrastructure ready

### Deprecated
- All TypeORM controllers (use Prisma equivalents)
- Routes ending with `-legacy` suffix
```

**2. MIGRATION_GUIDE.md**
Créer guide complet pour frontend teams

**3. README.md**
Mettre à jour avec nouvelles routes

---

## Ordre de Migration Recommandé

### Batch 1: Services Core (Priorité HAUTE) ⭐⭐⭐

1. **auth-prisma** → **auth**
2. **users-prisma** → **users**
3. **roles-prisma** → **roles**
4. **sessions-prisma** → **sessions**

**Raison:** Services d'authentification = critique, doit être stable

### Batch 2: Multi-Tenant (Priorité HAUTE) ⭐⭐⭐

5. **societes-prisma** → **societes**
6. **societe-licenses-prisma** → **societe-licenses**
7. **societe-users-prisma** → **societe-users**
8. **sites-prisma** → **sites**

**Raison:** Infrastructure multi-tenant = fondation pour TopTime

### Batch 3: Features (Priorité MOYENNE) ⭐

9. **notifications-prisma** → **notifications**
10. **parameters-prisma** → **parameters**

**Raison:** Services utilitaires, moins critiques

---

## Gestion des Risques

### Risques Identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Breaking changes frontend** | HAUTE | HAUTE | Migration guide + routes legacy |
| **Tests cassés** | MOYENNE | FAIBLE | Tests avant commit |
| **Imports cassés** | MOYENNE | MOYENNE | TypeScript compiler catch |
| **Swagger doc incorrecte** | FAIBLE | FAIBLE | Vérification manuelle |

### Plan de Rollback

Si problème critique détecté:

1. **Rollback Git**
```bash
git revert <commit-hash>
git push
```

2. **Routes Legacy**
Les routes TypeORM restent disponibles en `-legacy`

3. **Hotfix**
Créer branche hotfix si nécessaire

---

## Checklist de Validation Finale

### Avant Commit

- [ ] ✅ 0 erreurs TypeScript (`pnpm type-check`)
- [ ] ✅ Serveur démarre sans erreur (`pnpm dev`)
- [ ] ✅ Tous les tests passent (`pnpm test`)
- [ ] ✅ Swagger accessible et correct
- [ ] ✅ Routes Prisma fonctionnent
- [ ] ✅ Routes Legacy fonctionnent
- [ ] ✅ Documentation à jour

### Après Déploiement

- [ ] ✅ Endpoints production répondent
- [ ] ✅ Frontend fonctionne
- [ ] ✅ Monitoring OK
- [ ] ✅ Logs propres (pas d'erreurs)

---

## Timeline Estimée

| Phase | Durée | Cumul |
|-------|-------|-------|
| 9.1 Analyse | ✅ Done | 0.5h |
| 9.2 Préparation | 0.5h | 1h |
| 9.3 Migration Prisma | 2-3h | 3-4h |
| 9.4 Déplacement TypeORM | 1-2h | 4-6h |
| 9.5 Modules | 0.5h | 4.5-6.5h |
| 9.6 Validation | 1h | 5.5-7.5h |
| 9.7 Documentation | 1h | 6.5-8.5h |

**Total:** 1-2 jours de travail

---

## Success Criteria

### Phase 9 Réussie Si:

✅ **Routes Standards Fonctionnent**
```bash
GET /users          → 200 OK (Prisma)
GET /societes       → 200 OK (Prisma)
POST /auth/login    → 200 OK (Prisma)
```

✅ **Routes Legacy Fonctionnent**
```bash
GET /users-legacy   → 200 OK (TypeORM deprecated)
```

✅ **Tests Passent**
```bash
82+ tests passants
0 erreurs TypeScript
```

✅ **Documentation Complète**
```
CHANGELOG.md updated
MIGRATION_GUIDE.md created
README.md updated
```

✅ **Swagger Propre**
```
Tags corrects (sans "Prisma")
Routes organisées
Deprecation warnings visibles
```

---

## Après Phase 9

### Phase 10 (Optionnel - Future)

**Suppression complète TypeORM**
- Retirer tous les controllers legacy
- Supprimer dépendances TypeORM
- Nettoyer code mort

**Timing:** Après migration TopTime réussie (3-6 mois)

### Maintenance Continue

- Ajuster tests échouants (23 tests)
- Ajouter tests E2E
- Améliorer couverture
- Optimisations performance

---

## Commandes Utiles

```bash
# Vérifier routes Prisma actuelles
grep -r "@Controller('.*-prisma')" src/

# Compter endpoints
grep -r "@Get\|@Post\|@Put\|@Delete\|@Patch" src/ | wc -l

# Vérifier imports cassés
pnpm type-check

# Lancer serveur
pnpm dev

# Tests
pnpm test

# Swagger
open http://localhost:3000/api
```

---

## Conclusion

Phase 9 = **Transition finale vers Prisma**

**Avant Phase 9:**
- Routes: `/users-prisma` (confus)
- Système: Double (TypeORM + Prisma)
- Status: Temporaire

**Après Phase 9:**
- Routes: `/users` (standard)
- Système: Prisma principal, TypeORM deprecated
- Status: Production-ready

**Impact:** Prisma devient LE système officiel, prêt pour migration TopTime

---

*Plan créé le 2025-01-18*
*Phase 9 - Dépréciation TypeORM - Migration Prisma TopSteel*
