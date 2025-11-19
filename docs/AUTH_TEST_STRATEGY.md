# Stratégie de Tests - Domaine Auth

**Date**: 2025-11-18
**Status**: ✅ AuthController, ⏳ Autres contrôleurs

---

## 📊 Vue d'ensemble

### Contrôleurs Auth identifiés:

1. **AuthController** (`/auth`) - ✅ **TESTÉ** (17 tests)
2. **RolesController** (`/roles`) - ⏳ En cours
3. **SessionsController** (`/sessions`) - 📋 À faire
4. **PermissionSearchController** (`/permissions`) - 📋 À faire
5. **MfaController** (`/mfa`) - 📋 À faire (optionnel)
6. **GroupController** (`/groups`) - 📋 À faire (optionnel)
7. **ModuleController** (`/modules`) - 📋 À faire

---

## ✅ Tests Complétés

### AuthController (17 tests - 100% pass)

**Fichier**: `src/domains/auth/auth.controller.spec.ts`

#### POST `/auth/login` (7 tests)
- ✅ Login réussi avec credentials valides
- ✅ Exception quand utilisateur non trouvé
- ✅ Exception quand mot de passe invalide
- ✅ Exception quand utilisateur inactif
- ✅ Création session avec IP et user agent
- ✅ Génération unique de session ID
- ✅ Parsing correct de expiresIn

#### POST `/auth/validate-token` (10 tests)
- ✅ Validation réussie avec token valide
- ✅ Rejet pour token expiré/malformé
- ✅ Rejet quand utilisateur non trouvé
- ✅ Rejet quand utilisateur inactif
- ✅ Rejet quand session non trouvée
- ✅ Rejet quand session révoquée
- ✅ Rejet quand session force logged out
- ✅ Rejet quand session a logoutTime
- ✅ Gestion utilisateur sans rôles
- ✅ Gestion des erreurs de base de données

**Pattern utilisé**: Direct instantiation (non NestJS TestingModule)
```typescript
controller = new AuthController(
  mockAuthPrismaService,
  mockSessionPrismaService,
  mockRolePrismaService,
  mockJwtService,
  mockConfigService
)
```

---

## 📋 Plan de Tests - RolesController

**Endpoints**: 10 total

### Priorité HAUTE (Tests critiques)

#### GET `/roles` - Liste des rôles
**Tests à implémenter**:
- ✅ Devrait retourner tous les rôles actifs par défaut
- ✅ Devrait filtrer par societeId
- ✅ Devrait inclure les rôles inactifs si demandé
- ✅ Devrait retourner metadata correcte

#### POST `/roles` - Création de rôle
**Tests à implémenter**:
- ✅ Devrait créer un rôle avec données valides
- ✅ Devrait rejeter si nom déjà existant (409)
- ✅ Devrait valider champs requis
- ✅ Devrait définir valeurs par défaut (isActive=true, level=0)

#### GET `/roles/:id` - Détails d'un rôle
**Tests à implémenter**:
- ✅ Devrait retourner rôle avec relations
- ✅ Devrait retourner 404 si non trouvé

#### DELETE `/roles/:id` - Suppression
**Tests à implémenter**:
- ✅ Devrait supprimer rôle non-système
- ✅ Devrait rejeter suppression rôle système (409)
- ✅ Devrait rejeter si rôle utilisé (409)

### Priorité MOYENNE

#### PUT `/roles/:id` - Mise à jour
- Devrait mettre à jour rôle existant
- Devrait rejeter modification rôle système
- Devrait valider unicité du nom

#### GET `/roles/stats` - Statistiques
- Devrait retourner stats globales
- Devrait filtrer stats par societeId

#### GET `/roles/:id/permissions` - Permissions du rôle
- Devrait retourner permissions avec détails
- Devrait retourner 404 si rôle non trouvé

### Priorité BASSE (Optionnel)

- POST `/roles/:id/permissions` - Assigner permission
- DELETE `/roles/:id/permissions/:permissionId` - Révoquer permission
- GET `/roles/:id/users-count` - Compter utilisateurs

**Estimation**: 15-20 tests pour couverture complète

---

## 📋 Plan de Tests - SessionsController

**Endpoints**: 10 total

### Priorité HAUTE

#### GET `/sessions/:id` - Détails session
- Devrait retourner session active
- Devrait retourner 404 si non trouvée

#### POST `/sessions` - Créer session
- Devrait créer session avec données complètes
- Devrait générer sessionId unique

#### DELETE `/sessions/:sessionId` - Terminer session
- Devrait marquer session comme terminée
- Devrait définir logoutTime

#### GET `/sessions/user/:userId` - Sessions utilisateur
- Devrait retourner toutes les sessions actives
- Devrait filtrer par statut

### Priorité MOYENNE

- GET `/sessions/stats` - Statistiques
- POST `/sessions/:sessionId/force-logout` - Forcer déconnexion
- DELETE `/sessions/user/:userId/revoke-all` - Révoquer toutes les sessions
- GET `/sessions/user/:userId/count` - Compter sessions

### Priorité BASSE

- POST `/sessions/cleanup/expired` - Nettoyage sessions expirées
- POST `/sessions/cleanup/idle` - Nettoyage sessions inactives

**Estimation**: 12-15 tests pour couverture essentielle

---

## 📋 Plan de Tests - PermissionSearchController

**Endpoints**: 10+ (endpoints de recherche complexes)

