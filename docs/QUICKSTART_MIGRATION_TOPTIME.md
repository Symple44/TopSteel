# Guide de Démarrage Rapide - Migration TopTime

**⚡ Version courte du plan complet**

---

## 🎯 Objectif

Migrer TopTime (TypeORM → Prisma) et intégrer l'authentification TopSteel

---

## 📊 Vue d'Ensemble 30 Secondes

```
TopSteel (NestJS + Prisma)  ←--[JWT Validation]--→  TopTime (Express + Prisma)
     ✅ Auth centralisée                                📋 Migration en cours
     ✅ Phase 10 complétée                              📋 94 modèles Prisma
     ✅ /auth/validate-token                            📋 TypeORM à retirer
```

---

## 🚀 Démarrage Immédiat

### Étape 1: Backup (5 min)

```bash
# TopTime
cd C:\GitHub\TopTime
git checkout -b backup-before-migration
git add .
git commit -m "Backup: Before Prisma migration"
git push -u origin backup-before-migration

git checkout main
git checkout -b feature/prisma-migration

# Backup DB
cd backend
npm run db:backup
```

### Étape 2: Migration Prisma (2h)

```bash
cd C:\GitHub\TopTime\backend

# 1. Analyser schéma
npm run migrate:generate-mapping

# 2. Convertir schéma (snake_case → PascalCase)
npm run migrate:convert-schema

# 3. Valider nouveau schéma
npx prisma validate
npx prisma generate

# 4. Convertir code TypeScript
npm run migrate:convert-code

# 5. Tester
npm run build
npm test
```

### Étape 3: Configuration Auth TopSteel (30 min)

**Fichier**: `backend/.env`

```env
# TopSteel API
TOPSTEEL_API_URL=https://api.topsteel.tech
TOPSTEEL_API_VALIDATE_TOKEN_ENDPOINT=/api/auth/validate-token

# JWT (DOIT être identique à TopSteel!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1h

# Cache
TOKEN_VALIDATION_CACHE_ENABLED=true
REDIS_URL=redis://localhost:6379
```

### Étape 4: Implémenter Middleware Auth (1h)

**Créer**: `backend/src/middleware/auth-topsteel.middleware.ts`

```typescript
import axios from 'axios';

export async function authTopSteelMiddleware(req, res, next) {
  const token = req.headers.authorization?.substring(7); // Remove 'Bearer '

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token' });
  }

  try {
    const response = await axios.post(
      `${process.env.TOPSTEEL_API_URL}${process.env.TOPSTEEL_API_VALIDATE_TOKEN_ENDPOINT}`,
      { token }
    );

    if (!response.data.valid) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    req.user = response.data.user;
    req.permissions = response.data.permissions;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Auth failed' });
  }
}
```

### Étape 5: Protéger Routes (30 min)

**Modifier**: `backend/src/routes/*.ts`

```typescript
import { authTopSteelMiddleware } from '../middleware/auth-topsteel.middleware';

const router = Router();

// Protéger toutes les routes
router.use(authTopSteelMiddleware);

router.get('/pointages', async (req, res) => {
  const userId = req.user.id; // Utilisateur authentifié
  // ...
});

export default router;
```

### Étape 6: Tester (30 min)

```bash
# 1. Démarrer TopSteel
cd C:\GitHub\TopSteel\apps\api
npm run dev

# 2. Démarrer TopTime
cd C:\GitHub\TopTime\backend
npm run dev

# 3. Tester login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# 4. Tester endpoint protégé
curl http://localhost:3000/api/pointages \
  -H "Authorization: Bearer <token>"
```

---

## 📋 Checklist Express

### Phase A - Backend (5 jours)

**Jour 1-2: Migration Prisma**
- [ ] Backup créé
- [ ] Schéma converti (94 modèles)
- [ ] Code TypeScript converti (~352 fichiers)
- [ ] TypeORM retiré
- [ ] Tests passent

**Jour 3-4: Auth TopSteel**
- [ ] Variables d'environnement configurées
- [ ] Middleware auth implémenté
- [ ] Routes protégées
- [ ] Tests d'intégration

**Jour 5: Finalisation**
- [ ] Documentation Swagger
- [ ] Logging structuré
- [ ] Tests complets

