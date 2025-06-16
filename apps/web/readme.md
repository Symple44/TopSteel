# ERP TOPSTEEL - Front-end

Un système ERP moderne et complet pour les entreprises de construction métallique et métallerie, développé avec Next.js 14, TypeScript et Tailwind CSS.

## 🚀 Fonctionnalités principales

- **Gestion des projets** : Suivi complet des projets de métallerie de A à Z
- **Module de production** : Planification et suivi des ordres de fabrication
- **Gestion des stocks** : Contrôle des matières premières et gestion des chutes
- **Chiffrage avancé** : Calculs complexes avec formules personnalisables
- **Visualisation 3D** : Intégration Three.js pour visualiser les structures
- **Dashboard analytique** : Vue d'ensemble avec graphiques et KPIs
- **Gestion clients/fournisseurs** : Base de données complète
- **Système de notifications** : Alertes temps réel

## 📋 Prérequis

- Node.js 18.17 ou supérieur
- npm, yarn ou pnpm
- Git

## 🛠️ Installation

1. **Cloner le repository**
```bash
git clone https://github.com/votre-username/erp-metallerie.git
cd erp-metallerie
```

2. **Installer les dépendances**
```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. **Configurer les variables d'environnement**
```bash
cp .env.example .env.local
```

Éditer `.env.local` avec vos valeurs :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Lancer le serveur de développement**
```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🏗️ Structure du projet

```
src/
├── app/                    # Pages et routes Next.js (App Router)
│   ├── (auth)/            # Pages d'authentification
│   ├── (dashboard)/       # Pages du dashboard
│   └── api/               # Routes API
├── components/            # Composants React réutilisables
│   ├── ui/               # Composants UI de base
│   ├── layout/           # Composants de mise en page
│   └── features/         # Composants métier
├── hooks/                 # Custom hooks React
├── lib/                   # Utilitaires et configuration
├── services/              # Services API
├── store/                 # État global (Zustand)
├── styles/                # Styles globaux
└── types/                 # Types TypeScript
```

## 🔧 Scripts disponibles

```bash
# Développement
npm run dev              # Lance le serveur de développement

# Build
npm run build            # Compile l'application pour la production
npm run start            # Lance l'application en production

# Qualité du code
npm run lint             # Lance ESLint
npm run type-check       # Vérifie les types TypeScript
npm run format           # Formate le code avec Prettier

# Tests (à implémenter)
npm run test             # Lance les tests
npm run test:watch       # Tests en mode watch
```

## 🎨 Composants UI

Le projet utilise un système de composants basé sur [shadcn/ui](https://ui.shadcn.com/) avec Radix UI et Tailwind CSS :

- **Button** : Boutons avec variantes
- **Card** : Conteneurs de contenu
- **Input/Select/Textarea** : Champs de formulaire
- **Table** : Tableaux de données
- **Dialog/Sheet** : Modales et panneaux latéraux
- **Toast** : Notifications
- Et bien plus...

## 📦 Modules principaux

### 1. Authentification
- Connexion/Déconnexion
- Gestion des tokens JWT
- Refresh token automatique
- Protection des routes

### 2. Projets
- Liste des projets avec filtres
- Détail projet avec onglets
- Création/Modification
- Suivi de l'avancement

### 3. Production
- Ordres de fabrication
- Planning de production
- Suivi des opérations
- Affectation des techniciens

### 4. Stocks
- Inventaire temps réel
- Alertes stock critique
- Gestion des mouvements
- Optimisation des chutes

### 5. Chiffrage
- Calculateur avancé
- Templates réutilisables
- Export PDF des devis
- Historique des versions

## 🔐 Sécurité

- Authentification JWT avec refresh tokens
- Protection CSRF
- Validation des entrées avec Zod
- Sanitization des données
- Gestion des permissions par rôle

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t erp-metallerie .
docker run -p 3000:3000 erp-metallerie
```

### Serveur traditionnel
```bash
npm run build
npm run start
```

## 🧪 Tests (À implémenter)

Le projet est préparé pour :
- Tests unitaires avec Jest
- Tests d'intégration avec Testing Library
- Tests E2E avec Playwright

## 📚 Documentation API

L'API backend doit exposer les endpoints suivants :

### Auth
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

### Projets
- `GET /api/projets`
- `GET /api/projets/:id`
- `POST /api/projets`
- `PUT /api/projets/:id`
- `DELETE /api/projets/:id`

### Stocks
- `GET /api/stocks`
- `GET /api/stocks/:id`
- `POST /api/stocks/mouvements`
- `GET /api/stocks/alertes`

[Documentation complète de l'API à venir]

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Lead Developer** : [Votre nom]
- **UI/UX Designer** : [Nom]
- **Backend Developer** : [Nom]

## 📞 Support

Pour toute question ou support :
- Email : support@erp-metallerie.fr
- Documentation : [https://docs.erp-metallerie.fr](https://docs.erp-metallerie.fr)
- Issues : [GitHub Issues](https://github.com/votre-username/erp-metallerie/issues)

---

Développé avec ❤️ pour l'industrie de la construction métallique