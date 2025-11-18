# Phase 9 - Route Mapping & Migration Guide

**Date:** 2025-01-18
**Phase:** 9.2 - Route Mapping Documentation
**Status:** 📋 EN COURS

---

## Vue d'Ensemble

Ce document détaille le mapping complet des routes avant/après la migration Phase 9.

**Objectif:** Faire de Prisma le système principal en:
- Supprimant les suffixes `-prisma` des routes Prisma
- Déplaçant les contrôleurs TypeORM vers `/xxx-legacy`

---

## Mapping des Routes - Services Core (Auth & Users)

### 1. Authentication (`/auth`)

**AVANT Phase 9:**
```
TypeORM:  POST /auth/login             (auth.controller.ts)
          POST /auth/logout
          GET  /auth/me

Prisma:   POST /auth-prisma/login      (auth-prisma.controller.ts) ✅
          POST /auth-prisma/logout
          GET  /auth-prisma/me
          POST /auth-prisma/refresh
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          POST /auth/login             (auth.controller.ts) ✅
          POST /auth/logout
          GET  /auth/me
          POST /auth/refresh

Legacy (TypeORM):
          POST /auth-legacy/login      (auth-legacy.controller.ts) @deprecated
          POST /auth-legacy/logout
          GET  /auth-legacy/me
```

**Fichiers:**
- `auth-prisma.controller.ts` → `auth.controller.ts`
- `auth.controller.ts` → `legacy/auth-legacy.controller.ts`

---

### 2. Users (`/users`)

**AVANT Phase 9:**
```
TypeORM:  GET    /users                (users.controller.ts)
          POST   /users
          GET    /users/:id
          PATCH  /users/:id
          DELETE /users/:id

Prisma:   GET    /users-prisma         (users-prisma.controller.ts) ✅
          POST   /users-prisma
          GET    /users-prisma/:id
          PATCH  /users-prisma/:id
          DELETE /users-prisma/:id
          GET    /users-prisma/:id/roles
          PATCH  /users-prisma/:id/settings
          GET    /users-prisma/stats
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /users                (users.controller.ts) ✅
          POST   /users
          GET    /users/:id
          PATCH  /users/:id
          DELETE /users/:id
          GET    /users/:id/roles
          PATCH  /users/:id/settings
          GET    /users/stats

Legacy (TypeORM):
          GET    /users-legacy         (users-legacy.controller.ts) @deprecated
          POST   /users-legacy
          ...
```

**Fichiers:**
- `users-prisma.controller.ts` → `users.controller.ts`
- `users.controller.ts` → `legacy/users-legacy.controller.ts`

---

### 3. Roles (`/roles`)

**AVANT Phase 9:**
```
TypeORM:  GET    /admin/roles          (role.controller.ts - dans external/)
          POST   /admin/roles

Prisma:   GET    /roles-prisma         (roles-prisma.controller.ts) ✅
          POST   /roles-prisma
          GET    /roles-prisma/:id
          PATCH  /roles-prisma/:id
          DELETE /roles-prisma/:id
          GET    /roles-prisma/:id/permissions
          POST   /roles-prisma/:id/permissions
          DELETE /roles-prisma/:roleId/permissions/:permId
          GET    /roles-prisma/stats
          GET    /roles-prisma/:id/users/count
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /roles                (roles.controller.ts) ✅
          POST   /roles
          GET    /roles/:id
          PATCH  /roles/:id
          DELETE /roles/:id
          GET    /roles/:id/permissions
          POST   /roles/:id/permissions
          DELETE /roles/:roleId/permissions/:permId
          GET    /roles/stats
          GET    /roles/:id/users/count

Legacy (TypeORM):
          GET    /admin/roles-legacy   (role-legacy.controller.ts) @deprecated
          POST   /admin/roles-legacy
```

**Fichiers:**
- `roles-prisma.controller.ts` → `roles.controller.ts`
- `external/controllers/role.controller.ts` → `legacy/role-legacy.controller.ts`

**Note:** Le contrôleur TypeORM était sous `/admin/roles`, maintenant il sera `/admin/roles-legacy`

---

