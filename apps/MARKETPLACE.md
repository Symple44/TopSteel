# 🛒 Marketplace TopSteel

## Vue d'ensemble

Le marketplace TopSteel est une solution e-commerce multi-tenant intégrée à l'ERP principal. Il permet à chaque société (tenant) d'avoir sa propre boutique en ligne avec gestion des produits, clients et commandes.

## Architecture

### 🔧 Backend (marketplace-api)
- **Framework** : NestJS avec TypeORM
- **Base de données** : PostgreSQL (`erp_topsteel_marketplace`)
- **Port** : 3004
- **Documentation API** : http://localhost:3004/api/docs

### 🎨 Frontend (marketplace-storefront)
- **Framework** : Next.js 15 avec App Router
- **État** : Zustand pour le panier
- **UI** : Tailwind CSS + Radix UI
- **Port** : 3007

## Configuration

### Variables d'environnement

Toutes les variables sont centralisées dans `/.env.local` à la racine :

```env
# Ports
MARKETPLACE_API_PORT=3004
MARKETPLACE_WEB_PORT=3007

# Base de données
MARKETPLACE_DB_NAME=erp_topsteel_marketplace

# URLs publiques
NEXT_PUBLIC_MARKETPLACE_API_URL=http://127.0.0.1:3004/api
NEXT_PUBLIC_MARKETPLACE_URL=http://127.0.0.1:3007
NEXT_PUBLIC_DEFAULT_TENANT=TOPSTEEL
```

## Démarrage

### Prérequis
1. PostgreSQL en cours d'exécution
2. Base de données `erp_topsteel_marketplace` créée
3. Société avec marketplace activée dans `erp_topsteel_auth`

### Commandes

```bash
# Depuis la racine du projet

# Démarrer uniquement le marketplace
pnpm dev:marketplace

# Démarrer tout le projet (ERP + Marketplace)
pnpm dev:all

# Build du marketplace
pnpm build --filter='@erp/marketplace-*'
```

## Fonctionnalités

### 🛍️ Storefront
- Catalogue produits avec filtres et recherche
- Panier persistant (localStorage + Zustand)
- Checkout complet (invité ou compte)
- Gestion compte client
- Multi-thème par tenant

### 🔧 Administration
- Gestion des produits synchronisés avec l'ERP
- Configuration des prix et règles promotionnelles
- Gestion des commandes
- Personnalisation du thème

### 🔒 Multi-tenant
- Isolation des données par société
- Configuration marketplace par tenant
- Thème personnalisable par tenant
- Domaine personnalisé (optionnel)

## API Endpoints

### Public (Storefront)
- `GET /api/storefront/config` - Configuration du storefront
- `GET /api/storefront/products` - Liste des produits
- `GET /api/storefront/products/:id` - Détail produit
- `POST /api/customers/register` - Inscription client
- `POST /api/orders/checkout` - Passer commande

### Admin
- `GET /api/admin/products` - Gestion produits
- `PUT /api/admin/products/:id/marketplace-settings` - Config marketplace
- `GET /api/admin/orders` - Gestion commandes
- `PUT /api/admin/themes/:id` - Personnalisation thème

## Base de données

### Tables principales
- `marketplace_products` - Produits avec données marketplace
- `marketplace_customers` - Clients du marketplace
- `marketplace_orders` - Commandes
- `marketplace_themes` - Thèmes personnalisés
- `marketplace_price_rules` - Règles de prix

## Intégration ERP

Le marketplace est intégré avec l'ERP principal :
- **Produits** : Synchronisés depuis la table `articles` de l'ERP
- **Clients** : Peuvent être liés aux clients ERP
- **Commandes** : Peuvent générer des commandes dans l'ERP
- **Stock** : Lecture temps réel depuis l'ERP

## Développement

### Structure des dossiers

```
apps/
├── marketplace-api/
│   ├── src/
│   │   ├── domains/        # Modules métier
│   │   ├── shared/         # Code partagé
│   │   └── infrastructure/ # Config et DB
│   └── package.json
│
└── marketplace-storefront/
    ├── src/
    │   ├── app/           # Pages Next.js
    │   ├── components/    # Composants React
    │   ├── lib/          # Utilitaires
    │   └── store/        # État Zustand
    └── package.json
```

### Tests

```bash
# Tests unitaires
pnpm test --filter='@erp/marketplace-*'

# Tests E2E
pnpm test:e2e --filter='@erp/marketplace-*'
```

## Sécurité

- **Authentication** : JWT partagé avec l'ERP
- **Multi-tenant** : Isolation stricte par `societeId`
- **CORS** : Configuré pour les domaines autorisés
- **Rate limiting** : Protection contre les abus

## Déploiement

1. Build des applications
2. Migration de la base de données
3. Configuration des variables d'environnement
4. Démarrage avec PM2 ou Docker

## Troubleshooting

### Erreur ECONNREFUSED
- Vérifier que l'API est démarrée sur le bon port
- Vérifier les URLs dans `.env.local`

### Erreur 403 Forbidden
- Vérifier que la société a `marketplace.enabled = true`
- Vérifier le header `X-Tenant`

### Base de données manquante
- Créer la base avec le script : `node create-db.js`
- Vérifier les permissions PostgreSQL