# ERP TOPSTEEL

Système de gestion métallurgique complet construit avec Next.js et NestJS.

## 🏗️ Architecture

Ce projet utilise une architecture monorepo avec :

- **Frontend** : Next.js 14 avec TypeScript et Tailwind CSS
- **Backend** : NestJS avec TypeORM et PostgreSQL
- **Cache** : Redis pour les sessions et queues
- **Base de données** : PostgreSQL
- **Packages partagés** : Types, UI components, utilitaires

## 📦 Structure du projet

```
erp-topsteel/
├── apps/
│   ├── web/              # Application frontend Next.js
│   └── api/              # API backend NestJS
├── packages/
│   ├── ui/               # Composants UI partagés
│   ├── types/            # Types TypeScript partagés
│   ├── utils/            # Utilitaires partagés
│   └── config/           # Configurations partagées
├── scripts/              # Scripts d'automatisation
├── turbo.json           # Configuration Turbo
└── package.json         # Configuration monorepo
```

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- pnpm 8+
- PostgreSQL 12+
- Redis 6+ (optionnel mais recommandé)

### Installation automatique

```bash
# Cloner le repository
git clone <url-du-repo>
cd erp-topsteel

# Lancer le script de configuration
chmod +x scripts/quick-start.sh
./scripts/quick-start.sh
```

### Installation manuelle

1. **Installer les dépendances**

```bash
pnpm install
```

2. **Configurer les variables d'environnement**

```bash
# API
cp apps/api/.env.example apps/api/.env.local

# Web
cp apps/web/.env.example apps/web/.env.local
```

3. **Construire les packages partagés**

```bash
pnpm build --filter="!@erp/web" --filter="!@erp/api"
```

4. **Configurer la base de données**

```bash
# Créer la base de données
createdb erp_topsteel_dev

# Lancer les migrations (quand elles seront créées)
pnpm db:migrate
```

## 🛠️ Développement

### Démarrer tous les services

```bash
pnpm dev
```

### Démarrer individuellement

```bash
# Frontend uniquement
pnpm dev:web

# API uniquement
pnpm dev:api
```

### URLs de développement

- **Frontend** : http://localhost:3000
- **API** : http://localhost:3001
- **Documentation API** : http://localhost:3001/api/docs
- **Health Check** : http://localhost:3001/health

## 🧪 Tests et qualité

```bash
# Tests
pnpm test
pnpm test:watch
pnpm test:cov

# Linting et formatage
pnpm lint
pnpm lint:fix
pnpm format

# Vérification des types
pnpm type-check
```

## 🗄️ Base de données

### Migrations

```bash
# Générer une migration
pnpm db:migrate:generate --name=NomDeLaMigration

# Lancer les migrations
pnpm db:migrate

# Annuler la dernière migration
pnpm db:migrate:revert
```

### Seeds

```bash
# Lancer les seeds
pnpm db:seed
```

## 📋 Commandes utiles

### Gestion des dépendances

```bash
# Vérifier les dépendances obsolètes
pnpm deps:outdated

# Audit de sécurité
pnpm security:audit

# Vérification complète
pnpm deps:full-check
```

### Nettoyage

```bash
# Nettoyer les caches
pnpm clean

# Reset complet (attention : supprime node_modules)
pnpm reset
```

## 🏭 Modules métier

### Backend (NestJS)

- **Auth** : Authentification JWT
- **Users** : Gestion des utilisateurs
- **Clients** : Gestion clientèle
- **Fournisseurs** : Gestion des fournisseurs
- **Projets** : Gestion des projets
- **Devis** : Système de devis
- **Facturation** : Facturation et comptabilité
- **Stocks** : Gestion des stocks
- **Production** : Planification production
- **Documents** : Gestion documentaire
- **Notifications** : Système de notifications

### Frontend (Next.js)

- **Dashboard** : Tableau de bord
- **Clients** : Interface client
- **Projets** : Gestion projets
- **Production** : Suivi production
- **Stocks** : Interface stocks
- **Facturation** : Interface facturation

## 🔧 Configuration

### Variables d'environnement API

```bash
# Application
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=erp_topsteel_dev

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Redis (optionnel)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Variables d'environnement Web

```bash
# URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Déploiement

### Production

```bash
# Build de production
pnpm build

# Démarrer en production
pnpm start
```

### Docker (à venir)

```bash
# Build de l'image
docker build -t erp-topsteel .

# Lancer avec docker-compose
docker-compose up -d
```

## 🛡️ Sécurité

- Authentification JWT avec refresh tokens
- Rate limiting sur l'API
- Validation des données avec class-validator
- Helmet.js pour les headers de sécurité
- CORS configuré

## 📚 Technologies utilisées

### Frontend

- **Next.js 14** : Framework React
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS
- **Radix UI** : Composants UI
- **React Hook Form** : Gestion des formulaires
- **Zustand** : State management
- **React Query** : Cache et synchronisation

### Backend

- **NestJS** : Framework Node.js
- **TypeORM** : ORM pour PostgreSQL
- **PostgreSQL** : Base de données
- **Redis** : Cache et queues
- **JWT** : Authentification
- **Swagger** : Documentation API
- **Winston** : Logging

### DevOps

- **Turbo** : Build system monorepo
- **pnpm** : Package manager
- **ESLint** : Linting
- **Prettier** : Formatage
- **Jest** : Tests

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/ma-fonctionnalite`)
3. Commit (`git commit -am 'Ajouter ma fonctionnalité'`)
4. Push (`git push origin feature/ma-fonctionnalite`)
5. Créer une Pull Request

## 📝 Changelog

Voir [CHANGELOG.md](CHANGELOG.md) pour l'historique des versions.

## 📄 Licence

Ce projet est sous licence privée TOPSTEEL. Tous droits réservés.

## 🆘 Support

Pour toute question ou problème :

- Créer une issue GitHub
- Contacter l'équipe de développement
- Consulter la documentation API : http://localhost:3001/api/docs

---

**ERP TOPSTEEL** - Système de gestion métallurgique moderne
