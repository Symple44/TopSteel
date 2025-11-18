# Phase 9 - Breaking Changes Documentation

**Date:** 2025-01-18
**Version:** 2.0.0
**Phase:** 9.2 - Documentation Breaking Changes
**Status:** 📋 DOCUMENTATION

---

## Vue d'Ensemble

Cette phase introduit des **BREAKING CHANGES majeurs** dans l'API TopSteel.

**Objectif:** Promouvoir Prisma comme ORM principal et déprécier TypeORM.

**Impact:** Toutes les applications frontend devront mettre à jour leurs endpoints API.

---

## 🚨 Breaking Changes Majeurs

### 1. Routes API Renommées (Prisma devient principal)

**Toutes les routes Prisma perdent le suffixe `-prisma`:**

| Service | Route AVANT (v1.x) | Route APRÈS (v2.0) | Impact |
|---------|-------------------|-------------------|---------|
| **Auth** | `/auth-prisma/login` | `/auth/login` | 🔴 HIGH |
| **Users** | `/users-prisma` | `/users` | 🔴 HIGH |
| **Roles** | `/roles-prisma` | `/roles` | 🔴 HIGH |
| **Sessions** | `/sessions-prisma` | `/sessions` | 🔴 HIGH |
| **Sociétés** | `/societes-prisma` | `/societes` | 🔴 HIGH |
| **Licenses** | `/societe-licenses-prisma` | `/societe-licenses` | 🟡 MEDIUM |
| **SocieteUsers** | `/societe-users-prisma` | `/societe-users` | 🟡 MEDIUM |
| **Sites** | `/sites-prisma` | `/sites` | 🟡 MEDIUM |
| **Notifications** | `/notifications-prisma` | `/notifications` | 🟢 LOW |
| **Parameters** | `/parameters-prisma` | `/parameters` | 🟢 LOW |

**Total:** 10 services, 77 endpoints impactés

---

### 2. Ancien Système TypeORM → Deprecated

**Les anciennes routes TypeORM sont maintenant deprecated:**

| Service | Ancienne Route | Nouvelle Route Legacy | Status |
|---------|---------------|----------------------|--------|
| **Auth** | `/auth/*` | `/auth-legacy/*` | @deprecated |
| **Users** | `/users/*` | `/users-legacy/*` | @deprecated |
| **Roles** | `/admin/roles/*` | `/admin/roles-legacy/*` | @deprecated |
| **Sessions** | `/auth/sessions/*` | `/auth/sessions-legacy/*` | @deprecated |
| **Sociétés** | `/societes/*` | `/societes-legacy/*` | @deprecated |
| **Sites** | `/sites/*` | `/sites-legacy/*` | @deprecated |
| **Notifications** | `/notifications/*` | `/notifications-legacy/*` | @deprecated |
| **Parameters** | `/parameters/*` | `/parameters-legacy/*` | @deprecated |

**⚠️ ATTENTION:** Les routes legacy seront **supprimées dans v3.0.0** (prévu Q2 2025)

---

## 📋 Migration Guide - Frontend

### Étape 1: Identifier Tous les Appels API

**Chercher dans le code frontend:**

```bash
# Rechercher tous les appels API Prisma
grep -r "auth-prisma" src/
grep -r "users-prisma" src/
grep -r "societes-prisma" src/
grep -r "roles-prisma" src/
grep -r "sessions-prisma" src/
```

### Étape 2: Mettre à Jour les Endpoints

**Exemple: Service d'authentification**

```typescript
// ❌ AVANT (v1.x)
const AuthService = {
  login: (credentials) =>
    axios.post('/api/auth-prisma/login', credentials),

  logout: () =>
    axios.post('/api/auth-prisma/logout'),

  getCurrentUser: () =>
    axios.get('/api/auth-prisma/me'),

  refreshToken: (token) =>
    axios.post('/api/auth-prisma/refresh', { token }),
}

// ✅ APRÈS (v2.0)
const AuthService = {
  login: (credentials) =>
    axios.post('/api/auth/login', credentials),

  logout: () =>
    axios.post('/api/auth/logout'),

  getCurrentUser: () =>
    axios.get('/api/auth/me'),

  refreshToken: (token) =>
    axios.post('/api/auth/refresh', { token }),
}
```

**Exemple: Service utilisateurs**

