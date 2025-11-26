# 🏗️ Socle Infrastructure TopSteel

**Version**: 2.0 - Socle Propre
**Date**: 2025-01-24
**ORM**: Prisma 6.9.0

---

## 📋 Vue d'Ensemble

Ce projet constitue un **socle infrastructure propre** prêt à accueillir des applications métier.

Il fournit tous les composants essentiels pour développer une application web moderne:
- ✅ Authentification complète (JWT, MFA, Sessions)
- ✅ Multi-tenant (Gestion de sociétés et sites)
- ✅ Menu dynamique configurable
- ✅ Système de notifications
- ✅ Gestion de permissions granulaires
- ✅ Query Builder pour requêtes dynamiques
- ✅ Recherche full-text
- ✅ Administration système

---

## 🎯 Objectif

Fournir une base solide, testée et maintenable pour construire rapidement des applications métier sans repartir de zéro.

**Ce socle ne contient AUCUNE logique métier spécifique** - uniquement l'infrastructure réutilisable.

---

## 📁 Structure du Projet

```
apps/api/
├── prisma/
│   ├── schema.prisma              # Schéma complet (48 tables infrastructure)
│   └── migrations/
│       └── 20250124000000_baseline/  # Migration baseline propre
├── src/
│   ├── core/                      # Infrastructure centrale
│   │   ├── auth/                  # Authentification (JWT, Guards)
│   │   ├── database/              # Prisma Service
│   │   ├── config/                # Configuration
│   │   ├── common/                # Utilitaires communs
│   │   └── health/                # Health checks
│   ├── infrastructure/            # Services infrastructure
│   │   ├── security/              # Sécurité (Guards, Filters)
│   │   ├── logging/               # Logging centralisé
│   │   ├── error-handling/        # Gestion d'erreurs
│   │   └── cache/                 # Cache Redis
│   ├── domains/                   # Domaines métier de base
│   │   ├── auth/                  # Auth domain (User, Role, Permission)
│   │   ├── users/                 # Gestion utilisateurs
│   │   ├── admin/                 # Administration
│   │   └── notifications/         # Notifications domain
│   ├── features/                  # Features applicatives
│   │   ├── societes/             # Multi-tenant (Sociétés/Sites)
│   │   ├── menu/                 # Menu dynamique
│   │   ├── admin/                # Admin features
│   │   ├── notifications/        # Notifications features
│   │   ├── parameters/           # Paramètres système
│   │   ├── query-builder/        # Query Builder
│   │   ├── search/               # Recherche full-text
│   │   ├── ui-preferences/       # Préférences utilisateur
│   │   └── database-core/        # Gestion DB avancée
│   ├── app.module.ts             # Module racine
│   └── main.ts                   # Point d'entrée
└── package.json
```

---

## 🔧 Technologies

### Backend
- **Framework**: NestJS 10.x
- **ORM**: Prisma 6.9.0
- **Base de données**: PostgreSQL 14+
- **Authentification**: JWT + Passport
- **Cache**: Redis (optionnel)
- **Documentation API**: Swagger/OpenAPI

### Qualité du Code
- **TypeScript**: 5.x (strict mode)
- **Linting**: ESLint
- **Testing**: Jest
- **E2E**: Playwright

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- Redis (optionnel)
- pnpm 8+

### Installation

```bash
# 1. Installer les dépendances
pnpm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# 3. Créer la base de données
createdb topsteel_auth

# 4. Appliquer les migrations Prisma
pnpm prisma migrate deploy

# 5. Générer le client Prisma
pnpm prisma generate

# 6. (Optionnel) Seed les données de base
pnpm prisma db seed

# 7. Lancer l'application
pnpm dev
```

L'API sera accessible sur `http://localhost:3000`

---

## 📚 Modules du Socle

### 🔐 Auth Module
**Emplacement**: `src/domains/auth/`, `src/core/auth/`

Authentification complète avec:
- JWT Access/Refresh Tokens
- MFA (2FA) avec TOTP
- Gestion de sessions
- Roles et permissions granulaires
- Guards NestJS (JWT, Roles, Permissions)
- Rate limiting

