# 📋 TopSteel ERP - Guide de Fonctionnement et Paramétrage

## 🎯 Vue d'Ensemble

TopSteel ERP est une application complète de gestion métallurgique construite avec :
- **Frontend** : Next.js 15 + React 19 + TypeScript
- **Backend** : NestJS + TypeORM + PostgreSQL
- **Architecture** : Monorepo avec pnpm workspaces

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- pnpm 8+
- PostgreSQL 14+
- Git

### Installation Initiale
```bash
# Cloner le projet
git clone <repository-url>
cd TopSteel

# Installer les dépendances
pnpm install

# Configuration des variables d'environnement
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

### Démarrage des Services

#### 1. Base de Données
```bash
# Démarrer PostgreSQL (selon votre installation)
# Windows : services.msc > PostgreSQL
# Mac : brew services start postgresql
# Linux : sudo systemctl start postgresql

# Créer la base de données
createdb topsteel_dev
```

#### 2. Backend API
```bash
cd apps/api
pnpm dev
# ✅ API disponible sur http://localhost:3001
```

#### 3. Frontend Web
```bash
cd apps/web
pnpm dev
# ✅ Application disponible sur http://localhost:3000
```

---

## 🔐 Authentification

### Comptes par Défaut

#### Administrateur
- **Email** : `admin@topsteel.tech`
- **Mot de passe** : `TopSteel44!`
- **Rôle** : `ADMIN`
- **Permissions** : Accès complet

#### Utilisateur Test
- **Email** : `user@topsteel.tech`
- **Mot de passe** : `User44!`
- **Rôle** : `USER`
- **Permissions** : Lecture seule

### Fonctionnalités d'Auth
- ✅ Connexion email/mot de passe
- ✅ Authentification multi-facteurs (MFA)
- ✅ Récupération de mot de passe
- ✅ Gestion des sessions
- ✅ Tokens JWT avec refresh automatique

---

## ⚙️ Configuration

### Variables d'Environnement

#### Frontend (`apps/web/.env.local`)
```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Application
NEXT_PUBLIC_APP_NAME=TopSteel ERP
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (optionnel pour dev)
NEXT_PUBLIC_EMAIL_ENABLED=true
```

#### Backend (`apps/api/.env`)
```env
# Base de données
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=topsteel_dev
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email Services
# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth2  
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# SMTP Fallback
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🌐 Système de Traduction

### Langues Supportées
- 🇫🇷 **Français** (par défaut)
- 🇬🇧 **Anglais**
- 🇪🇸 **Espagnol**

### Interface d'Administration
**URL** : `/admin/translations`

#### Fonctionnalités
- ✅ **Gestion multi-langues** avec sélecteur
- ✅ **Recherche** dans les traductions
- ✅ **Classification** par namespace
- ✅ **Export Excel** complet
- ✅ **Import Excel** avec validation
- ✅ **Statistiques** de completion
- ✅ **Historique** des modifications

#### Structure des Traductions
```typescript
// Fichier : apps/web/src/lib/i18n/translations/fr.ts
export const fr = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    // ...
  },
  auth: {
    login: 'Se connecter',
    register: 'S\'inscrire',
    // ...
  },
  admin: {
    title: 'Administration',
    // ...
  }
}
```

#### Utilisation dans le Code
```tsx
import { useTranslation } from '@/lib/i18n/hooks'

function MyComponent() {
  const { t } = useTranslation('common') // namespace
  
  return (
    <button>{t('save')}</button> // 'Enregistrer'
  )
}
```

---

## 📧 Service Email

### Providers Supportés

#### 1. Google Gmail (OAuth2)
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/google/callback
```

#### 2. Microsoft Outlook (OAuth2)
```env
MICROSOFT_CLIENT_ID=your-client-id
MICROSOFT_CLIENT_SECRET=your-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3001/auth/microsoft/callback
```

#### 3. SMTP Générique
```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=username
SMTP_PASS=password
SMTP_SECURE=true
```

### Templates d'Email
Localisation : `apps/api/src/modules/email/templates/`

#### Templates Disponibles
- `welcome.hbs` - Email de bienvenue
- `password-reset.hbs` - Réinitialisation
- `notification.hbs` - Notifications
- `invoice.hbs` - Factures

#### Variables Handlebars
```handlebars
{{user.name}} - Nom utilisateur
{{company.name}} - Nom entreprise
{{url}} - Lien d'action
{{date}} - Date formatée
```

---

## 🔔 Système de Notifications

### Types de Notifications
- `info` - Information générale
- `success` - Action réussie
- `warning` - Avertissement
- `error` - Erreur

### Catégories
- `system` - Système
- `stock` - Gestion des stocks
- `production` - Production
- `maintenance` - Maintenance
- `quality` - Qualité
- `billing` - Facturation

### Configuration Utilisateur
```typescript
interface NotificationSettings {
  enableToast: boolean      // Notifications toast
  enableSound: boolean      // Son
  enableVibration: boolean  // Vibration mobile
  enableBrowser: boolean    // Notifications navigateur
  enableEmail: boolean      // Notifications email
}
```

### API d'Envoi
```typescript
// Envoyer une notification
await notificationService.create({
  type: 'info',
  category: 'system',
  title: 'Mise à jour disponible',
  message: 'Une nouvelle version est disponible',
  recipientType: 'user',
  recipientId: 'user-123'
})
```

---

## 🎨 Système de Thèmes

### Thèmes Disponibles
- `light` - Thème clair
- `dark` - Thème sombre  
- `vibrant` - Thème coloré
- `system` - Suit le système

### Configuration CSS
```css
/* Fichier : apps/web/src/styles/globals.css */
:root {
  --color-primary: 59 130 246;
  --color-secondary: 107 114 128;
  /* ... */
}