```typescript
// ❌ AVANT (v1.x)
const UserService = {
  getAll: (params) =>
    axios.get('/api/users-prisma', { params }),

  getById: (id) =>
    axios.get(`/api/users-prisma/${id}`),

  create: (userData) =>
    axios.post('/api/users-prisma', userData),

  update: (id, userData) =>
    axios.patch(`/api/users-prisma/${id}`, userData),

  delete: (id) =>
    axios.delete(`/api/users-prisma/${id}`),

  getRoles: (id) =>
    axios.get(`/api/users-prisma/${id}/roles`),

  getStats: () =>
    axios.get('/api/users-prisma/stats'),
}

// ✅ APRÈS (v2.0)
const UserService = {
  getAll: (params) =>
    axios.get('/api/users', { params }),

  getById: (id) =>
    axios.get(`/api/users/${id}`),

  create: (userData) =>
    axios.post('/api/users', userData),

  update: (id, userData) =>
    axios.patch(`/api/users/${id}`, userData),

  delete: (id) =>
    axios.delete(`/api/users/${id}`),

  getRoles: (id) =>
    axios.get(`/api/users/${id}/roles`),

  getStats: () =>
    axios.get('/api/users/stats'),
}
```

**Exemple: Service sociétés**

```typescript
// ❌ AVANT (v1.x)
const SocieteService = {
  getAll: () =>
    axios.get('/api/societes-prisma'),

  getById: (id) =>
    axios.get(`/api/societes-prisma/${id}`),

  create: (data) =>
    axios.post('/api/societes-prisma', data),

  update: (id, data) =>
    axios.patch(`/api/societes-prisma/${id}`, data),

  delete: (id) =>
    axios.delete(`/api/societes-prisma/${id}`),

  getByCode: (code) =>
    axios.get(`/api/societes-prisma/code/${code}`),

  getWithRelations: (id) =>
    axios.get(`/api/societes-prisma/${id}/with-relations`),

  search: (query) =>
    axios.get('/api/societes-prisma/search', { params: query }),

  getStats: () =>
    axios.get('/api/societes-prisma/stats'),
}

// ✅ APRÈS (v2.0)
const SocieteService = {
  getAll: () =>
    axios.get('/api/societes'),

  getById: (id) =>
    axios.get(`/api/societes/${id}`),

  create: (data) =>
    axios.post('/api/societes', data),

  update: (id, data) =>
    axios.patch(`/api/societes/${id}`, data),

  delete: (id) =>
    axios.delete(`/api/societes/${id}`),

  getByCode: (code) =>
    axios.get(`/api/societes/code/${code}`),

  getWithRelations: (id) =>
    axios.get(`/api/societes/${id}/with-relations`),

  search: (query) =>
    axios.get('/api/societes/search', { params: query }),

  getStats: () =>
    axios.get('/api/societes/stats'),
}
```

### Étape 3: Approche par Find & Replace

**Utilisez des regex pour remplacements en masse:**

```bash
# Dans votre éditeur (VS Code, IntelliJ, etc.)

# Remplacer:
/auth-prisma/        → /auth/
/users-prisma/       → /users/
/roles-prisma/       → /roles/
/sessions-prisma/    → /sessions/
/societes-prisma/    → /societes/
/sites-prisma/       → /sites/
/societe-licenses-prisma/ → /societe-licenses/
/societe-users-prisma/    → /societe-users/
/notifications-prisma/    → /notifications/
/parameters-prisma/       → /parameters/
```

**⚠️ ATTENTION:** Vérifiez manuellement après remplacement automatique !

### Étape 4: Mise à Jour des Types TypeScript (si applicable)

Si vous utilisez des types générés depuis l'API:

```typescript
// ❌ AVANT
import type {
  AuthPrismaLoginDto,
  UserPrismaDto,
  SocietePrismaDto
} from '@/types/api'

// ✅ APRÈS
import type {
  AuthLoginDto,
  UserDto,
  SocieteDto
} from '@/types/api'
```

---

## 🔄 Backward Compatibility (Temporaire)

### Routes Legacy Disponibles

**Pour faciliter la transition, les routes TypeORM restent disponibles en mode deprecated:**

```typescript
// Migration graduée possible
const API_CONFIG = {
  // Nouveau (v2.0) - Recommandé
  usePrismaRoutes: true,

  // Legacy (v1.x) - Deprecated
  useLegacyRoutes: false,
}

const AuthService = {
  login: (credentials) => {
    const endpoint = API_CONFIG.usePrismaRoutes
      ? '/api/auth/login'          // ✅ Nouveau
      : '/api/auth-legacy/login'   // ⚠️ Deprecated

    return axios.post(endpoint, credentials)
  },
}
```