**Endpoints**:
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription
- `POST /auth/refresh` - Rafraîchir token
- `POST /auth/logout` - Déconnexion
- `GET /auth/profile` - Profil utilisateur
- `POST /auth/mfa/enable` - Activer MFA
- `POST /auth/mfa/verify` - Vérifier code MFA

### 🏢 Multi-Tenant (Sociétés)
**Emplacement**: `src/features/societes/`

Gestion multi-société avec:
- Création/gestion de sociétés
- Gestion de sites
- Licences et features
- Isolation des données par société
- Gestion des utilisateurs par société

**Endpoints**:
- `GET /societes` - Liste des sociétés
- `POST /societes` - Créer société
- `GET /societes/:id` - Détails société
- `GET /societes/:id/sites` - Sites d'une société
- `GET /societes/:id/users` - Utilisateurs d'une société

### 📋 Menu Dynamique
**Emplacement**: `src/features/menu/`, `src/features/admin/`

Menu configurable avec:
- Menu hiérarchique multi-niveaux
- Configuration par rôle/permission
- Synchronisation automatique
- Préférences utilisateur
- Icônes et badges

**Endpoints**:
- `GET /menu` - Menu de l'utilisateur connecté
- `GET /menu/configuration` - Configuration complète
- `POST /menu/preferences` - Sauvegarder préférences

### 🔔 Notifications
**Emplacement**: `src/features/notifications/`, `src/domains/notifications/`

Système de notifications avec:
- Notifications temps réel (WebSocket)
- Templates de notifications
- Règles conditionnelles
- Préférences par canal (Email, Push, SMS)
- Historique et statut de lecture

**Endpoints**:
- `GET /notifications` - Liste des notifications
- `POST /notifications/mark-read/:id` - Marquer comme lu
- `GET /notifications/unread-count` - Nombre non lus
- `PUT /notifications/settings` - Paramètres

### ⚙️ Paramètres Système
**Emplacement**: `src/features/parameters/`

Gestion de paramètres configurables:
- Paramètres système (global)
- Paramètres application (par app)
- Paramètres client (par société)
- Types: string, number, boolean, json
- Validation des valeurs

**Endpoints**:
- `GET /parameters/system` - Paramètres système
- `GET /parameters/application/:app` - Paramètres app
- `PUT /parameters/system/:key` - Modifier paramètre

### 🔍 Query Builder
**Emplacement**: `src/features/query-builder/`

Constructeur de requêtes dynamiques:
- Création de requêtes SQL sécurisées
- Joins, filtres, agrégations
- Permissions par requête
- Validation et sanitization
- Exécution sécurisée

**Endpoints**:
- `GET /query-builder` - Liste des requêtes
- `POST /query-builder` - Créer requête
- `POST /query-builder/:id/execute` - Exécuter requête

### 🔎 Recherche Full-Text
**Emplacement**: `src/features/search/`

Recherche globale avec:
- PostgreSQL Full-Text Search
- Indexation automatique
- Support multi-tenant
- Suggestions
- Filtres et facettes

**Endpoints**:
- `GET /search?q=terme` - Recherche globale
- `POST /search/reindex` - Réindexer

### 🎨 UI Preferences
**Emplacement**: `src/features/ui-preferences/`

Préférences interface utilisateur:
- Thème (clair/sombre)
- Langue
- Layout
- Ordre des éléments réorganisables

---

## 🗄️ Schéma de Base de Données

### Tables Principales

#### Auth & Users
- `users` - Utilisateurs
- `user_sessions` - Sessions actives
- `user_mfa` - Configuration MFA
- `mfa_sessions` - Sessions MFA temporaires
- `roles` - Rôles
- `permissions` - Permissions
- `role_permissions` - Association rôle-permission
- `user_roles` - Association user-rôle
- `groups` - Groupes d'utilisateurs
- `user_groups` - Association user-groupe
- `user_societe_roles` - Rôles par société
- `audit_logs` - Logs d'audit
- `user_settings` - Paramètres utilisateur

#### Multi-Tenant
- `societes` - Sociétés/Organisations
- `sites` - Sites/Établissements
- `societe_users` - Utilisateurs par société
- `societe_licenses` - Licences
- `licenses` - Définitions de licences
- `license_features` - Features par licence
- `license_activations` - Activations
- `license_usage` - Usage

