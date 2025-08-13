# Nouvelle Architecture Modulaire - TopSteel ERP

## Vue d'ensemble

Cette documentation décrit la nouvelle architecture modulaire implémentée pour l'application TopSteel ERP. L'architecture a été refactorisée pour améliorer la maintenabilité, la modularité et l'expérience développeur.

## Structure des Dossiers

```
apps/web/src/app/
├── (app)/                    # Groupe de routes pour les modules métier
│   ├── layout.tsx           # Layout partagé avec AuthGuard et DashboardContent
│   ├── partners/            # Module partenaires
│   │   ├── page.tsx        # Liste tous les partenaires
│   │   ├── clients/        # Sous-module clients
│   │   │   └── page.tsx
│   │   └── suppliers/      # Sous-module fournisseurs
│   │       └── page.tsx
│   ├── inventory/          # Module inventaire
│   │   ├── page.tsx       # Redirige vers materials
│   │   ├── materials/     # Gestion des matériaux (connecté à l'API)
│   │   │   └── page.tsx
│   │   ├── articles/      # Articles (En construction)
│   │   │   └── page.tsx
│   │   └── stock/         # Gestion des stocks (En construction)
│   │       └── page.tsx
│   ├── sales/             # Module ventes
│   │   ├── page.tsx      # Redirige vers quotes
│   │   ├── quotes/       # Devis (En construction)
│   │   │   └── page.tsx
│   │   └── orders/       # Commandes (En construction)
│   │       └── page.tsx
│   ├── finance/          # Module finance
│   │   ├── page.tsx     # Redirige vers invoices
│   │   └── invoices/    # Factures (En construction)
│   │       └── page.tsx
│   └── projects/        # Module projets (En construction)
│       └── page.tsx
├── (dashboard)/         # Groupe de routes existant (admin, settings, etc.)
└── (auth)/             # Groupe de routes pour l'authentification
```

## Routes et Navigation

### Routes Principales

| Module | Route | Description | État |
|--------|-------|-------------|------|
| **Partenaires** | `/partners` | Liste tous les partenaires | ✅ Fonctionnel |
| | `/partners/clients` | Filtre clients uniquement | ✅ Fonctionnel |
| | `/partners/suppliers` | Filtre fournisseurs uniquement | ✅ Fonctionnel |
| **Inventaire** | `/inventory/materials` | Gestion des matériaux | ✅ Connecté API |
| | `/inventory/articles` | Gestion des articles | 🚧 En construction |
| | `/inventory/stock` | Mouvements de stock | 🚧 En construction |
| **Ventes** | `/sales/quotes` | Gestion des devis | 🚧 En construction |
| | `/sales/orders` | Gestion des commandes | 🚧 En construction |
| **Finance** | `/finance/invoices` | Gestion des factures | 🚧 En construction |
| **Projets** | `/projects` | Gestion des projets | 🚧 En construction |

### Redirections Automatiques

Les anciennes URLs sont automatiquement redirigées vers les nouvelles :

- `/protected/*` → `/*` (suppression du préfixe protected)
- Routes racines des modules redirigent vers leur sous-module principal

## Composants Clés

### 1. Layout (app)

```typescript
// apps/web/src/app/(app)/layout.tsx
export default function AppLayout({ children }: AppLayoutProps) {
  const { requiresCompanySelection, company } = useAuth()
  
  return (
    <ConnectionProvider>
      <AuthGuard>
        <DashboardContent requiresCompanySelection={requiresCompanySelection} company={company}>
          {children}
        </DashboardContent>
      </AuthGuard>
    </ConnectionProvider>
  )
}
```

### 2. Component UnderConstruction

Utilisé pour les pages en cours de développement :

```typescript
<UnderConstruction 
  title="Titre du module"
  description="Description du module"
  icon={IconComponent}
/>
```

### 3. Hooks API

Chaque module a ses propres hooks pour interagir avec l'API :

- `usePartners()` - Gestion des partenaires
- `useMaterials()` - Gestion des matériaux
- Plus à venir...

## Configuration de la Recherche

Les patterns d'URL dans `searchable-entities.config.ts` ont été mis à jour :

```typescript
{
  type: 'client',
  urlPattern: '/partners/clients?id={id}',
  // ...
},
{
  type: 'material',
  urlPattern: '/inventory/materials/{id}',
  // ...
}
```

## Sidebar et Navigation

La sidebar a été mise à jour avec la nouvelle structure :

```typescript
const navigation = [
  {
    title: 'Partenaires',
    icon: Users,
    children: [
      { title: 'Tous les partenaires', href: '/partners' },
      { title: 'Clients', href: '/partners/clients' },
      { title: 'Fournisseurs', href: '/partners/suppliers' },
    ],
  },
  {
    title: 'Inventaire',
    icon: Package,
    children: [
      { title: 'Matériaux', href: '/inventory/materials' },
      { title: 'Articles', href: '/inventory/articles' },
      { title: 'Stock', href: '/inventory/stock' },
    ],
  },
  // ...
]
```

## Principes de Développement

### 1. Pas de Données Mock

- Toujours utiliser de vraies connexions API
- Si l'API n'existe pas, afficher "En construction"
- Utiliser le composant `UnderConstruction` pour les pages non implémentées

### 2. Architecture Modulaire

- Chaque module métier dans son propre dossier
- Séparation claire entre modules
- Layout partagé pour l'authentification et la navigation

### 3. Redirections et Compatibilité

- Support des anciennes URLs via redirections
- Middleware gérant automatiquement les redirections
- Redirections permanentes (301) pour le SEO

### 4. Sécurité Multi-Tenant

- AuthGuard dans le layout principal
- Tenant ID géré automatiquement
- Isolation des données par tenant

## Prochaines Étapes

### Court Terme
- [ ] Implémenter MenuSyncService pour auto-insertion des menus
- [ ] Finaliser les tests de sécurité multi-tenant
- [ ] Compléter les pages "En construction"

### Moyen Terme
- [ ] Connecter tous les modules à leurs APIs respectives
- [ ] Implémenter la gestion des permissions par module
- [ ] Ajouter des tests E2E pour la navigation

### Long Terme
- [ ] Migration complète depuis (protected) vers (app)
- [ ] Système de plugins pour extensions tierces
- [ ] Dashboard personnalisable par utilisateur

## Build et Déploiement

```bash
# Build de développement
pnpm dev

# Build de production
pnpm build

# Tests
pnpm test

# Vérification qualité du code
npx @biomejs/biome check --write src/app/(app)
```

## Conventions de Code

- TypeScript strict mode
- Biome pour le formatage et linting
- Pas de `any` types (utiliser `unknown` ou types spécifiques)
- Imports organisés (React > packages > local)
- Components fonctionnels avec hooks

## Migration Guide

Pour migrer un module existant :

1. Créer la structure dans `(app)/module-name/`
2. Copier/adapter les composants existants
3. Mettre à jour les imports et routes
4. Ajouter les redirections dans le middleware
5. Mettre à jour la sidebar
6. Tester les anciennes URLs

## Support et Documentation

Pour plus d'informations :
- Documentation API : `/api/docs`
- Guide développeur : `DEVELOPER_GUIDE.md`
- Issues : GitHub Issues