### 4. Sessions (`/sessions`)

**AVANT Phase 9:**
```
TypeORM:  GET    /auth/sessions        (sessions.controller.ts - dans external/)
          DELETE /auth/sessions/:id

Prisma:   GET    /sessions-prisma      (sessions-prisma.controller.ts) ✅
          POST   /sessions-prisma
          GET    /sessions-prisma/:id
          PATCH  /sessions-prisma/:id
          DELETE /sessions-prisma/:id
          GET    /sessions-prisma/active
          GET    /sessions-prisma/user/:userId
          POST   /sessions-prisma/:id/refresh
          POST   /sessions-prisma/:id/revoke
          GET    /sessions-prisma/stats
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /sessions             (sessions.controller.ts) ✅
          POST   /sessions
          GET    /sessions/:id
          PATCH  /sessions/:id
          DELETE /sessions/:id
          GET    /sessions/active
          GET    /sessions/user/:userId
          POST   /sessions/:id/refresh
          POST   /sessions/:id/revoke
          GET    /sessions/stats

Legacy (TypeORM):
          GET    /auth/sessions-legacy (sessions-legacy.controller.ts) @deprecated
          DELETE /auth/sessions-legacy/:id
```

**Fichiers:**
- `sessions-prisma.controller.ts` → `sessions.controller.ts`
- `external/controllers/sessions.controller.ts` → `legacy/sessions-legacy.controller.ts`

**Note:** Le contrôleur TypeORM était sous `/auth/sessions`, maintenant il sera `/auth/sessions-legacy`

---

## Mapping des Routes - Multi-Tenant (Sociétés)

### 5. Sociétés (`/societes`)

**AVANT Phase 9:**
```
TypeORM:  GET    /societes             (societes.controller.ts - dans features/)
          POST   /societes

Prisma:   GET    /societes-prisma      (societes-prisma.controller.ts) ✅
          POST   /societes-prisma
          GET    /societes-prisma/:id
          PATCH  /societes-prisma/:id
          DELETE /societes-prisma/:id
          GET    /societes-prisma/:id/with-relations
          GET    /societes-prisma/code/:code
          POST   /societes-prisma/:id/deactivate
          GET    /societes-prisma/search
          GET    /societes-prisma/stats
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /societes             (societes.controller.ts) ✅
          POST   /societes
          GET    /societes/:id
          PATCH  /societes/:id
          DELETE /societes/:id
          GET    /societes/:id/with-relations
          GET    /societes/code/:code
          POST   /societes/:id/deactivate
          GET    /societes/search
          GET    /societes/stats

Legacy (TypeORM):
          GET    /societes-legacy      (societes-legacy.controller.ts) @deprecated
          POST   /societes-legacy
```

**Fichiers:**
- `societes-prisma.controller.ts` → `societes.controller.ts`
- `features/societes/controllers/societes.controller.ts` → `features/societes/legacy/societes-legacy.controller.ts`

---

### 6. Licences Sociétés (`/societe-licenses`)

**AVANT Phase 9:**
```
TypeORM:  GET    /api/admin/licenses   (license-management.controller.ts - dans features/)
          POST   /api/admin/licenses

Prisma:   GET    /societe-licenses-prisma              ✅
          POST   /societe-licenses-prisma
          GET    /societe-licenses-prisma/:id
          PATCH  /societe-licenses-prisma/:id
          DELETE /societe-licenses-prisma/:id
          GET    /societe-licenses-prisma/societe/:societeId
          GET    /societe-licenses-prisma/active
          POST   /societe-licenses-prisma/:id/activate
          POST   /societe-licenses-prisma/:id/deactivate
          POST   /societe-licenses-prisma/:id/revoke
          POST   /societe-licenses-prisma/:id/renew
          GET    /societe-licenses-prisma/expiring
          GET    /societe-licenses-prisma/stats
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /societe-licenses     (societe-licenses.controller.ts) ✅
          POST   /societe-licenses
          GET    /societe-licenses/:id
          PATCH  /societe-licenses/:id
          DELETE /societe-licenses/:id
          GET    /societe-licenses/societe/:societeId
          GET    /societe-licenses/active
          POST   /societe-licenses/:id/activate
          POST   /societe-licenses/:id/deactivate
          POST   /societe-licenses/:id/revoke
          POST   /societe-licenses/:id/renew
          GET    /societe-licenses/expiring
          GET    /societe-licenses/stats

Legacy (TypeORM):
          GET    /api/admin/licenses-legacy (license-management-legacy.controller.ts) @deprecated
          POST   /api/admin/licenses-legacy
```

