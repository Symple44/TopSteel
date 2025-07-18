# 🚀 Guide de démarrage rapide - Turborepo

## 1. Installation initiale

```bash
# À la racine du monorepo
pnpm install
pnpm build:packages
```

## 2. Démarrer le serveur backend

```bash
# Depuis la racine du monorepo (recommandé)
pnpm dev:api

# Ou depuis apps/api
pnpm start:dev

# Mode debug
pnpm dev:debug
```

## 3. Démarrer le serveur frontend

```bash
# Depuis la racine du monorepo
pnpm dev:web

# Ou pour tout démarrer ensemble
pnpm dev
```

## 4. Tester l'application

- **Frontend** : http://localhost:3000
- **Backend** : http://localhost:3002
- **Page admin** : http://localhost:3000/admin/database

## 🔧 Commandes Turborepo Standard

### Développement

```bash
# Développement API uniquement
pnpm dev:api

# Développement Web uniquement  
pnpm dev:web

# Développement complet (API + Web)
pnpm dev

# Mode debug API
pnpm turbo start:debug --filter=@erp/api
```

### Build et Production

```bash
# Build tout
pnpm build

# Build API seulement
pnpm turbo build --filter=@erp/api

# Build Web seulement
pnpm turbo build --filter=@erp/web

# Production API
NODE_ENV=production pnpm --filter=@erp/api start:prod
```

### Tests

```bash
# Tests API
pnpm turbo test --filter=@erp/api

# Tests avec couverture
pnpm turbo test:coverage --filter=@erp/api

# Tests e2e
pnpm turbo test:e2e --filter=@erp/api
```

### Base de Données

```bash
# Générer migration
pnpm --filter=@erp/api migration:generate -- CreateNewTable

# Exécuter migrations
pnpm --filter=@erp/api migration:run

# Exécuter seeds
pnpm --filter=@erp/api seed:run
```

### Nettoyage

```bash
# Nettoyer builds
pnpm clean

# Nettoyer et rebuild
pnpm turbo clean && pnpm build:packages

# Reset complet
pnpm reset
```

## 🔧 Configuration

### Variables d'Environnement

Créez `.env.local` dans `apps/api/` :

```env
NODE_ENV=development
PORT=3002

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=erp_topsteel

# JWT
JWT_SECRET=your-secret-here
JWT_EXPIRATION=1d
```

## ⚠️ Résolution des problèmes

### Port occupé
```bash
# Nettoyer les processus
pnpm --filter=@erp/api exec -- npx kill-port 3002

# Ou nettoyage global
pnpm clean
```

### Erreur de build
```bash
# Nettoyer et rebuild
pnpm turbo clean
pnpm build:packages
pnpm turbo build --filter=@erp/api
```

### Cache Turbo corrompu
```bash
# Vider cache Turbo
pnpm turbo clean

# Forcer rebuild
pnpm turbo build --filter=@erp/api --force
```

### Erreur TypeScript
```bash
# Vérifier types
pnpm turbo type-check --filter=@erp/api

# Rebuild packages
pnpm build:packages
```

## 📊 Monitoring

### Endpoints de Santé
- `GET /health` - État global
- `GET /health/db` - État de la base de données
- `GET /health/redis` - État de Redis

### Logs
```bash
# Logs détaillés
pnpm start:dev

# Logs avec filtrage
pnpm start:dev 2>&1 | grep ERROR
```

## 🔄 Workflow de Développement

1. **Setup initial** (une seule fois)
   ```bash
   pnpm install
   pnpm build:packages
   ```

2. **Développement quotidien**
   ```bash
   pnpm dev:api
   ```

3. **Avant commit**
   ```bash
   pnpm lint
   pnpm turbo test --filter=@erp/api
   pnpm turbo build --filter=@erp/api
   ```

## 📁 Structure Monorepo

```
TopSteel/
├── apps/
│   ├── api/          # API NestJS
│   └── web/          # Frontend Next.js
├── packages/
│   ├── ui/           # Composants partagés
│   ├── config/       # Configuration partagée
│   └── types/        # Types partagés
├── package.json      # Scripts racine
└── turbo.json        # Configuration Turbo
```

## ✅ Avantages Turborepo

- ✅ Cache intelligent des builds
- ✅ Exécution parallèle des tâches
- ✅ Gestion des dépendances entre packages
- ✅ Hot reload optimisé
- ✅ Scripts standardisés
- ✅ Intégration CI/CD native

---

✅ **Prêt à développer avec Turborepo !**

Pour plus d'informations : [Documentation Turborepo](https://turbo.build/repo/docs)