# 🏗️ Architecture du Projet ERP Métallerie

## 📁 Structure des dossiers

```
erp-metallerie/
├── src/
│   ├── app/                      # App Router Next.js 14
│   │   ├── (auth)/              # Groupe de routes publiques
│   │   │   ├── login/           # Page de connexion
│   │   │   └── register/        # Page d'inscription
│   │   ├── (dashboard)/         # Groupe de routes protégées
│   │   │   ├── layout.tsx       # Layout avec sidebar
│   │   │   ├── dashboard/       # Page dashboard
│   │   │   ├── projets/         # Module projets
│   │   │   ├── stocks/          # Module stocks
│   │   │   ├── chiffrage/       # Module chiffrage
│   │   │   ├── production/      # Module production
│   │   │   └── clients/         # Module clients
│   │   ├── api/                 # Routes API Next.js
│   │   ├── layout.tsx           # Layout racine
│   │   ├── page.tsx             # Page d'accueil
│   │   └── globals.css          # Styles globaux
│   │
│   ├── components/              # Composants React
│   │   ├── ui/                  # Composants UI réutilisables
│   │   │   ├── button.tsx       # Boutons
│   │   │   ├── card.tsx         # Cartes
│   │   │   ├── input.tsx        # Champs de saisie
│   │   │   └── ...              # Autres composants UI
│   │   ├── layout/              # Composants de mise en page
│   │   │   ├── sidebar.tsx      # Barre latérale
│   │   │   └── header.tsx       # En-tête
│   │   └── projets/             # Composants spécifiques projets
│   │       ├── projet-info-tab.tsx
│   │       ├── projet-devis-tab.tsx
│   │       └── ...
│   │
│   ├── hooks/                   # Hooks personnalisés
│   │   ├── use-projets.ts       # Hook pour les projets
│   │   ├── use-stocks.ts        # Hook pour les stocks
│   │   └── use-auth.ts          # Hook d'authentification
│   │
│   ├── lib/                     # Utilitaires et configuration
│   │   ├── api-client.ts        # Client API Axios
│   │   └── utils.ts             # Fonctions utilitaires
│   │
│   ├── services/                # Services API
│   │   ├── auth.service.ts      # Service authentification
│   │   ├── projets.service.ts   # Service projets
│   │   └── stocks.service.ts    # Service stocks
│   │
│   ├── store/                   # État global (Zustand)
│   │   ├── index.ts             # Store principal
│   │   └── slices/              # Slices du store
│   │       ├── auth.slice.ts    # Slice authentification
│   │       ├── ui.slice.ts      # Slice interface
│   │       ├── projet.slice.ts  # Slice projets
│   │       └── stock.slice.ts   # Slice stocks
│   │
│   └── types/                   # Types TypeScript
│       └── index.ts             # Types principaux
│
├── public/                      # Assets statiques
├── scripts/                     # Scripts utilitaires
├── docs/                        # Documentation
├── .env.example                 # Variables d'environnement exemple
├── .gitignore                   # Fichiers ignorés par Git
├── next.config.mjs              # Configuration Next.js
├── package.json                 # Dépendances et scripts
├── tailwind.config.ts           # Configuration Tailwind CSS
└── tsconfig.json                # Configuration TypeScript
```

## 🔧 Stack Technique

### Frontend
- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **UI Components** : Radix UI + shadcn/ui
- **State Management** : Zustand
- **Data Fetching** : React Query (TanStack Query)
- **Forms** : React Hook Form + Zod
- **Charts** : Recharts
- **Icons** : Lucide React

### Outils de développement
- **Linting** : ESLint
- **Formatting** : Prettier
- **Git Hooks** : Husky (optionnel)
- **Testing** : Jest + React Testing Library (à implémenter)

## 🏛️ Patterns d'Architecture

### 1. **Séparation des responsabilités**

```typescript
// Service : Logique API
class ProjetsService {
  async getAll() { /* API call */ }
  async create() { /* API call */ }
}

// Hook : Logique React Query
function useProjets() {
  return useQuery({
    queryKey: ['projets'],
    queryFn: projetsService.getAll
  })
}

// Composant : UI uniquement
function ProjetsList() {
  const { data: projets } = useProjets()
  return <div>{/* UI */}</div>
}
```

### 2. **État global avec Zustand**

```typescript
// Store centralisé
const useStore = create((set) => ({
  // État
  user: null,
  isAuthenticated: false,
  
  // Actions
  login: async (credentials) => {
    const user = await authService.login(credentials)
    set({ user, isAuthenticated: true })
  }
}))
```

