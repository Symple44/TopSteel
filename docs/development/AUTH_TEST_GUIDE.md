# 🔐 Guide de Test d'Authentification - TopSteel ERP

## 🎯 Objectif
Ce guide explique comment tester l'authentification et les APIs protégées de TopSteel ERP.

## ⚡ Démarrage Rapide

### Générer un Token de Test (30 secondes)

```bash
cd D:/GitHub/TopSteel/apps/api
npx ts-node src/scripts/generate-test-token.ts
```

**Résultat :**
```
🔑 Token de test généré avec succès!
Token: eyJhbGciOiJIUzI1NiIs...
Société: TopSteel SA (73416fa9-f693-42f6-99d3-7c919cefe4d5)
Rôle: admin
Validité: 24h
```

## 📋 Processus d'Authentification Complet

### Architecture Multi-Tenant

```
Utilisateur → Login → Liste des Sociétés → Sélection → Token avec Contexte
```

### Étape 1: Login Initial

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "login": "admin@topsteel.com",
  "password": "Admin123!@#"
}
```

**Response:**
```json
{
  "user": {
    "id": "831e0019-6fad-4786-9b3e-587ed8420573",
    "email": "admin@topsteel.com",
    "role": "SUPER_ADMIN"
  },
  "societes": [
    {
      "id": "73416fa9-f693-42f6-99d3-7c919cefe4d5",
      "nom": "TopSteel",
      "code": "TOPSTEEL",
      "role": "SUPER_ADMIN",
      "isDefault": true
    }
  ],
  "requiresSocieteSelection": true,
  "accessToken": "temporary-token..."
}
```

### Étape 2: Sélection de Société

**Endpoint:** `POST /auth/login-societe/{societeId}`

**Headers:**
```
Authorization: Bearer {temporary-token}
```

**Response:**
```json
{
  "user": {
    "email": "admin@topsteel.com",
    "societe": {
      "id": "73416fa9-f693-42f6-99d3-7c919cefe4d5",
      "nom": "TopSteel",
      "code": "TOPSTEEL"
    }
  },
  "tokens": {
    "accessToken": "final-jwt-token...",
    "expiresIn": 86400
  }
}
```

## 🧪 Scripts de Test Disponibles

| Script | Description | Commande |
|--------|-------------|----------|
| **generate-test-token.ts** | Génère un token JWT sans login | `npx ts-node src/scripts/generate-test-token.ts` |
| **test-realistic-auth.ts** | Test multi-tenant avec 3 sociétés | `npx ts-node src/scripts/test-realistic-auth.ts` |
| **test-multi-tenant-login.ts** | Simule le login 2 étapes | `npx ts-node src/scripts/test-multi-tenant-login.ts` |
| **verify-token-societe.ts** | Vérifie l'isolation des données | `npx ts-node src/scripts/verify-token-societe.ts` |
| **test-login-simulation.ts** | Simule les réponses API | `npx ts-node src/scripts/test-login-simulation.ts` |

## 🔧 Utilisation Programmatique

### Avec le Helper

```typescript
import { TestAuthHelper } from './utils/test-auth-helper'

// Initialiser
TestAuthHelper.initialize()

// Générer un token
const token = TestAuthHelper.generateTestToken({
  email: 'admin@topsteel.com',
  societeId: '73416fa9-f693-42f6-99d3-7c919cefe4d5',
  role: 'admin',
  permissions: ['*']
})

// Utiliser avec axios
const response = await axios.get('http://localhost:3002/api/articles', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Token Personnalisé

```typescript
const customToken = TestAuthHelper.generateTestToken({
  userId: 'custom-user-id',
  email: 'custom@email.com',
  societeId: '73416fa9-f693-42f6-99d3-7c919cefe4d5',
  role: 'viewer',
  permissions: ['read'],
  expiresIn: '1h'
})
```

## 📊 Données de Référence

### Société TopSteel

| Propriété | Valeur |
|-----------|--------|
| **ID** | `73416fa9-f693-42f6-99d3-7c919cefe4d5` |
| **Code** | `TOPSTEEL` |
| **Nom** | `TopSteel` |
| **Base de données** | `erp_topsteel_topsteel` |
| **Plan** | `ENTERPRISE` |
| **Status** | `ACTIVE` |

### Structure du Token JWT

```json
{
  "sub": "user-id",                                      // ID utilisateur
  "email": "admin@topsteel.com",                        // Email
  "societeId": "73416fa9-f693-42f6-99d3-7c919cefe4d5", // ⚠️ CRITIQUE: Détermine l'accès
  "societeCode": "TOPSTEEL",                            // Code société
  "societeName": "TopSteel SA",                         // Nom société
  "role": "admin",                                      // Rôle dans cette société
  "permissions": ["*"],                                 // Permissions
  "isTest": true,                                       // Marqueur de test
  "iat": 1755337274,                                   // Issued at
  "exp": 1755423674                                    // Expiration
}
```

## 🚨 Points Critiques

1. **societeId est OBLIGATOIRE** - Sans lui, l'API rejette la requête
2. **Multi-Tenant** - Chaque token ne donne accès qu'aux données de SA société
3. **Isolation Totale** - Impossible d'accéder aux données d'une autre société
4. **Token Temporaire** - Le premier token n'est valide que pour sélectionner une société

## 🛠️ Commandes Utiles

### Test Rapide d'une API

```bash
# Générer token et tester
TOKEN=$(npx ts-node src/scripts/generate-test-token.ts --silent)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/articles
```

### Vérifier la Société en Base

```sql
PGPASSWORD=postgres psql -U postgres -d erp_topsteel_auth -c "
  SELECT id, code, nom, status, plan 
  FROM societes 
  WHERE code = 'TOPSTEEL'
"
```

### Démarrer l'API

```bash
cd D:/GitHub/TopSteel/apps/api
PORT=3002 pnpm dev
```

## ❓ FAQ

**Q: Pourquoi mon token est rejeté ?**
- Vérifier que l'API est démarrée
- Vérifier le format : `Bearer TOKEN` (avec espace)
- Régénérer un nouveau token

**Q: Comment tester avec une autre société ?**
- Actuellement, seule TopSteel existe en base
- Pour ajouter une société, utiliser les scripts de migration

**Q: Le token expire quand ?**
- Par défaut : 24 heures
- Configurable via `expiresIn` dans le helper

## 📚 Ressources

- **CLAUDE.md** - Guide complet pour Claude AI
- **scripts/utils/** - Helpers et générateurs
- **.env.example** - Variables d'environnement

---

*Dernière mise à jour : 16/08/2025*
*Pour Claude : Utilise `generate-test-token.ts` pour obtenir un token rapidement*