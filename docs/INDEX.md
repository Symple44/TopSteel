# 📚 Documentation TopSteel ERP

> **Plateforme ERP complète pour l'industrie métallurgique avec marketplace intégré**  
> **Version 2.0.0** | Mise à jour : 14/08/2025

## 🎯 Navigation Rapide

### [🤖 Guide Claude - Authentification](./CLAUDE_AUTH_GUIDE.md) 🆕
Guide spécifique pour Claude AI - Génération de tokens et tests API rapides.

### [📊 État du Système](./SYSTEM_STATUS.md)
Vue d'ensemble complète de l'état actuel, métriques et statuts des modules.

### [🚀 Démarrage Rapide](./development/getting-started.md)
Guide pour démarrer rapidement avec le développement TopSteel.

## 📖 Documentation Complète

### 🏗️ Architecture
- [Architecture Multi-Tenant](./architecture/multi-tenant.md) - **1500+ lignes** - Architecture complète multi-locataire
- [Architecture Technique](./architecture/technical-overview.md) - **900+ lignes** - Stack et patterns
- [Architecture Base de Données](./architecture/database-design.md) - Schémas et modèles *(à créer)*
- [Architecture Sécurité](./architecture/security.md) - Sécurité et authentification *(à créer)*

### 🚀 Déploiement
- [Guide de Déploiement](./deployment/guide.md) - **500+ lignes** - Guide complet production
- [Plan de Rollback](./deployment/rollback-plan.md) - **400+ lignes** - Stratégie de retour arrière
- [Configuration Docker](./deployment/docker.md) - Dockerfiles et compose *(à créer)*
- [Checklist Production](./deployment/production-checklist.md) - Vérifications avant mise en prod *(à créer)*
- [Monitoring & Alertes](./deployment/monitoring.md) - Surveillance et métriques *(à créer)*

### 📦 Modules Métier
- [Module Marketplace](./modules/marketplace.md) - **400+ lignes** - E-commerce multi-tenant
- [Système de Tarification](./modules/pricing.md) - **600+ lignes** - Pricing avancé avec ML
- [Module Recherche](./modules/search.md) - **300+ lignes** - ElasticSearch et recherche avancée
- [Gestion des Stocks](./modules/inventory.md) - Inventaire et mouvements *(à créer)*
- [Module Partenaires](./modules/partners.md) - Clients et fournisseurs *(à créer)*
- [Module Production](./modules/production.md) - Ordres de fabrication *(à créer)*