### 3. **Types TypeScript stricts**

```typescript
// Types centralisés
interface Projet {
  id: string
  reference: string
  client: Client
  statut: ProjetStatut
  // ...
}

// Enums pour les valeurs fixes
enum ProjetStatut {
  BROUILLON = 'BROUILLON',
  EN_COURS = 'EN_COURS',
  TERMINE = 'TERMINE'
}
```

### 4. **Composants modulaires**

```
components/
├── ui/              # Composants de base (Button, Input, etc.)
├── layout/          # Composants de structure (Header, Sidebar)
├── features/        # Composants métier réutilisables
└── [module]/        # Composants spécifiques à un module
```

## 🔄 Flux de données

```
User Action → Component → Hook → Service → API
                ↓                    ↓
              Store ← ← ← ← ← Response
                ↓
            Re-render
```

1. **Action utilisateur** : Click, form submit, etc.
2. **Component** : Gère l'UI et appelle les hooks
3. **Hook** : Utilise React Query pour les appels API
4. **Service** : Encapsule la logique API
5. **Store** : Met à jour l'état global si nécessaire
6. **Re-render** : React met à jour l'UI

## 🔐 Sécurité

### Authentification
- JWT stocké dans le store Zustand
- Refresh token automatique
- Middleware de protection des routes

### Validation
- Validation côté client avec Zod
- Sanitization des entrées
- Protection CSRF (à implémenter)

## 🚀 Performance

### Optimisations appliquées
- Code splitting automatique (Next.js)
- Lazy loading des composants lourds
- Images optimisées (Next/Image)
- Mise en cache avec React Query
- Debounce sur les recherches

### À implémenter
- Service Worker pour offline
- Compression gzip/brotli
- CDN pour les assets
- Pagination côté serveur

## 📦 Modules principaux

### 1. **Projets**
- CRUD complet
- Workflow de validation
- Documents attachés
- Visualisation 3D (à implémenter)

### 2. **Stocks**
- Inventaire temps réel
- Alertes automatiques
- Mouvements de stock
- Optimisation des chutes

### 3. **Chiffrage**
- Calculateur avancé
- Templates réutilisables
- Export PDF
- Historique

### 4. **Production**
- Ordres de fabrication
- Planning visuel
- Suivi temps réel
- Performance metrics

### 5. **Clients**
- Base de données complète
- Historique des projets
- Statistiques
- Export

## 🔌 Points d'extension

### Ajouter un nouveau module

1. **Créer le dossier** : `src/app/(dashboard)/nouveau-module/`
2. **Ajouter les types** : Dans `src/types/index.ts`
3. **Créer le service** : `src/services/nouveau-module.service.ts`
4. **Créer les hooks** : `src/hooks/use-nouveau-module.ts`
5. **Ajouter au menu** : Dans `src/components/layout/sidebar.tsx`

### Ajouter une nouvelle API

```typescript
// 1. Service
class NouveauService {
  async getData() {
    return apiClient.get('/nouveau-endpoint')
  }
}

// 2. Hook
export function useNouveauData() {
  return useQuery({
    queryKey: ['nouveau-data'],
    queryFn: nouveauService.getData
  })
}

// 3. Utilisation
function MonComposant() {
  const { data } = useNouveauData()
  // ...
}
```

## 🧪 Tests (à implémenter)

### Structure proposée
```
__tests__/
├── unit/           # Tests unitaires
├── integration/    # Tests d'intégration
└── e2e/           # Tests end-to-end
```

### Stratégie de tests
- **Composants UI** : React Testing Library
- **Hooks** : @testing-library/react-hooks
- **Services** : Jest avec mocks
- **E2E** : Playwright ou Cypress

## 📈 Monitoring (à implémenter)

### Outils recommandés
- **Erreurs** : Sentry
- **Performance** : Vercel Analytics
- **Logs** : LogRocket
- **APM** : New Relic

## 🚀 Déploiement

### Environnements
- **Development** : localhost:3000
- **Staging** : staging.erp-metallerie.com
- **Production** : app.erp-metallerie.com

### CI/CD Pipeline
1. Push sur `main`
2. Tests automatiques
3. Build Docker
4. Déploiement sur Vercel/AWS

---

Cette architecture est conçue pour être **scalable**, **maintenable** et **performante**. Elle suit les best practices de Next.js et React tout en restant flexible pour les évolutions futures.