**⚠️ AVERTISSEMENT:** Les routes legacy seront supprimées dans v3.0.0 (Q2 2025).

---

## 🧪 Tests & Validation

### Checklist Tests Frontend

Après migration, valider tous les endpoints:

**Authentication (Priorité HAUTE)** 🔴
- [ ] POST `/auth/login` - Login fonctionnel
- [ ] POST `/auth/logout` - Logout fonctionnel
- [ ] GET `/auth/me` - Récupération profil user
- [ ] POST `/auth/refresh` - Refresh token fonctionnel

**Users (Priorité HAUTE)** 🔴
- [ ] GET `/users` - Liste utilisateurs
- [ ] POST `/users` - Création utilisateur
- [ ] GET `/users/:id` - Détail utilisateur
- [ ] PATCH `/users/:id` - Update utilisateur
- [ ] DELETE `/users/:id` - Suppression utilisateur
- [ ] GET `/users/:id/roles` - Rôles utilisateur
- [ ] GET `/users/stats` - Statistiques

**Roles (Priorité HAUTE)** 🔴
- [ ] GET `/roles` - Liste rôles
- [ ] POST `/roles` - Création rôle
- [ ] GET `/roles/:id` - Détail rôle
- [ ] PATCH `/roles/:id` - Update rôle
- [ ] DELETE `/roles/:id` - Suppression rôle
- [ ] GET `/roles/:id/permissions` - Permissions du rôle
- [ ] POST `/roles/:id/permissions` - Assigner permission
- [ ] DELETE `/roles/:roleId/permissions/:permId` - Retirer permission

**Sessions (Priorité HAUTE)** 🔴
- [ ] GET `/sessions` - Liste sessions
- [ ] GET `/sessions/:id` - Détail session
- [ ] DELETE `/sessions/:id` - Suppression session
- [ ] GET `/sessions/active` - Sessions actives
- [ ] POST `/sessions/:id/revoke` - Révoquer session

**Sociétés (Priorité HAUTE)** 🔴
- [ ] GET `/societes` - Liste sociétés
- [ ] POST `/societes` - Création société
- [ ] GET `/societes/:id` - Détail société
- [ ] PATCH `/societes/:id` - Update société
- [ ] DELETE `/societes/:id` - Suppression société
- [ ] GET `/societes/search` - Recherche sociétés
- [ ] GET `/societes/stats` - Statistiques

**Licenses (Priorité MOYENNE)** 🟡
- [ ] GET `/societe-licenses` - Liste licences
- [ ] POST `/societe-licenses` - Création licence
- [ ] GET `/societe-licenses/:id` - Détail licence
- [ ] POST `/societe-licenses/:id/activate` - Activer licence
- [ ] POST `/societe-licenses/:id/revoke` - Révoquer licence

**Sites (Priorité MOYENNE)** 🟡
- [ ] GET `/sites` - Liste sites
- [ ] POST `/sites` - Création site
- [ ] GET `/sites/:id` - Détail site
- [ ] PATCH `/sites/:id` - Update site

**Notifications (Priorité BASSE)** 🟢
- [ ] GET `/notifications` - Liste notifications
- [ ] POST `/notifications` - Création notification
- [ ] PATCH `/notifications/:id` - Marquer lu

**Parameters (Priorité BASSE)** 🟢
- [ ] GET `/parameters` - Liste paramètres
- [ ] GET `/parameters/:key` - Détail paramètre
- [ ] PATCH `/parameters/:key` - Update paramètre

---

## 📊 Impact Analysis

### Endpoints Impactés par Service

| Service | Endpoints Impactés | Impact Critique | Notes |
|---------|-------------------|----------------|-------|
| **Auth** | 4 | 🔴 OUI | Login/Logout critical |
| **Users** | 8 | 🔴 OUI | User management core |
| **Roles** | 10 | 🔴 OUI | Permission system |
| **Sessions** | 10 | 🔴 OUI | Session management |
| **Sociétés** | 11 | 🔴 OUI | Multi-tenant foundation |
| **Licenses** | 13 | 🟡 MEDIUM | License control |
| **SocieteUsers** | 13 | 🟡 MEDIUM | User-tenant mapping |
| **Sites** | 12 | 🟡 MEDIUM | Site management |
| **Notifications** | ? | 🟢 LOW | Non-critical feature |
| **Parameters** | ? | 🟢 LOW | System config |

