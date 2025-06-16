# Guide de démarrage - ERP Métallerie

Ce guide vous aidera à configurer et démarrer le projet ERP Métallerie sur votre machine locale.

## 🚀 Démarrage rapide

### 1. Prérequis

Assurez-vous d'avoir installé :
- **Node.js** 18.17 ou supérieur
- **npm**, **yarn** ou **pnpm**
- **Git**
- Un éditeur de code (VS Code recommandé)

### 2. Installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/erp-metallerie.git
cd erp-metallerie

# Installer les dépendances
npm install
# ou
yarn install
# ou
pnpm install
```

### 3. Configuration de l'environnement

```bash
# Copier le fichier d'environnement exemple
cp .env.example .env.local
```

Éditez `.env.local` et configurez :
- `NEXT_PUBLIC_API_URL` : URL de votre API backend
- Autres variables selon vos besoins

### 4. Lancer le projet

```bash
# Mode développement
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Structure du projet

```
src/
├── app/                    # Pages et routes (App Router)
│   ├── (auth)/            # Pages publiques (login, register)
│   ├── (dashboard)/       # Pages protégées
│   └── api/               # Routes API locales
├── components/            # Composants réutilisables
│   ├── ui/               # Composants UI de base
│   ├── layout/           # Composants de mise en page
│   └── features/         # Composants métier
├── hooks/                 # Custom hooks
├── lib/                   # Utilitaires et configuration
├── services/              # Services API
├── store/                 # État global (Zustand)
└── types/                 # Types TypeScript
```

## 🔑 Authentification

### Connexion de test

Pour tester l'application sans backend :
- Email : `demo@metallerie.fr`
- Mot de passe : `password`

### Implémentation réelle

1. Configurez votre API backend pour gérer l'authentification JWT
2. Mettez à jour `src/services/auth.service.ts` avec vos endpoints
3. Adaptez le store d'authentification si nécessaire

## 🎨 Personnalisation

### Thème et couleurs

Modifiez `tailwind.config.ts` pour personnaliser :
- Couleurs de votre marque
- Polices
- Espacements
- Breakpoints responsive

### Logo et identité

1. Remplacez les icônes dans `public/`
2. Mettez à jour les métadonnées dans `src/app/layout.tsx`
3. Personnalisez le composant Header et Sidebar

## 🔧 Commandes utiles

```bash
# Développement
npm run dev              # Lance le serveur de développement
npm run build            # Build de production
npm run start            # Lance la version de production

# Qualité du code
npm run lint             # Vérifie le code avec ESLint
npm run type-check       # Vérifie les types TypeScript
npm run format           # Formate le code avec Prettier

# Base de données (avec Prisma - backend)
npm run db:migrate       # Applique les migrations
npm run db:seed          # Remplit la base avec des données de test
npm run db:studio        # Lance Prisma Studio
```

## 🐛 Résolution des problèmes

### Erreurs courantes

1. **"Module not found"**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Erreurs TypeScript**
   ```bash
   npm run type-check
   ```

3. **Problèmes de cache Next.js**
   ```bash
   rm -rf .next
   npm run dev
   ```

### Logs et débogage

- Vérifiez la console du navigateur pour les erreurs côté client
- Utilisez React Query Devtools (déjà intégré)
- Consultez les logs du serveur dans le terminal

## 📦 Modules principaux

### 1. Projets
- Liste avec filtres et recherche
- Création/modification de projets
- Suivi de l'avancement
- Gestion des devis

### 2. Production
- Ordres de fabrication
- Planning
- Suivi des opérations

### 3. Stocks
- Inventaire en temps réel
- Alertes stock critique
- Mouvements de stock

### 4. Chiffrage
- Calculateur avancé
- Templates réutilisables
- Export PDF

## 🚀 Prochaines étapes

1. **Connecter le backend**
   - Implémenter l'API REST
   - Configurer la base de données
   - Gérer l'authentification

2. **Ajouter des fonctionnalités**
   - Module de visualisation 3D
   - Système de notifications temps réel
   - Rapports et analytics avancés

3. **Déploiement**
   - Configurer CI/CD
   - Déployer sur Vercel/AWS/VPS
   - Mettre en place le monitoring

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation TypeScript](https://www.typescriptlang.org/docs)
- [Documentation Zustand](https://github.com/pmndrs/zustand)
- [Documentation React Query](https://tanstack.com/query/latest)

## 🤝 Support

Pour toute question :
- Ouvrez une issue sur GitHub
- Contactez l'équipe de développement
- Consultez la documentation complète

---

Bon développement ! 🎉