### Phase B - Android (3 jours)

**Jour 6-7: Auth Android**
- [ ] Service auth créé
- [ ] Token interceptor
- [ ] Stockage sécurisé

**Jour 8: Tests**
- [ ] Tests unitaires ViewModels
- [ ] Tests d'intégration API
- [ ] Validation workflow

---

## 🎯 Commandes Essentielles

### Backend

```bash
# Migration Prisma
npm run migrate:generate-mapping
npm run migrate:convert-schema
npm run migrate:convert-code

# Tests
npm run build
npm test
npm run test:integration

# Démarrage
npm run dev
```

### Validation

```bash
# TypeScript
npx tsc --noEmit

# Prisma
npx prisma validate
npx prisma generate

# Database (aucun changement attendu)
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma
```

---

## 🚨 Problèmes Courants

### "Module not found: @prisma/client"

```bash
npx prisma generate
npm install
```

### "Invalid token" lors des tests

Vérifier que `JWT_SECRET` est identique dans TopSteel et TopTime

### "Authentication service unavailable"

Vérifier que TopSteel API est démarrée :
```bash
curl http://localhost:4000/health  # TopSteel
```

### Tests échouent après migration Prisma

Vérifier les relations self-referential :
```bash
# Rechercher modèles avec relations parent/enfant
grep -r "FamillesArticle" backend/src/
```

---

## 📊 Métriques de Succès

| Critère | Objectif | Commande |
|---------|----------|----------|
| **TypeScript** | 0 erreurs | `npx tsc --noEmit` |
| **Tests** | 100% passent | `npm test` |
| **DB** | Aucun changement | `npx prisma migrate diff` |
| **Auth** | Endpoints protégés | Tests manuels |

---

## 🔗 Ressources

### Documentation Complète

- **Plan complet**: `C:\GitHub\TopSteel\docs\PLAN_MIGRATION_TOPTIME_INTEGRATION.md`
- **Guide intégration TopTime**: `C:\GitHub\TopSteel\docs\TOPTIME_API_INTEGRATION.md`
- **Phase 10 TopSteel**: `C:\GitHub\TopSteel\docs\PHASE_10_COMPLETION_REPORT.md`

### TopTime Existant

- **Plan Prisma**: `C:\GitHub\TopTime\PRISMA_MIGRATION_PLAN.md`
- **README**: `C:\GitHub\TopTime\README.md`

---

## 🆘 Rollback d'Urgence

Si quelque chose tourne mal :

```bash
# 1. Revenir à la branche de backup
git checkout backup-before-migration

# 2. Restaurer base de données
cd backend
psql -U postgres -d toptime < backup_*.sql

# 3. Restaurer schéma Prisma
cp prisma/schema.prisma.backup prisma/schema.prisma
npx prisma generate

# 4. Redémarrer
npm run dev
```

---

## ⏱️ Timeline Rapide

| Jour | Tâche | Durée | Validation |
|------|-------|-------|------------|
| **1** | Migration Prisma - Schéma | 3h | `npx prisma validate` |
| **2** | Migration Prisma - Code | 6h | `npm test` |
| **3** | Auth TopSteel - Setup | 4h | Tests manuels |
| **4** | Auth TopSteel - Tests | 4h | Tests d'intégration |
| **5** | Finalisation Backend | 4h | Checklist complète |
| **6-7** | Android Auth | 8h | Tests Android |
| **8** | Validation finale | 4h | Déploiement staging |

**Total**: 8 jours ouvrés

---

## ✅ Go / No-Go

**Avant de commencer, vérifier**:

- [ ] TopSteel Phase 10 complétée (endpoint /auth/validate-token existe)
- [ ] TopTime backend compile sans erreurs
- [ ] Base de données accessible
- [ ] Backup créé
- [ ] Git à jour
- [ ] Tests passent actuellement
- [ ] Redis installé (pour cache)

**Si tous les critères sont verts → GO!** 🚀

---

**Créé par**: Claude
**Date**: 2025-11-19
**Lire ensuite**: `PLAN_MIGRATION_TOPTIME_INTEGRATION.md` pour détails complets