**Total:** 77+ endpoints impactés

---

## 🚀 Deployment Strategy

### Étape 1: Backend Deployment (Phase 9)

```bash
# Déployer backend v2.0.0 avec:
✅ Routes Prisma sans suffixe -prisma
✅ Routes TypeORM legacy (deprecated)
✅ Documentation Swagger mise à jour
```

### Étape 2: Frontend Migration (après backend)

```bash
# Option A: Big Bang (Recommandé si tests complets)
- Mettre à jour tous les endpoints en une fois
- Tester en staging
- Déployer en production

# Option B: Gradual (Si risque élevé)
- Migrer par batch (Auth → Users → Societes → ...)
- Tester chaque batch en staging
- Déployer progressivement
```

### Étape 3: Monitoring Post-Deployment

```bash
# Surveiller:
- Taux d'erreur 404 (routes incorrectes)
- Latence endpoints
- Logs backend (erreurs auth, db)
- Feedback utilisateurs
```

### Étape 4: Cleanup (v3.0.0 - Q2 2025)

```bash
# Supprimer:
- Tous les contrôleurs legacy TypeORM
- Routes -legacy
- Dépendances TypeORM du package.json
```

---

## ⚠️ Risks & Mitigations

### Risques Identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Frontend non mis à jour** | 🔴 CRITIQUE | 🟡 MOYENNE | Routes legacy disponibles temporairement |
| **Tests incomplets** | 🔴 HAUTE | 🟢 FAIBLE | 82 tests Prisma validés en Phase 8 |
| **Rollback nécessaire** | 🟡 MOYENNE | 🟢 FAIBLE | Git revert + routes legacy |
| **Performance dégradée** | 🟡 MOYENNE | 🟢 FAIBLE | Prisma optimisé, tests benchmarks OK |
| **Breaking change frontend tiers** | 🔴 HAUTE | 🔴 HAUTE | Documentation + communication |

### Plan de Rollback

**Si problème critique en production:**

1. **Rollback Git Backend:**
```bash
git revert <commit-hash-phase-9>
git push origin main
# Redéployer backend v1.x
```

2. **Frontend utilise routes legacy:**
```typescript
// Frontend temporairement vers routes legacy
const API_BASE = '/api/auth-legacy'  // Fallback TypeORM
```

3. **Hotfix rapide:**
```bash
# Créer branche hotfix
git checkout -b hotfix/phase9-rollback
# Corriger problème
git commit -m "fix: rollback phase 9"
git push
```

---

## 📚 Documentation Additionnelle

**Voir aussi:**

- `PHASE_9_MIGRATION_PLAN.md` - Plan complet Phase 9
- `PHASE_9_ROUTE_MAPPING.md` - Mapping détaillé routes
- `PHASE_8_3_1_FINAL_REPORT.md` - Tests Prisma validés (82/109)
- `CHANGELOG.md` - Changelog v2.0.0
- Swagger API: `http://localhost:3000/api`

---

## 📞 Support

**En cas de problème:**

1. **Consulter Swagger:**
   - Ouvrir: `http://localhost:3000/api`
   - Vérifier routes disponibles
   - Tester endpoints directement

2. **Logs Backend:**
```bash
# Consulter logs serveur
tail -f logs/api.log

# Filtrer erreurs
grep "ERROR" logs/api.log
```

3. **Tests Endpoints:**
```bash
# Test rapide endpoints critiques
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "test"}'

curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"
```

4. **Contacter équipe backend:**
   - Email: backend-team@topsteel.com
   - Slack: #backend-support
   - Créer issue: GitHub Issues

---

## 🎯 Success Criteria

**Phase 9 réussie si:**

✅ **Backend:**
- 0 erreurs TypeScript
- Serveur démarre sans erreur
- 82+ tests passants (maintenu)
- Swagger accessible et correct
- Routes Prisma standards fonctionnent
- Routes legacy fonctionnent avec warnings

✅ **Frontend:**
- Tous les endpoints migrés
- Tous les tests E2E passent
- Aucune régression fonctionnelle
- Performance maintenue
- Déploiement production réussi

✅ **Documentation:**
- CHANGELOG.md updated
- Migration guide complet
- Swagger docs à jour
- Communication équipes faite

---

*Document créé le 2025-01-18*
*Phase 9 - Breaking Changes Documentation - Migration Prisma TopSteel*
*Version: 2.0.0*
