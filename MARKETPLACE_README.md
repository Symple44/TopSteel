# TopSteel Marketplace

## Vue d'ensemble

Le marketplace TopSteel est une solution complète de commerce électronique multi-tenant qui permet aux clients ERP de créer et gérer leurs propres boutiques en ligne. Chaque société peut avoir sa propre marketplace avec des produits provenant directement de leur ERP.

## Architecture

### Structure du Projet

```
TopSteel/
├── apps/
│   ├── api/                          # API ERP existante
│   ├── web/                          # Interface ERP existante  
│   ├── marketplace-api/              # API Marketplace (Nouveau)
│   └── marketplace-storefront/       # Frontend Marketplace (Nouveau)
```

### Architecture Multi-Tenant

- **Résolution par domaine** : Chaque tenant est identifié par son sous-domaine (ex: `entreprise.marketplace.com`)
- **Base de données séparée** : Chaque tenant a sa propre base de données ERP
- **Configuration personnalisée** : Thèmes, logos, et paramètres par tenant

## Fonctionnalités Principales

### 🛒 Gestion du Panier
- Panier persistant avec Zustand
- Séparation par tenant
- Calcul automatique des prix et quantités
- Interface sidebar responsive

### 🛍️ Catalogue Produits
- Intégration directe avec l'ERP
- Système de prix règles avancé
- Filtres et recherche
- Affichage grille/liste

### 💳 Processus de Commande
- Checkout sans compte (guest)
- Création compte optionnelle
- Gestion des adresses
- Paiement sécurisé

### 👤 Gestion Utilisateur
- Comptes clients optionnels
- Historique des commandes
- Favoris
- Paramètres de notification

## Technologies Utilisées

### Backend (marketplace-api)
- **NestJS** - Framework Node.js
- **TypeORM** - ORM pour bases de données
- **PostgreSQL** - Base de données
- **Redis** - Cache et sessions
- **JWT** - Authentification

### Frontend (marketplace-storefront)
- **Next.js 15** - Framework React avec App Router
- **Tailwind CSS** - Styles
- **Zustand** - Gestion d'état
- **React Query** - Gestion des données
- **Sonner** - Notifications

## Installation et Configuration

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Redis (optionnel)

### Installation Marketplace API

```bash
cd apps/marketplace-api
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Base de données
npm run migration:run

# Démarrage
npm run start:dev
```

### Installation Marketplace Storefront

```bash
cd apps/marketplace-storefront
npm install

# Configuration
cp .env.local.example .env.local
# Éditer .env.local avec vos paramètres

# Démarrage
npm run dev
```

## Configuration Multi-Tenant

### 1. Résolution des Tenants

La résolution se fait par sous-domaine :
- `tenant1.marketplace.com` → Base de données `topsteel_tenant1`
- `tenant2.marketplace.com` → Base de données `topsteel_tenant2`

### 2. Configuration par Tenant

Chaque tenant peut personnaliser :
- Logo et couleurs
- Nom de la boutique
- Paramètres SEO
- Conditions générales

### 3. Données ERP

Le marketplace accède directement aux données ERP :
- Articles et stock
- Prix et règles tarifaires
- Informations clients
- Paramètres société

## Fonctionnalités Avancées

### Système de Prix
- Prix de base depuis l'ERP
- Règles de prix conditionnelles
- Remises par quantité
- Groupes de clients

### Recherche et Filtres
- Recherche textuelle
- Filtres par catégorie
- Tri par prix/nom/date
- Pagination

### Panier Intelligent
- Persistance locale
- Gestion des stocks
- Calcul automatique
- Séparation tenant

## API Endpoints

### Produits
```
GET    /api/products                 # Liste des produits
GET    /api/products/:id             # Détail produit
GET    /api/products/search          # Recherche
GET    /api/categories               # Catégories
```

### Panier et Commandes
```
POST   /api/cart                     # Ajouter au panier
PUT    /api/cart/:id                 # Modifier quantité
DELETE /api/cart/:id                 # Supprimer du panier
POST   /api/orders                   # Créer commande
GET    /api/orders                   # Historique
```

### Utilisateurs
```
POST   /api/auth/register            # Inscription
POST   /api/auth/login               # Connexion
GET    /api/users/profile            # Profil
PUT    /api/users/profile            # Modifier profil
```

## Configuration des Variables d'Environnement

### Marketplace API (.env)
```env
# Base de données
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password

# ERP Connection
ERP_DB_HOST=localhost
ERP_DB_PORT=5432
ERP_DB_PREFIX=topsteel_

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# API
PORT=3001
NODE_ENV=development
```

### Marketplace Storefront (.env.local)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_MARKETPLACE_URL=http://localhost:3000

# Configuration
NEXT_PUBLIC_DEFAULT_TENANT=demo
```

## Déploiement

### Production
1. **Build des applications**
```bash
# API
cd apps/marketplace-api
npm run build

# Storefront  
cd apps/marketplace-storefront
npm run build
```

2. **Configuration serveur**
- Nginx pour le reverse proxy
- PM2 pour la gestion des processus
- Base de données PostgreSQL
- Redis pour le cache

3. **Variables d'environnement**
- Configurer les URLs de production
- Secrets de sécurité
- Connexions bases de données

## Sécurité

### Mesures Implémentées
- **Validation des entrées** - Joi/class-validator
- **Rate limiting** - Protection DoS
- **CORS** - Configuration stricte
- **JWT** - Tokens sécurisés
- **Chiffrement** - Mots de passe bcrypt

### Bonnes Pratiques
- Audit régulier des dépendances
- Logs de sécurité
- Sauvegarde des données
- Monitoring des accès

## Monitoring et Logs

### Métriques
- Performance des API
- Utilisation des ressources
- Erreurs applicatives
- Activité utilisateur

### Logs
- Accès et authentification
- Erreurs système
- Transactions commerciales
- Audit de sécurité

## Tests

### Backend
```bash
cd apps/marketplace-api
npm run test          # Tests unitaires
npm run test:e2e      # Tests e2e
npm run test:cov      # Couverture
```

### Frontend
```bash
cd apps/marketplace-storefront
npm run test          # Tests Jest
npm run test:e2e      # Tests Playwright
```

## Support et Maintenance

### Documentation
- API documentation avec Swagger
- Guides d'utilisation
- Tutoriels d'intégration

### Évolutions Futures
- Interface d'administration marketplace
- Éditeur WYSIWYG pour thèmes
- Intégration passerelles de paiement
- Analytics avancées
- Mobile app

## Contribution

1. Fork du projet
2. Créer une branche feature
3. Commit des modifications
4. Push vers la branche
5. Créer une Pull Request

## Licence

Ce projet est propriétaire à TopSteel.