**Fichiers:**
- `societe-licenses-prisma.controller.ts` → `societe-licenses.controller.ts`
- `features/societes/controllers/license-management.controller.ts` → `features/societes/legacy/license-management-legacy.controller.ts`

**Note:** Différence de route TypeORM: `/api/admin/licenses` → `/api/admin/licenses-legacy`

---

### 7. Utilisateurs Sociétés (`/societe-users`)

**AVANT Phase 9:**
```
TypeORM:  GET    /societes/:id/users   (societe-users.controller.ts - dans features/)
          POST   /societes/:id/users

Prisma:   GET    /societe-users-prisma                 ✅
          POST   /societe-users-prisma
          GET    /societe-users-prisma/:id
          PATCH  /societe-users-prisma/:id
          DELETE /societe-users-prisma/:id
          GET    /societe-users-prisma/societe/:societeId
          GET    /societe-users-prisma/user/:userId
          POST   /societe-users-prisma/:id/activate
          POST   /societe-users-prisma/:id/deactivate
          GET    /societe-users-prisma/:id/permissions
          POST   /societe-users-prisma/:id/permissions
          DELETE /societe-users-prisma/:id/permissions/:permissionId
          GET    /societe-users-prisma/stats
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /societe-users        (societe-users.controller.ts) ✅
          POST   /societe-users
          GET    /societe-users/:id
          PATCH  /societe-users/:id
          DELETE /societe-users/:id
          GET    /societe-users/societe/:societeId
          GET    /societe-users/user/:userId
          POST   /societe-users/:id/activate
          POST   /societe-users/:id/deactivate
          GET    /societe-users/:id/permissions
          POST   /societe-users/:id/permissions
          DELETE /societe-users/:id/permissions/:permissionId
          GET    /societe-users/stats

Legacy (TypeORM):
          GET    /societes/:id/users-legacy (societe-users-legacy.controller.ts) @deprecated
          POST   /societes/:id/users-legacy
```

**Fichiers:**
- `societe-users-prisma.controller.ts` → `societe-users.controller.ts`
- `features/societes/controllers/societe-users.controller.ts` → `features/societes/legacy/societe-users-legacy.controller.ts`

**Note:** Le contrôleur TypeORM était imbriqué sous `/societes/:id/users`

---

### 8. Sites (`/sites`)

**AVANT Phase 9:**
```
TypeORM:  GET    /sites                (sites.controller.ts - dans features/)
          POST   /sites

Prisma:   GET    /sites-prisma         (sites-prisma.controller.ts) ✅
          POST   /sites-prisma
          GET    /sites-prisma/:id
          PATCH  /sites-prisma/:id
          DELETE /sites-prisma/:id
          GET    /sites-prisma/societe/:societeId
          POST   /sites-prisma/:id/activate
          POST   /sites-prisma/:id/deactivate
          GET    /sites-prisma/search
          GET    /sites-prisma/stats
          GET    /sites-prisma/:id/with-relations
          GET    /sites-prisma/code/:code
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /sites                (sites.controller.ts) ✅
          POST   /sites
          GET    /sites/:id
          PATCH  /sites/:id
          DELETE /sites/:id
          GET    /sites/societe/:societeId
          POST   /sites/:id/activate
          POST   /sites/:id/deactivate
          GET    /sites/search
          GET    /sites/stats
          GET    /sites/:id/with-relations
          GET    /sites/code/:code

Legacy (TypeORM):
          GET    /sites-legacy         (sites-legacy.controller.ts) @deprecated
          POST   /sites-legacy
```