#### Menu
- `menu_configurations` - Configurations menu
- `menu_items` - Items de menu
- `menu_item_roles` - Visibilité par rôle
- `menu_item_permissions` - Permissions par item
- `user_menu_preferences` - Préférences utilisateur
- `user_menu_item_preferences` - Préférences par item
- `discovered_pages` - Pages découvertes

#### Notifications
- `notifications` - Notifications
- `notification_events` - Événements
- `notification_templates` - Templates
- `notification_settings` - Paramètres utilisateur
- `notification_rules` - Règles
- `notification_rule_executions` - Exécutions
- `notification_read` - Statuts de lecture

#### Parameters
- `system_parameters` - Paramètres système
- `system_settings` - Settings système
- `parameter_systems` - Paramètres système (legacy)
- `parameter_applications` - Paramètres app
- `parameter_clients` - Paramètres client

#### Query Builder
- `query_builders` - Requêtes sauvegardées
- `query_builder_columns` - Colonnes
- `query_builder_joins` - Joins
- `query_builder_calculated_fields` - Champs calculés
- `query_builder_permissions` - Permissions

---

## 🔒 Sécurité

### Authentification
- JWT avec rotation des tokens
- Refresh tokens sécurisés
- MFA optionnel (TOTP)
- Rate limiting sur login
- Protection CSRF
- Session timeout configurable

### Autorisation
- RBAC (Role-Based Access Control)
- Permissions granulaires
- Guards NestJS personnalisés
- Isolation multi-tenant

### Sécurité Base de Données
- Row-Level Security (RLS) Prisma
- Prepared statements (Prisma)
- Validation des entrées
- Sanitization SQL

### Headers Sécurité
- CORS configuré
- Helmet.js
- Rate limiting
- Input validation (class-validator)

---

## 📝 Conventions de Code

### Structure des Fichiers
```
feature/
├── controllers/          # Contrôleurs REST
├── services/            # Logique métier
├── dto/                 # Data Transfer Objects
├── entities/            # Prisma models (types)
├── guards/              # Guards spécifiques
├── interfaces/          # Interfaces TypeScript
├── types/               # Types TypeScript
├── __tests__/          # Tests unitaires
└── feature.module.ts   # Module NestJS
```

### Naming
- **Fichiers**: kebab-case (user-service.ts)
- **Classes**: PascalCase (UserService)
- **Fonctions/Variables**: camelCase (findUser)
- **Constantes**: UPPER_SNAKE_CASE (MAX_RETRIES)
- **Interfaces**: PascalCase avec I prefix (IUserService)

### Prisma
- **Modèles**: PascalCase (User, Societe)
- **Champs**: camelCase (firstName, createdAt)
- **Tables**: snake_case (users, societe_users)
- **Relations**: camelCase (user, societeRoles)

---

## 🧪 Tests

```bash
# Tests unitaires
pnpm test

# Tests avec coverage
pnpm test:cov

# Tests E2E
pnpm test:e2e

# Watch mode
pnpm test:watch
```

### Structure des Tests
- Tests unitaires: `*.spec.ts` à côté du fichier source
- Tests E2E: `test/` à la racine
- Mocks: `__mocks__/`

---

## 📖 Documentation API

### Swagger
Accessible sur `/api/docs` en développement

```bash
# Générer la documentation
pnpm build
# La documentation est auto-générée via decorators NestJS
```

### Decorators Swagger Principaux
```typescript
@ApiTags('users')
@ApiOperation({ summary: 'Get user by ID' })
@ApiResponse({ status: 200, description: 'User found' })
@ApiParam({ name: 'id', type: 'string' })
@ApiBearerAuth()
```

---

## 🔄 Prisma

### Commandes Utiles

```bash
# Générer le client Prisma
pnpm prisma generate

# Créer une migration
pnpm prisma migrate dev --name description

# Appliquer les migrations
pnpm prisma migrate deploy

# Ouvrir Prisma Studio
pnpm prisma studio

# Formater le schema
pnpm prisma format

# Valider le schema
pnpm prisma validate

# Reset la DB (dev only)
pnpm prisma migrate reset
```

### Prisma Studio
Interface graphique pour explorer la DB:
```bash
pnpm prisma studio
# Accessible sur http://localhost:5555
```

---

