# 🗺️ Roadmap d'Implémentation - Architecture Modulaire

## 📊 APIs Existantes vs Manquantes

### ✅ APIs Disponibles (à connecter)
| Module | API | Route | Status |
|--------|-----|-------|--------|
| Partners | ✅ Existe | `business/partners` | À migrer vers nouvelle structure |
| Materials | ✅ Existe | `business/materials` | À créer page UI |
| Shared Materials | ✅ Existe | `shared/materials` | À créer page UI |
| Search | ✅ Existe | `search` | Fonctionnel |
| Marketplace | ✅ Existe | `marketplace` | Page existe dans admin |

### ❌ APIs Manquantes (pages "En construction")
| Module | API | Action |
|--------|-----|--------|
| Articles | ❌ Manque | Page "En construction" |
| Stock | ❌ Manque | Page "En construction" |
| Devis | ❌ Manque | Page "En construction" |
| Commandes | ❌ Manque | Page "En construction" |
| Factures | ❌ Manque | Page "En construction" |
| Projets | ❌ Manque | Page "En construction" |

## 🚀 Plan d'Implémentation par Priorité

### JOUR 1 : Structure & Pages avec API

#### Matin : Structure de base
```bash
# Créer la structure
apps/web/src/app/(app)/
├── layout.tsx              # Réutiliser layout existant
├── page.tsx               # Redirect vers dashboard
└── dashboard/
    └── page.tsx           # Dashboard principal
```

#### Après-midi : Module Partners (API existe)
```bash
# Migrer partners existant
(protected)/partners → (app)/partners/

# Ajouter structure complète
(app)/partners/
├── page.tsx               # Vue d'ensemble
├── clients/
│   ├── page.tsx          # Liste clients (API: business/partners?type=CLIENT)
│   └── [id]/page.tsx     # Détail client
└── suppliers/
    ├── page.tsx          # Liste fournisseurs (API: business/partners?type=SUPPLIER)
    └── [id]/page.tsx     # Détail fournisseur
```

### JOUR 2 : Module Inventory

#### Module Materials (API existe)
```bash
(app)/inventory/
├── page.tsx               # Dashboard inventory
├── materials/
│   ├── page.tsx          # Liste (API: business/materials)
│   └── [id]/page.tsx     # Détail matériau
└── shared-materials/
    ├── page.tsx          # Liste (API: shared/materials)
    └── [id]/page.tsx     # Détail
```

#### Pages "En construction" (pas d'API)
```bash
(app)/inventory/
├── articles/
│   └── page.tsx          # "En construction"
└── stock/
    └── page.tsx          # "En construction"
```

### JOUR 3 : Modules Business "En construction"

#### Module Sales
```bash
(app)/sales/
├── page.tsx              # Dashboard sales "En construction"
├── quotes/
│   └── page.tsx         # "En construction"
└── orders/
    └── page.tsx         # "En construction"
```

#### Module Finance
```bash
(app)/finance/
├── page.tsx             # Dashboard finance "En construction"
└── invoices/
    └── page.tsx        # "En construction"
```

#### Module Projects
```bash
(app)/projects/
└── page.tsx            # "En construction"
```

### JOUR 4 : Navigation & Search

#### Mettre à jour la navigation
```typescript
// config/navigation.ts
export const navigation = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Inventaire',
    icon: Package,
    children: [
      { title: 'Matériaux', href: '/inventory/materials' }, // ✅ API
      { title: 'Matériaux partagés', href: '/inventory/shared-materials' }, // ✅ API
      { title: 'Articles', href: '/inventory/articles' }, // ⏳ En construction
      { title: 'Stock', href: '/inventory/stock' } // ⏳ En construction
    ]
  },
  {
    title: 'Partenaires',
    icon: Users,
    children: [
      { title: 'Clients', href: '/partners/clients' }, // ✅ API
      { title: 'Fournisseurs', href: '/partners/suppliers' } // ✅ API
    ]
  },
  {
    title: 'Ventes',
    icon: ShoppingCart,
    badge: 'Bientôt', // Indicateur visuel
    children: [
      { title: 'Devis', href: '/sales/quotes' }, // ⏳ En construction
      { title: 'Commandes', href: '/sales/orders' } // ⏳ En construction
    ]
  }
]
```

#### Corriger les URL de recherche
```typescript
// searchable-entities.config.ts
{
  type: 'material',
  urlPattern: '/inventory/materials/{id}', // ✅ Page existera
},
{
  type: 'article',
  urlPattern: '/inventory/articles/{id}', // ⏳ Page "En construction"
},
{
  type: 'client',
  urlPattern: '/partners/clients/{id}', // ✅ Page existera
}
```

### JOUR 5 : Vérifications & Tests

#### Utiliser les agents
```bash
# Agent qualité
- Vérifier structure des composants
- Pas de données mock
- Imports corrects

# Agent sécurité
- Multi-tenancy respecté
- Auth sur toutes les pages
- Permissions vérifiées

# Build
pnpm build
```

## 📝 Template Page "En Construction"

```typescript
// Template réutilisable pour pages sans API
import { Construction } from 'lucide-react'

interface UnderConstructionProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function UnderConstruction({ 
  title, 
  description = "Cette fonctionnalité sera bientôt disponible",
  icon: Icon = Construction 
}: UnderConstructionProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center space-y-4 max-w-md">
        <Icon className="h-16 w-16 text-muted-foreground mx-auto" />
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground text-lg">
          {description}
        </p>
        <div className="pt-4">
          <p className="text-sm text-muted-foreground">
            Nous travaillons activement sur cette fonctionnalité.
            Elle sera disponible prochainement.
          </p>
        </div>
      </div>
    </div>
  )
}

// Utilisation
export default function ArticlesPage() {
  return <UnderConstruction title="Articles" />
}
```

## ✅ Checklist par Module

### Module Partners (API ✅)
- [ ] Migrer de `(protected)` vers `(app)`
- [ ] Créer pages clients/suppliers
- [ ] Connecter à l'API `business/partners`
- [ ] Filtrer par type (CLIENT/SUPPLIER)
- [ ] Respecter multi-tenancy

### Module Materials (API ✅)
- [ ] Créer pages materials
- [ ] Connecter à l'API `business/materials`
- [ ] Créer pages shared-materials
- [ ] Connecter à l'API `shared/materials`

### Modules "En Construction" (API ❌)
- [ ] Articles → Page "En construction"
- [ ] Stock → Page "En construction"
- [ ] Devis → Page "En construction"
- [ ] Commandes → Page "En construction"
- [ ] Factures → Page "En construction"
- [ ] Projets → Page "En construction"

## 🎯 Résultat Attendu

### Ce qui sera fonctionnel
- ✅ Navigation complète
- ✅ Partners avec vraies données
- ✅ Materials avec vraies données
- ✅ Recherche globale avec bonnes URLs

### Ce qui sera "En construction"
- ⏳ Articles, Stock, Devis, Commandes, Factures, Projets
- ⏳ Mais avec pages propres et navigation fonctionnelle
- ⏳ Prêt pour intégration future des APIs

## 📌 Important

**PAS DE MOCK DATA** - On affiche soit :
1. Des vraies données depuis l'API
2. Une page "En construction" propre

**TOUJOURS VÉRIFIER** :
1. Auth requise sur toutes les pages
2. Multi-tenancy respecté
3. Build sans erreur
4. Navigation fonctionnelle