### Stratégie recommandée

Les endpoints de permissions sont des **endpoints de recherche/query** avancés. Recommandation:

1. **Tests unitaires basiques** (5-7 tests)
   - POST `/permissions/query` - Requête basique
   - GET `/permissions/users-with-permission/:permission` - Recherche utilisateurs
   - GET `/permissions/has` - Vérification permission

2. **Tests d'intégration** plutôt qu'unitaires exhaustifs
   - Ces endpoints sont mieux testés via tests E2E
   - Dépendent fortement de l'état de la base de données

**Estimation**: 5-7 tests unitaires critiques

---

## 🔗 Tests d'Intégration (Option 2)

### Flow: Login → Validate Token

**Fichier à créer**: `src/domains/auth/__tests__/auth-integration.spec.ts`

```typescript
describe('Auth Integration Flow', () => {
  it('should complete full auth flow: login → validate-token', async () => {
    // 1. Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })

    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.accessToken).toBeDefined()

    // 2. Validate Token
    const validateResponse = await request(app.getHttpServer())
      .post('/api/auth/validate-token')
      .send({ token: loginResponse.body.accessToken })

    expect(validateResponse.body.valid).toBe(true)
    expect(validateResponse.body.user.email).toBe('test@example.com')
  })
})
```

**Tests à implémenter**:
1. ✅ Flow complet login → validate-token
2. ✅ Login → validate-token avec token expiré
3. ✅ Login → logout → validate-token (devrait échouer)
4. ✅ Login multiple → vérifier sessions multiples
5. ✅ Login → force-logout → validate-token (devrait échouer)

**Estimation**: 5-7 tests d'intégration

---

## 📝 Documentation (Options 3 & 4)

### Amélioration Swagger Auth Endpoints

**Fichiers à enrichir**:
1. `auth.controller.ts` - Déjà bien documenté ✅
2. `roles.controller.ts` - Déjà bien documenté ✅
3. `sessions.controller.ts` - À vérifier
4. Créer exemples de requêtes/réponses

### Guide d'intégration TopTime API

**Fichier à créer**: `docs/TOPTIME_API_INTEGRATION.md`

**Sections**:
1. **Vue d'ensemble de l'architecture**
   - TopSteel API (NestJS + Prisma) = Infrastructure/Auth
   - TopTime API (Express + Prisma) = Logique métier

2. **Configuration**
   - URL de TopSteel API
   - Secrets JWT partagés
   - Variables d'environnement

3. **Flow d'authentification**
   - Diagram: TopTime → TopSteel validate-token

4. **Endpoints disponibles**
   - POST /auth/validate-token
   - Format des requêtes/réponses
   - Codes d'erreur

5. **Exemples de code**
   - Node.js/Express middleware
   - Axios interceptors
   - Error handling

6. **Sécurité**
   - HTTPS requis
   - Rate limiting
   - Token refresh strategy

7. **Troubleshooting**
   - Erreurs communes
   - Logs à vérifier

---

## 📊 Résumé Global

### Tests Unitaires

| Contrôleur | Endpoints | Tests Planifiés | Status |
|-----------|-----------|-----------------|--------|
| AuthController | 2 | 17 | ✅ Complété |
| RolesController | 10 | 15-20 | ⏳ Prioritaire |
| SessionsController | 10 | 12-15 | 📋 À faire |
| PermissionSearchController | 10+ | 5-7 | 📋 À faire |
| **TOTAL** | **32+** | **49-59** | **17/59 (29%)** |

### Tests d'Intégration

| Type | Tests Planifiés | Status |
|------|-----------------|--------|
| Auth Flow | 5-7 | 📋 À faire |
| Roles Flow | 3-5 | 📋 Optionnel |
| **TOTAL** | **8-12** | **0/12 (0%)** |

### Documentation

| Document | Statut |
|----------|--------|
| Swagger Auth | ✅ Bon |
| Swagger Roles | ✅ Bon |
| Guide TopTime API | 📋 À créer |
| Test Strategy (ce doc) | ✅ Créé |

---

## 🎯 Recommandations Prochaines Étapes

### Court terme (Aujourd'hui)

1. ✅ **Créer tests RolesController** (priorité HAUTE uniquement)
   - GET /roles, POST /roles, GET /roles/:id, DELETE /roles/:id
   - ~10 tests essentiels

2. ✅ **Créer tests d'intégration Auth**
   - Login → validate-token flow
   - ~3-5 tests critiques

3. ✅ **Créer guide TopTime API**
   - Documentation complète d'intégration

### Moyen terme

4. **Tests SessionsController** (priorité HAUTE)
5. **Tests PermissionSearchController** (sélectifs)
6. **Tests E2E complets**

### Long terme

7. **Tests des autres domaines** (Users, Societes)
8. **CI/CD integration** des tests
9. **Code coverage reports**

---

## 📈 Métriques de Qualité

**Objectifs de couverture**:
- ✅ AuthController: 100% des endpoints testés
- 🎯 RolesController: 60% des endpoints (priorités HAUTE/MOYENNE)
- 🎯 SessionsController: 50% des endpoints (priorités HAUTE)
- 🎯 Tests d'intégration: Flows critiques couverts

**Pattern de tests établi**: ✅
- Direct instantiation avec mocks Vitest
- Arrange-Act-Assert structure
- Mock services complets dans beforeEach

---

**Auteur**: Claude
**Dernière mise à jour**: 2025-11-18