**Fichiers:**
- `sites-prisma.controller.ts` → `sites.controller.ts`
- `features/societes/controllers/sites.controller.ts` → `features/societes/legacy/sites-legacy.controller.ts`

---

## Mapping des Routes - Features (Notifications & Parameters)

### 9. Notifications (`/notifications`)

**AVANT Phase 9:**
```
TypeORM:  GET    /notifications        (notifications.controller.ts - dans features/)
          POST   /notifications
          PATCH  /notifications/:id/read

Prisma:   GET    /notifications-prisma (notifications-prisma.controller.ts) ✅
          POST   /notifications-prisma
          GET    /notifications-prisma/:id
          PATCH  /notifications-prisma/:id
          DELETE /notifications-prisma/:id
          (endpoints limités - schéma incomplet)
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /notifications        (notifications.controller.ts) ✅
          POST   /notifications
          GET    /notifications/:id
          PATCH  /notifications/:id
          DELETE /notifications/:id

Legacy (TypeORM):
          GET    /notifications-legacy (notifications-legacy.controller.ts) @deprecated
          POST   /notifications-legacy
          PATCH  /notifications-legacy/:id/read
```

**Fichiers:**
- `notifications-prisma.controller.ts` → `notifications.controller.ts`
- `features/notifications/notifications.controller.ts` → `features/notifications/legacy/notifications-legacy.controller.ts`

**Note:** Le contrôleur Prisma a des endpoints limités car le schéma Prisma est incomplet (Phase 5 limitation)

---

### 10. Paramètres Système (`/parameters`)

**AVANT Phase 9:**
```
TypeORM:  GET    /parameters           (parameters.controller.ts - dans features/)
          POST   /parameters

Prisma:   GET    /parameters-prisma    (parameters-prisma.controller.ts) ✅
          POST   /parameters-prisma
          GET    /parameters-prisma/:key
          PATCH  /parameters-prisma/:key
          DELETE /parameters-prisma/:key
```

**APRÈS Phase 9:**
```
Principal (Prisma):
          GET    /parameters           (parameters.controller.ts) ✅
          POST   /parameters
          GET    /parameters/:key
          PATCH  /parameters/:key
          DELETE /parameters/:key

Legacy (TypeORM):
          GET    /parameters-legacy    (parameters-legacy.controller.ts) @deprecated
          POST   /parameters-legacy
```

**Fichiers:**
- `parameters-prisma.controller.ts` → `parameters.controller.ts`
- `features/parameters/parameters.controller.ts` → `features/parameters/legacy/parameters-legacy.controller.ts`

---

## Tableau Récapitulatif - Mapping Complet

| # | Service | Route Actuelle (Prisma) | Route Cible (Principal) | Route Legacy (TypeORM) | Priorité |
|---|---------|-------------------------|-------------------------|------------------------|----------|
| 1 | **Auth** | `/auth-prisma` | `/auth` | `/auth-legacy` | ⭐⭐⭐ |
| 2 | **Users** | `/users-prisma` | `/users` | `/users-legacy` | ⭐⭐⭐ |
| 3 | **Roles** | `/roles-prisma` | `/roles` | `/admin/roles-legacy` | ⭐⭐⭐ |
| 4 | **Sessions** | `/sessions-prisma` | `/sessions` | `/auth/sessions-legacy` | ⭐⭐⭐ |
| 5 | **Sociétés** | `/societes-prisma` | `/societes` | `/societes-legacy` | ⭐⭐⭐ |
| 6 | **Licenses** | `/societe-licenses-prisma` | `/societe-licenses` | `/api/admin/licenses-legacy` | ⭐⭐ |
| 7 | **SocieteUsers** | `/societe-users-prisma` | `/societe-users` | `/societes/:id/users-legacy` | ⭐⭐ |
| 8 | **Sites** | `/sites-prisma` | `/sites` | `/sites-legacy` | ⭐⭐ |
| 9 | **Notifications** | `/notifications-prisma` | `/notifications` | `/notifications-legacy` | ⭐ |
| 10 | **Parameters** | `/parameters-prisma` | `/parameters` | `/parameters-legacy` | ⭐ |

**Total:** 10 contrôleurs, 77 endpoints Prisma