## 🚢 Déploiement

### Variables d'Environnement Requises

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Application
NODE_ENV="production"
PORT=3000
API_PREFIX="api"

# Redis (optionnel)
REDIS_HOST="localhost"
REDIS_PORT=6379

# SMTP (pour notifications email)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="noreply@example.com"
SMTP_PASS="password"

# SMS (pour MFA)
SMS_PROVIDER="twilio"
SMS_API_KEY="your-api-key"
```

### Build Production

```bash
# Build
pnpm build

# Lancer en production
NODE_ENV=production node dist/main.js
```

### Docker

```bash
# Build image
docker build -t topsteel-api .

# Run container
docker run -p 3000:3000 --env-file .env topsteel-api
```

---

## 🛠️ Développement

### Hot Reload
```bash
pnpm dev
# L'API redémarre automatiquement à chaque modification
```

### Debug
Configuration VSCode incluse dans `.vscode/launch.json`

### Prisma Migrations Workflow

1. **Modifier le schema**: Éditer `prisma/schema.prisma`
2. **Créer migration**: `pnpm prisma migrate dev --name add_feature`
3. **Review migration**: Vérifier le SQL généré
4. **Commit**: Commiter schema + migration
5. **Deploy**: `pnpm prisma migrate deploy` en prod

---

## 📦 Ajout de Nouveau Code Métier

### Créer un Nouveau Feature Module

```bash
# Créer la structure
mkdir -p src/features/mon-feature/{controllers,services,dto,types}
```

```typescript
// src/features/mon-feature/mon-feature.module.ts
import { Module } from '@nestjs/common'
import { DatabaseModule } from '../../core/database/database.module'
import { MonFeatureController } from './controllers/mon-feature.controller'
import { MonFeatureService } from './services/mon-feature.service'

@Module({
  imports: [DatabaseModule],
  controllers: [MonFeatureController],
  providers: [MonFeatureService],
  exports: [MonFeatureService],
})
export class MonFeatureModule {}
```

### Ajouter au FeaturesModule

```typescript
// src/features/features.module.ts
import { MonFeatureModule } from './mon-feature/mon-feature.module'

@Module({
  imports: [
    // ...
    MonFeatureModule,
  ],
  exports: [
    // ...
    MonFeatureModule,
  ],
})
export class FeaturesModule {}
```

### Ajouter des Tables Prisma

```prisma
// prisma/schema.prisma
model MonEntite {
  id        String   @id @default(uuid())
  nom       String   @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("mon_entites")
}
```

Puis:
```bash
pnpm prisma migrate dev --name add_mon_entite
pnpm prisma generate
```

---

## 🤝 Contribution

### Workflow Git

1. Créer une branche: `git checkout -b feature/ma-fonctionnalite`
2. Coder + Tester
3. Commit: `git commit -m "feat: ajouter ma fonctionnalité"`
4. Push: `git push origin feature/ma-fonctionnalite`
5. Créer une Pull Request

### Conventions de Commit
Format: `type(scope): message`

Types:
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance

Exemples:
- `feat(auth): add MFA support`
- `fix(menu): correct permissions check`
- `docs(readme): update installation steps`

---

## 📞 Support

### Documentation
- [NestJS](https://docs.nestjs.com/)
- [Prisma](https://www.prisma.io/docs/)
- [PostgreSQL](https://www.postgresql.org/docs/)

### Issues
Créer une issue sur le repository avec:
- Description du problème
- Steps to reproduce
- Logs/Screenshots
- Environnement (OS, Node version, etc.)

---

## 📄 Licence

Ce socle est fourni "tel quel" pour usage interne.

---

## ✅ Checklist Démarrage Projet Métier

- [ ] Cloner le repository
- [ ] Installer les dépendances (`pnpm install`)
- [ ] Configurer `.env`
- [ ] Créer la base de données
- [ ] Appliquer les migrations Prisma
- [ ] Seed les données de base
- [ ] Lancer l'application
- [ ] Tester l'authentification
- [ ] Créer votre premier feature module
- [ ] Ajouter vos tables métier au schema Prisma
- [ ] Implémenter votre logique métier
- [ ] Écrire des tests
- [ ] Déployer!

---

**Prêt à construire votre application! 🚀**