[data-theme="vibrant"] {
  --color-primary: 244 63 94;
  /* ... */
}
```

### Utilisation
```tsx
import { useTheme } from 'next-themes'

function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  
  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      <option value="light">Clair</option>
      <option value="dark">Sombre</option>
      <option value="vibrant">Coloré</option>
      <option value="system">Auto</option>
    </select>
  )
}
```

---

## 🏗️ Architecture Technique

### Structure du Projet
```
TopSteel/
├── apps/
│   ├── web/          # Frontend Next.js
│   └── api/          # Backend NestJS
├── packages/
│   ├── ui/           # Composants UI partagés
│   ├── domains/      # Types et logique métier
│   ├── types/        # Types TypeScript
│   └── utils/        # Utilitaires partagés
└── tools/            # Outils de build
```

### Technologies Clés
- **Next.js 15** - Framework React
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **TailwindCSS** - Styles utilitaires
- **NestJS** - Framework backend
- **TypeORM** - ORM base de données
- **PostgreSQL** - Base de données
- **Radix UI** - Composants accessibles

---

## 🔧 Commandes Utiles

### Développement
```bash
# Démarrer tout en mode dev
pnpm dev

# Démarrer seulement le frontend
pnpm dev:web

# Démarrer seulement le backend
pnpm dev:api

# Construire tout
pnpm build

# Tests
pnpm test
```

### Base de Données
```bash
cd apps/api

# Générer une migration
pnpm migration:generate MigrationName

# Exécuter les migrations
pnpm migration:run

# Rollback migration
pnpm migration:revert

# Synchroniser le schéma (dev uniquement)
pnpm schema:sync
```

### Linting et Formatage
```bash
# Vérifier le code
pnpm lint

# Corriger automatiquement
pnpm lint:fix

# Formater le code
pnpm format
```

---

## 🚀 Déploiement

### Production

#### 1. Préparer l'Environnement
```bash
# Variables production
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=production-secret-key
```

#### 2. Build
```bash
# Build optimisé
pnpm build

# Vérifier les builds
ls -la apps/web/.next/
ls -la apps/api/dist/
```

#### 3. Démarrer en Production
```bash
# Backend
cd apps/api
pnpm start:prod

# Frontend
cd apps/web
pnpm start
```

### Docker (Optionnel)
```dockerfile
# Dockerfile exemple
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔍 Monitoring et Logs

### Logs Application
```bash
# Logs en temps réel
tail -f apps/api/logs/app.log
tail -f apps/web/.next/trace
```

### Santé du Backend
- **Endpoint** : `GET /api/health`
- **Dashboard** : `/admin/system-status`
- **Métriques** : CPU, Mémoire, DB, APIs

### Surveillance des Erreurs
```typescript
// Logs structurés
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  timestamp: new Date().toISOString()
})
```

---

## ❓ FAQ et Dépannage

### Problèmes Courants

#### 🔴 "Backend non accessible"
```bash
# Vérifier que l'API est démarrée
curl http://localhost:3001/api/health

# Vérifier les variables d'environnement
echo $NEXT_PUBLIC_API_URL
```

#### 🔴 "Database connection error"
```bash
# Vérifier PostgreSQL
pg_isready -h localhost -p 5432

# Vérifier les permissions
psql -h localhost -U postgres -d topsteel_dev
```

#### 🔴 "Invalid hook call"
```bash
# Nettoyer le cache Next.js
rm -rf apps/web/.next

# Réinstaller les dépendances
pnpm install
```

#### 🔴 "Translation key missing"
1. Aller dans `/admin/translations`
2. Ajouter la clé manquante
3. Exporter/Importer si nécessaire

### Performance

#### Optimisations Recommandées
- ✅ **Compression** activée
- ✅ **Cache** des traductions
- ✅ **Lazy loading** des composants
- ✅ **Tree shaking** automatique
- ✅ **Bundle splitting** par route

#### Métriques à Surveiller
- **First Load JS** : < 200kb
- **Lighthouse Score** : > 90
- **API Response Time** : < 500ms
- **Database Queries** : < 100ms

---

## 📞 Support et Contacts

### Équipe de Développement
- **Lead Developer** : [Nom]
- **DevOps** : [Nom]
- **Support** : support@topsteel.tech

### Ressources
- **Documentation** : `/docs`
- **API Docs** : `http://localhost:3001/api/docs`
- **Storybook** : `pnpm storybook`
- **Repository** : [Git URL]

---

## 📝 Changelog

### Version Actuelle : 1.0.0
- ✅ Système de traduction complet
- ✅ Service email intégré
- ✅ Authentification robuste
- ✅ Interface d'administration
- ✅ Notifications temps réel
- ✅ Support multi-thèmes
- ✅ Architecture monorepo

### Roadmap
- 🔄 **v1.1** - API REST complète
- 🔄 **v1.2** - Module de facturation
- 🔄 **v1.3** - Gestion des stocks
- 🔄 **v1.4** - Rapports avancés

---

*Dernière mise à jour : $(date)*
*Documentation maintenue par l'équipe TopSteel ERP*