---

## Instructions de Migration Frontend

### Breaking Changes ⚠️

**Toutes les routes Prisma changent:**

```typescript
// ❌ AVANT (Phase 8)
const API_ENDPOINTS = {
  auth: {
    login: '/auth-prisma/login',
    logout: '/auth-prisma/logout',
    me: '/auth-prisma/me',
  },
  users: {
    list: '/users-prisma',
    getById: (id) => `/users-prisma/${id}`,
  },
  societes: {
    list: '/societes-prisma',
    getById: (id) => `/societes-prisma/${id}`,
  },
}

// ✅ APRÈS (Phase 9)
const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  users: {
    list: '/users',
    getById: (id) => `/users/${id}`,
  },
  societes: {
    list: '/societes',
    getById: (id) => `/societes/${id}`,
  },
}
```

### Stratégie de Migration Graduée

**Option 1: Migration Immédiate (Recommandée)**
- Mettre à jour toutes les routes en une fois
- Tester en environnement dev/staging
- Déployer en production

**Option 2: Backward Compatibility Temporaire**
Si nécessaire, utiliser les routes legacy temporairement:

```typescript
// Routes legacy disponibles pendant transition
const LEGACY_ENDPOINTS = {
  auth: '/auth-legacy/login',
  users: '/users-legacy',
  // ... etc
}
```

**ATTENTION:** Les routes legacy seront supprimées dans v3.0.0 (Phase 10)

---

## Validation Post-Migration

### Checklist Tests Frontend

Après migration, valider:

- [ ] ✅ Login/Logout fonctionnel (`/auth/login`)
- [ ] ✅ Récupération profil utilisateur (`/auth/me`)
- [ ] ✅ Liste utilisateurs (`/users`)
- [ ] ✅ CRUD utilisateurs (`/users/:id`)
- [ ] ✅ Gestion rôles (`/roles`)
- [ ] ✅ Liste sociétés (`/societes`)
- [ ] ✅ CRUD sociétés (`/societes/:id`)
- [ ] ✅ Gestion licences (`/societe-licenses`)
- [ ] ✅ Gestion sites (`/sites`)
- [ ] ✅ Notifications (`/notifications`)
- [ ] ✅ Paramètres système (`/parameters`)

### Tests Swagger/API

```bash
# Ouvrir Swagger
http://localhost:3000/api

# Vérifier:
1. Routes /users, /auth, /societes existent (Prisma)
2. Routes /users-legacy, /auth-legacy existent (TypeORM deprecated)
3. Tags corrects (sans "Prisma")
4. Deprecation warnings sur routes legacy
```

---

## Timeline & Rollback

### Timeline Estimée

| Étape | Durée | Cumul |
|-------|-------|-------|
| Backend migration (Phase 9) | 1-2 jours | 1-2j |
| Frontend migration | 1-2 jours | 2-4j |
| Testing & validation | 1 jour | 3-5j |
| Production deployment | 0.5 jour | 3.5-5.5j |

**Total:** 3.5 - 5.5 jours

### Plan de Rollback

Si problème critique en production:

**Option 1: Rollback Git**
```bash
git revert <commit-hash>
git push
```

**Option 2: Utiliser Routes Legacy**
Frontend peut temporairement revenir aux routes `-legacy` (TypeORM)

**Option 3: Feature Flag**
Implémenter feature flag pour basculer entre Prisma/TypeORM

---

## Documentation Additionnelle

**Voir aussi:**
- `PHASE_9_MIGRATION_PLAN.md` - Plan détaillé Phase 9
- `PHASE_8_3_1_FINAL_REPORT.md` - Tests Prisma validés
- `CHANGELOG.md` - Breaking changes v2.0.0
- `MIGRATION_GUIDE.md` - Guide complet migration

---

## Support & Questions

**En cas de problème:**
1. Vérifier Swagger: `http://localhost:3000/api`
2. Consulter logs serveur backend
3. Tester routes legacy en fallback
4. Contacter équipe backend pour assistance

---

*Document créé le 2025-01-18*
*Phase 9 - Route Mapping - Migration Prisma TopSteel*