### 💻 Développement
- [Getting Started](./development/getting-started.md) - **500+ lignes** - Guide de démarrage complet
- [Guide de Test d'Authentification](./development/AUTH_TEST_GUIDE.md) - **400+ lignes** - 🔐 Tests auth & génération tokens
- [Scripts de Base de Données](./development/database-seeding.md) - **400+ lignes** - Injection et seeding
- [Scripts Utilitaires](./development/scripts.md) - **300+ lignes** - Scripts d'automatisation
- [Fix Node Deprecation](./development/node-deprecation-fix.md) - **200+ lignes** - Résolution warnings Node.js
- [Configuration Environnement](./development/environment-setup.md) - Setup local *(à créer)*
- [Standards de Code](./development/coding-standards.md) - Conventions et bonnes pratiques *(à créer)*
- [Guide des Tests](./development/testing.md) - Tests unitaires et E2E *(à créer)*

### 🔌 API
- [Authentification](./api/authentication.md) - **600+ lignes** - JWT, sessions et sécurité
- [Vue d'ensemble API](./api/overview.md) - Architecture REST *(à créer)*
- [Endpoints REST](./api/endpoints.md) - Documentation complète *(à créer)*
- [WebSocket Events](./api/websocket.md) - Événements temps réel *(à créer)*
- [GraphQL Schema](./api/graphql.md) - Schema et resolvers *(à créer)*

### ⚙️ Configuration
- [Variables d'Environnement](./configuration/environment.md) - .env complet *(à créer)*
- [Configuration Bases de Données](./configuration/database.md) - PostgreSQL multi-base *(à créer)*
- [Configuration Redis](./configuration/redis.md) - Cache et sessions *(à créer)*
- [Configuration ElasticSearch](./configuration/elasticsearch.md) - Recherche avancée *(à créer)*

### 🔧 Maintenance
- [Backup & Restore](./maintenance/backup.md) - Sauvegarde et restauration *(à créer)*
- [Guide des Migrations](./maintenance/migrations.md) - TypeORM migrations *(à créer)*
- [Troubleshooting](./maintenance/troubleshooting.md) - Résolution de problèmes *(à créer)*
- [Optimisation Performance](./maintenance/performance.md) - Tuning et optimisations *(à créer)*

## 📊 État de la documentation

### Documents récemment organisés

| Document Original | Nouveau Chemin | État |
|------------------|----------------|------|
| `NODE_DEPRECATION_FIX.md` | `docs/development/node-deprecation-fix.md` | ✅ Migré |
| `ROLLBACK_PLAN.md` | `docs/deployment/rollback-plan.md` | ✅ Migré |
| `ROADMAP_V2.md` | `docs/planning/roadmap-v2.md` | ✅ Migré |
| `ERP_INTEGRATION_README.md` | `docs/marketplace/erp-integration.md` | ✅ Migré |
| `DEPRECATED_ENTITIES.md` | `docs/marketplace/deprecated-entities.md` | ✅ Migré |

### Documents techniques à consolider

| Source | Destination | Contenu |
|--------|------------|---------|
| `PRICING_FINAL_STATUS.md` | `docs/modules/pricing.md` | État et validation |
| `PRICING_INTEGRATION_REPORT.md` | `docs/modules/pricing.md` | Rapport d'intégration |
| `AUTHENTICATION-FIXES-SUMMARY.md` | `docs/api/authentication.md` | Corrections appliquées |
| `SYSTEM_OPERATIONAL_REPORT.md` | `docs/deployment/monitoring.md` | État opérationnel |
| `IMPLEMENTATION_NOTES.md` | `docs/development/notes.md` | Notes d'implémentation |
| `ARCHITECTURE-ENTITIES.md` | `docs/architecture/database-design.md` | Modèle entités |

### Statistiques documentation

- **Total lignes documentées** : ~6000+ lignes
- **Modules documentés** : 11/15 (73%)
- **Guides complets** : 9
- **À créer** : 20 documents
- **Récemment migrés** : 5 documents

## 🎯 Priorités documentation

### Haute priorité
1. ⚡ Guide Getting Started complet
2. ⚡ Documentation API REST
3. ⚡ Configuration environnement
4. ⚡ Guide authentification

### Moyenne priorité
1. 📌 Module Inventory
2. 📌 Module Partners
3. 📌 Backup & Restore
4. 📌 Troubleshooting

### Basse priorité
1. 📋 GraphQL Schema
2. 📋 Performance tuning avancé
3. 📋 Scripts d'automatisation

## 🔍 Recherche rapide

### Par technologie
- **NestJS** : [Architecture](./architecture/technical-overview.md), [API](./api/overview.md)
- **Next.js** : [Frontend](./architecture/technical-overview.md), [Marketplace](./modules/marketplace.md)
- **PostgreSQL** : [Multi-tenant](./architecture/multi-tenant.md), [Database](./configuration/database.md)
- **Redis** : [Cache](./configuration/redis.md), [Sessions](./api/authentication.md)
- **Docker** : [Deployment](./deployment/guide.md), [Docker Config](./deployment/docker.md)
- **TypeORM** : [Migrations](./maintenance/migrations.md), [Entities](./architecture/database-design.md)

### Par fonctionnalité
- **Multi-tenant** : [Architecture](./architecture/multi-tenant.md)
- **Authentification** : [JWT](./api/authentication.md), [Security](./architecture/security.md)
- **Tarification** : [Pricing Module](./modules/pricing.md)
- **E-commerce** : [Marketplace](./modules/marketplace.md)
- **Recherche** : [Search Module](./modules/search.md), [ElasticSearch](./configuration/elasticsearch.md)

### Par rôle
- **Développeur** : [Getting Started](./development/getting-started.md), [Coding Standards](./development/coding-standards.md)
- **DevOps** : [Deployment](./deployment/guide.md), [Monitoring](./deployment/monitoring.md)
- **Architecte** : [Architecture](./architecture/technical-overview.md), [Multi-tenant](./architecture/multi-tenant.md)
- **DBA** : [Database](./architecture/database-design.md), [Migrations](./maintenance/migrations.md)

## 📝 Convention de documentation

### Structure d'un document

```markdown
# Titre du Module

## Table des matières
- Vue d'ensemble
- Architecture
- Configuration
- Installation
- Utilisation
- API
- Troubleshooting
- Support

## Vue d'ensemble
Description courte et claire

## Architecture
Diagrammes et explications techniques

## Configuration
Variables d'environnement et paramètres

## [...]
```

### Standards
- **Langue** : Français pour la doc métier, Anglais pour le code
- **Format** : Markdown avec support Mermaid
- **Code** : Exemples TypeScript commentés
- **Longueur** : Min 200 lignes pour un guide complet
- **Mise à jour** : Versionner avec date de dernière modification

## 🤝 Contribution

Pour contribuer à la documentation :
1. Créer une branche `docs/feature-name`
2. Suivre les conventions établies
3. Inclure des exemples de code
4. Mettre à jour cet index
5. Pull request avec description

## 📞 Support

- **Documentation** : docs@topsteel.fr
- **Technique** : support@topsteel.fr
- **GitHub** : [Issues](https://github.com/topsteel/erp-topsteel/issues)
- **Slack** : #topsteel-docs

---

*Dernière mise à jour : Janvier 2025*
*Version : 1.0.0*