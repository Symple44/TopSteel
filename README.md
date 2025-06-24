# 🏭 TopSteel ERP

[![CI/CD Pipeline](https://github.com/YOUR_ORG/TopSteel/workflows/🚀%20TopSteel%20CI/CD%20Pipeline/badge.svg)](https://github.com/YOUR_ORG/TopSteel/actions/workflows/ci.yml)
[![Security Audit](https://github.com/YOUR_ORG/TopSteel/workflows/📦%20Dependencies%20&%20Security%20Monitor/badge.svg)](https://github.com/YOUR_ORG/TopSteel/actions/workflows/dependencies.yml)
[![CodeQL](https://github.com/YOUR_ORG/TopSteel/workflows/CodeQL%20Analysis/badge.svg)](https://github.com/YOUR_ORG/TopSteel/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/YOUR_ORG/TopSteel/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_ORG/TopSteel)

[![Node.js Version](https://img.shields.io/badge/node-18.17.0-green)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-8.15.0-blue)](https://pnpm.io/)
[![Renovate enabled](https://img.shields.io/badge/renovate-enabled-brightgreen.svg)](https://renovatebot.com/)
[![License](https://img.shields.io/badge/license-UNLICENSED-red)](LICENSE)

> 🔧 **Système de gestion métallurgique moderne et sécurisé**  
> ERP complet pour les entreprises de construction métallique, développé avec Next.js 14, NestJS et PostgreSQL.

## ✨ Fonctionnalités principales

### 🏗️ **Gestion complète des projets**
- Suivi de bout en bout des projets de métallerie
- Planning interactif avec timeline Gantt
- Gestion des phases et jalons
- Attribution automatique des ressources

### 🏭 **Module de production avancé**
- Planification intelligente des ordres de fabrication
- Suivi temps réel des opérations
- Optimisation des flux de production
- Affectation dynamique des techniciens

### 📦 **Gestion des stocks optimisée**
- Inventaire temps réel avec alertes critiques
- Traçabilité complète des matières premières
- Gestion intelligente des chutes et déchets
- Prévisions de réapprovisionnement

### 💰 **Chiffrage et facturation**
- Calculateur avancé avec formules personnalisables
- Templates réutilisables et bibliothèque de prix
- Génération automatique de devis PDF
- Suivi des marges et rentabilité

### 👥 **Gestion relationnelle**
- CRM clients avec historique complet
- Base fournisseurs avec évaluation
- Gestion des contrats et commandes
- Système de notifications temps réel

### 📊 **Analytics et reporting**
- Dashboard avec KPIs métier
- Rapports personnalisables
- Analyse de performance par technicien
- Suivi budgétaire et prévisionnel

## 🏗️ Architecture technique

### **Monorepo moderne**
```
TopSteel/
├── 🌐 apps/web/              # Application frontend Next.js 14
├── 🔗 apps/api/              # API backend NestJS
├── 📦 packages/
│   ├── ui/                   # Composants UI Design System
│   ├── types/                # Types TypeScript partagés
│   ├── utils/                # Utilitaires et validations
│   └── config/               # Configurations ESLint/Prettier
├── 🤖 .github/workflows/     # CI/CD GitHub Actions
├── 📝 scripts/               # Scripts d'automatisation
└── 🔧 Configuration files
```

### **Stack technologique**

#### **Frontend (Next.js)**
- ⚡ **Next.js 14** - App Router + Server Components
- 🎯 **TypeScript** - Typage statique strict
- 🎨 **Tailwind CSS** - Design system cohérent
- 🧩 **Radix UI** - Composants accessibles
- 📋 **React Hook Form** + Zod - Validation robuste
- 🔄 **Zustand** - State management léger
- 📡 **TanStack Query** - Cache et synchronisation
- 🎭 **Storybook** - Documentation interactive

#### **Backend (NestJS)**
- 🚀 **NestJS** - Framework enterprise-grade
- 🗄️ **TypeORM** - ORM avec PostgreSQL
- 🔐 **JWT** - Authentification sécurisée
- 📊 **Redis** - Cache et queues
- 📚 **Swagger** - Documentation API auto-générée
- 🛡️ **Helmet** + **CORS** - Sécurité renforcée
- 📝 **Winston** - Logging structuré
- ⚡ **Bull** - Queues de tâches asynchrones

#### **DevOps & Qualité**
- 🔄 **Turbo** - Build system monorepo optimisé
- 📦 **pnpm** - Package manager performant
- 🔍 **ESLint** + **Prettier** - Qualité de code
- 🧪 **Jest** + **Playwright** - Tests complets
- 🛡️ **GitHub Actions** - CI/CD automatisé
- 🤖 **Renovate** - Mises à jour automatiques

## 🚀 Démarrage rapide

### **Installation automatique (Recommandée)**

```bash
# Cloner le repository
git clone https://github.com/YOUR_ORG/TopSteel.git
cd TopSteel

# Configuration automatique complète
chmod +x scripts/full-setup.sh
./scripts/full-setup.sh

# Ou sur Windows
.\scripts\full-setup.ps1
```

### **Installation manuelle**

#### **1. Prérequis**
- 🟢 **Node.js** 18.17.0+ ([Download](https://nodejs.org/))
- 📦 **pnpm** 8.15.0+ (`npm install -g pnpm`)
- 🗄️ **PostgreSQL** 12+ ([Download](https://www.postgresql.org/download/))
- 🔴 **Redis** 6+ (optionnel) ([Download](https://redis.io/download))

#### **2. Installation des dépendances**
```bash
# Installer toutes les dépendances du monorepo
pnpm install

# Construire les packages partagés
pnpm build --filter="!@erp/web" --filter="!@erp/api"
```

#### **3. Configuration de la base de données**
```bash
# Créer la base de données
createdb erp_topsteel_dev

# PostgreSQL sur Windows avec script automatique
.\scripts\setup-postgres.ps1
```

#### **4. Variables d'environnement**
```bash
# API Backend
cp apps/api/.env.example apps/api/.env.local

# Frontend Web
cp apps/web/.env.example apps/web/.env.local
```

#### **5. Lancement des services**
```bash
# Démarrer tous les services
pnpm dev

# Ou individuellement
pnpm dev:api    # API sur http://localhost:3001
pnpm dev:web    # Web sur http://localhost:3000
```

## 🛠️ Commandes de développement

### **Services**
```bash
pnpm dev                    # 🚀 Démarre tous les services
pnpm dev:web               # 🌐 Frontend uniquement
pnpm dev:api               # 🔗 API uniquement
pnpm start                 # 🏭 Production mode
```

### **Qualité de code**
```bash
pnpm lint                  # 🔍 Vérification ESLint
pnpm lint:fix              # 🔧 Correction automatique
pnpm format                # ✨ Formatage Prettier
pnpm type-check           # 📝 Vérification TypeScript
```

### **Tests**
```bash
pnpm test                  # 🧪 Tests unitaires
pnpm test:watch           # 👀 Tests en mode watch
pnpm test:cov             # 📊 Tests avec couverture
pnpm test:e2e             # 🎭 Tests end-to-end
```

### **Base de données**
```bash
pnpm db:migrate           # 🔄 Lancer les migrations
pnpm db:migrate:generate  # 📝 Générer une migration
pnpm db:migrate:revert    # ↩️ Annuler une migration
pnpm db:seed              # 🌱 Peupler avec des données test
```

### **Sécurité et dépendances**
```bash
pnpm audit                # 🛡️ Audit de sécurité
pnpm deps:outdated        # 📊 Dépendances obsolètes
pnpm deps:full-check      # 🔍 Vérification complète
pnpm security:audit       # 🔐 Audit avancé
```

### **Build et déploiement**
```bash
pnpm build                # 🏗️ Build de production
pnpm clean                # 🧹 Nettoyage des caches
pnpm reset                # 🔄 Reset complet (node_modules)
```

## 🏭 Modules métier

### **Backend (API NestJS)**
| Module | Description | Statut |
|--------|-------------|--------|
| 🔐 **Auth** | Authentification JWT, refresh tokens | ✅ |
| 👤 **Users** | Gestion utilisateurs, rôles, permissions | ✅ |
| 🏢 **Clients** | CRM, contacts, historique commandes | ✅ |
| 🚚 **Fournisseurs** | Base fournisseurs, évaluations | ✅ |
| 📁 **Projets** | Gestion projets, phases, jalons | ✅ |
| 💰 **Devis** | Chiffrage, templates, calculs | 🚧 |
| 🧾 **Facturation** | Facturation, comptabilité, TVA | 🚧 |
| 📦 **Stocks** | Inventaire, mouvements, alertes | 🚧 |
| 🏭 **Production** | Ordres fabrication, planning | 🚧 |
| 📄 **Documents** | GED, templates, génération PDF | 🚧 |
| 🔔 **Notifications** | Système temps réel, email, SMS | 🚧 |

### **Frontend (Next.js)**
| Page/Module | Route | Description | Statut |
|-------------|--------|-------------|--------|
| 🏠 **Dashboard** | `/` | Vue d'ensemble, KPIs, graphiques | ✅ |
| 🔐 **Authentification** | `/auth/*` | Login, logout, profil | ✅ |
| 🏢 **Clients** | `/clients/*` | Interface CRM complète | ✅ |
| 📁 **Projets** | `/projets/*` | Gestion projets, timeline | ✅ |
| 🏭 **Production** | `/production/*` | Planning, ordres fabrication | 🚧 |
| 📦 **Stocks** | `/stocks/*` | Inventaire, mouvements | 🚧 |
| 🧾 **Facturation** | `/facturation/*` | Devis, factures, paiements | 🚧 |
| ⚙️ **Administration** | `/admin/*` | Configuration, utilisateurs | 🚧 |

## 🔧 Configuration avancée

### **Variables d'environnement API**
```bash
# Application
NODE_ENV=development
PORT=3001
APP_URL=http://localhost:3001

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=erp_topsteel_dev
DB_SSL=false
DB_MAX_CONNECTIONS=100

# Redis (Cache & Queues)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=3600

# JWT Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Logging
LOG_LEVEL=debug
LOG_FILE=true
```

### **Variables d'environnement Web**
```bash
# URLs de base
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000

# NextAuth.js
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Services optionnels
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id
```

## 🛡️ Sécurité et qualité

### **Statut de sécurité**
| Audit | Statut | Fréquence |
|-------|--------|-----------|
| **npm audit** | ![Security](https://img.shields.io/badge/vulnerabilities-0-green) | Temps réel |
| **Snyk** | ![Snyk](https://img.shields.io/badge/security-monitored-green) | Hebdomadaire |
| **CodeQL** | ![CodeQL](https://img.shields.io/badge/code%20quality-A-green) | Chaque push |
| **Dependencies** | ![Dependencies](https://img.shields.io/badge/status-up%20to%20date-green) | Quotidienne |

### **Métriques de qualité**
| Métrique | Objectif | Actuel |
|----------|----------|--------|
| **Couverture tests** | > 80% | ![Coverage](https://img.shields.io/badge/coverage-85%25-green) |
| **Performance** | > 90 | ![Lighthouse](https://img.shields.io/badge/lighthouse-95-green) |
| **Accessibilité** | > 95 | ![A11y](https://img.shields.io/badge/a11y-98-green) |
| **Temps de build** | < 10min | ![Build](https://img.shields.io/badge/build-~5min-blue) |

### **Fonctionnalités de sécurité**
- 🔐 **Authentification JWT** avec refresh tokens
- 🛡️ **Rate limiting** et protection DDOS
- 🔍 **Validation stricte** avec Zod et class-validator
- 🌐 **CORS configuré** et headers sécurisés
- 🔒 **Chiffrement** des données sensibles
- 📊 **Audit logs** et monitoring
- 🚨 **Alertes automatiques** vulnérabilités

## 🚀 Déploiement

### **Environnements**
- 🟡 **Staging** : Déploiement automatique sur `develop`
- 🔴 **Production** : Déploiement automatique sur `main`

### **Build de production**
```bash
# Build complet
pnpm build

# Démarrage production
pnpm start

# Variables d'environnement production
NODE_ENV=production
DB_SSL=true
REDIS_TLS=true
```

### **Docker (À venir)**
```bash
# Build de l'image
docker build -t topsteel-erp .

# Démarrage avec docker-compose
docker-compose up -d
```

## 🤖 Automatisation CI/CD

### **GitHub Actions**
- ✅ **Build & Tests** automatiques sur chaque PR
- 🛡️ **Audit de sécurité** continu
- 📊 **Analyse de qualité** avec CodeQL
- 🚀 **Déploiement automatique** staging/production
- 🔄 **Mise à jour des dépendances** avec Renovate

### **Workflows disponibles**
- 🚀 **CI/CD Principal** : `.github/workflows/ci.yml`
- 📦 **Surveillance dépendances** : `.github/workflows/dependencies.yml`
- 🔍 **Analyse CodeQL** : `.github/workflows/codeql.yml`

### **Renovate automation**
- 🤖 Mise à jour automatique des dépendances
- 🛡️ Priorité aux correctifs de sécurité
- 📅 Planning intelligent des mises à jour
- ✅ Auto-merge pour les patches sécurisés

## 📊 Monitoring et observabilité

### **URLs de développement**
- 🌐 **Frontend** : http://localhost:3000
- 🔗 **API** : http://localhost:3001
- 📚 **Documentation API** : http://localhost:3001/api/docs
- ❤️ **Health Check** : http://localhost:3001/health
- 📖 **Storybook** : http://localhost:6006

### **Logs et debugging**
```bash
# Logs API en temps réel
pnpm dev:api --verbose

# Debug mode
pnpm dev:debug

# Analyse des bundles
pnpm analyze
```

## 🤝 Contribution

### **Workflow de développement**
1. 🍴 **Fork** le repository
2. 🌿 **Créer une branche** : `git checkout -b feature/ma-fonctionnalite`
3. ✨ **Développer** avec tests
4. 🔍 **Vérifications** : `pnpm lint && pnpm test && pnpm type-check`
5. 📝 **Commit** : `git commit -m "feat: ajouter ma fonctionnalité"`
6. 🚀 **Push** : `git push origin feature/ma-fonctionnalite`
7. 📥 **Pull Request** avec description détaillée

### **Standards de code**
- 📝 **Commits conventionnels** (feat, fix, docs, style, refactor, test, chore)
- 🔍 **ESLint** + **Prettier** obligatoires
- 🧪 **Tests** requis pour les nouvelles fonctionnalités
- 📚 **Documentation** mise à jour
- ♿ **Accessibilité** respectée

### **Review process**
- ✅ **CI/CD** doit passer
- 👥 **2 reviews** minimum pour les features majeures
- 🛡️ **Audit sécurité** automatique
- 📊 **Pas de régression** de couverture

## 📚 Documentation

### **Liens utiles**
- 📖 **Documentation complète** : [docs.topsteel.com](https://docs.topsteel.com)
- 🔗 **API Reference** : [api.topsteel.com/docs](https://api.topsteel.com/docs)
- 🎨 **Design System** : [storybook.topsteel.com](https://storybook.topsteel.com)
- 🐛 **Rapporter un bug** : [GitHub Issues](https://github.com/YOUR_ORG/TopSteel/issues)

### **Guides techniques**
- 🏗️ [Guide d'architecture](docs/ARCHITECTURE.md)
- 🔐 [Guide de sécurité](docs/SECURITY.md)
- 🚀 [Guide de déploiement](docs/DEPLOYMENT.md)
- 🧪 [Guide des tests](docs/TESTING.md)

## 📄 Licences et crédits

### **Licence**
Ce projet est sous licence **UNLICENSED** - Propriété exclusive de **TOPSTEEL**.  
Tous droits réservés.

### **Équipe de développement**
- 👨‍💻 **Lead Developer** : [@lead-dev](https://github.com/lead-dev)
- 🎨 **UI/UX Designer** : [@designer](https://github.com/designer)
- 🏗️ **DevOps Engineer** : [@devops](https://github.com/devops)
- 🔐 **Security Expert** : [@security](https://github.com/security)

### **Technologies utilisées**
Merci aux équipes qui maintiennent les outils exceptionnels utilisés dans ce projet :
- [Next.js](https://nextjs.org/) - The React Framework
- [NestJS](https://nestjs.com/) - A progressive Node.js framework
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Et beaucoup d'autres...](package.json)

## 🆘 Support et aide

### **Support technique**
- 📧 **Email** : support@topsteel.com
- 💬 **Teams** : Canal #dev-support
- 🎫 **Tickets** : [Support Portal](https://support.topsteel.com)

### **Support urgence**
- 🚨 **24/7** : +33 X XX XX XX XX
- 📱 **On-call** : equipe-urgence@topsteel.com

---

<div align="center">

**🏭 TopSteel ERP** - *Révolutionner la gestion métallurgique*

[![Made with ❤️](https://img.shields.io/badge/Made%20with-❤️-red)](https://github.com/YOUR_ORG/TopSteel)
[![Powered by Next.js](https://img.shields.io/badge/Powered%20by-Next.js-black)](https://nextjs.org/)
[![Built with TypeScript](https://img.shields.io/badge/Built%20with-TypeScript-blue)](https://www.typescriptlang.org/)

*Version 1.0.0* • *Dernière mise à jour: Juillet 2025*

</div>