# 🏭 TopSteel ERP

[![CI/CD Pipeline](https://github.com/Symple44/TopSteel/workflows/🚀%20TopSteel%20CI/CD%20Pipeline/badge.svg)](https://github.com/Symple44/TopSteel/actions/workflows/ci.yml)
[![Security Scan](https://github.com/Symple44/TopSteel/workflows/🛡️%20Security%20Scanning/badge.svg)](https://github.com/Symple44/TopSteel/actions/workflows/security.yml)
[![Test Suite](https://github.com/Symple44/TopSteel/workflows/🧪%20Test%20Suite/badge.svg)](https://github.com/Symple44/TopSteel/actions/workflows/test-runner.yml)
[![CodeQL](https://github.com/Symple44/TopSteel/workflows/CodeQL%20Analysis/badge.svg)](https://github.com/Symple44/TopSteel/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/Symple44/TopSteel/branch/main/graph/badge.svg)](https://codecov.io/gh/Symple44/TopSteel)

[![Node.js Version](https://img.shields.io/badge/node-22.14.0-green)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-10.13.1-blue)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.1.6-red)](https://nestjs.com/)
[![License](https://img.shields.io/badge/license-GPL--3.0-orange)](LICENSE)

> 🔧 **Système de gestion métallurgique moderne et sécurisé**  
> ERP complet pour les entreprises de construction métallique avec marketplace intégré, développé avec Next.js 15, NestJS et PostgreSQL.

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

### 🛒 **Marketplace B2B intégré**
- Catalogue produits industriels
- Système de commandes inter-entreprises
- Gestion des paiements sécurisés
- Synchronisation des stocks en temps réel

### 📊 **Analytics et reporting**
- Tableaux de bord personnalisables
- KPIs temps réel et alertes
- Rapports automatisés multi-formats
- Export Excel/PDF natif

### 🔒 **Sécurité enterprise**
- Authentification multi-facteurs (2FA)
- Gestion des rôles et permissions (RBAC)
- Chiffrement des données sensibles
- Audit trail complet

## 🚀 Installation

### Prérequis

- Node.js 18+ et pnpm 8+
- PostgreSQL 14+
- Redis 6+ (optionnel pour cache)
- Elasticsearch 8+ (optionnel pour recherche avancée)

### Configuration

```bash
# Cloner le repository
git clone https://github.com/your-org/topsteel-erp.git
cd topsteel-erp

# Installer les dépendances
pnpm install

# Configuration environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# Initialiser la base de données
pnpm db:migrate
pnpm db:seed

# Lancer en développement
pnpm dev
```

### Accès aux services

- **Application Web** : http://localhost:3000
- **API Backend** : http://localhost:3001
- **API Marketplace** : http://localhost:3002

## 🏗️ Architecture

Le projet utilise une architecture monorepo avec Turborepo :

```
TopSteel/
├── apps/
│   ├── api/                 # Backend NestJS
│   ├── marketplace-api/      # API Marketplace
│   └── web/                 # Frontend Next.js
├── packages/
│   ├── api-client/          # Client API TypeScript
│   ├── config/              # Configuration partagée
│   ├── domains/             # Logique métier
│   ├── types/               # Types TypeScript
│   ├── ui/                  # Composants UI
│   └── utils/               # Utilitaires
└── docs/                    # Documentation
```

## 📚 Documentation

- [Architecture Technique](./docs/ARCHITECTURE.md)
- [Documentation API](./docs/API.md)
- [Guide de Déploiement](./docs/deployment/)
- [Monitoring](./docs/MONITORING.md)

## 🛠️ Scripts

```bash
# Développement
pnpm dev              # Démarrer tous les services
pnpm dev:api          # API seulement
pnpm dev:web          # Frontend seulement

# Build & Production
pnpm build            # Build complet
pnpm start            # Démarrer en production

# Tests & Qualité
pnpm test             # Tests unitaires
pnpm lint             # Linting
pnpm typecheck        # Vérification types

# Base de données
pnpm db:migrate       # Migrations
pnpm db:seed          # Données de test
```

## 📋 Roadmap

### Phase 1 - Core ✅
- Architecture de base
- Modules essentiels
- Interface utilisateur
- API REST

### Phase 2 - Optimisation 🚧
- Tests automatisés
- Performance tuning
- Documentation complète

### Phase 3 - Expansion 📅
- Application mobile
- Intelligence artificielle
- Blockchain pour traçabilité

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez notre [guide de contribution](CONTRIBUTING.md) pour plus d'informations.

## 📄 Licence

Copyright © 2025 TopSteel SAS. Tous droits réservés.

Ce logiciel est sous licence GPL-3.0. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**TopSteel ERP** - L'excellence dans la gestion métallurgique