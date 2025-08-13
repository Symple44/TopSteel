# 🚀 Plan d'Implémentation - Architecture Modulaire TopSteel ERP

## Phase 1 : Structure de Base (1-2 jours)

### 1.1 Créer la nouvelle structure de dossiers

```bash
# Structure à créer
apps/web/src/app/(app)/
├── layout.tsx              # Layout avec sidebar
├── page.tsx               # Redirection vers dashboard
├── dashboard/
│   └── page.tsx          # Dashboard principal
├── inventory/
├── partners/
├── sales/
├── finance/
└── admin/
```

### 1.2 Créer le Layout Principal

```typescript
// apps/web/src/app/(app)/layout.tsx
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

## Phase 2 : Module Inventory - Articles (2-3 jours)

### 2.1 Structure du Module

```
inventory/
├── page.tsx                    # Dashboard inventaire
├── layout.tsx                  # Layout du module
├── articles/
│   ├── page.tsx               # Liste des articles
│   ├── [id]/
│   │   ├── page.tsx          # Détail article
│   │   └── edit/page.tsx     # Édition article
│   ├── new/page.tsx          # Nouvel article
│   └── components/
│       ├── article-list.tsx
│       ├── article-form.tsx
│       └── article-filters.tsx
```

### 2.2 Page Liste des Articles

```typescript
// apps/web/src/app/(app)/inventory/articles/page.tsx
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default async function ArticlesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Articles</h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue d'articles
          </p>
        </div>
        <Link href="/inventory/articles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Article
          </Button>
        </Link>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Total Articles" value="1,234" />
        <StatCard title="En Stock" value="987" />
        <StatCard title="Rupture" value="45" />
        <StatCard title="Valeur Stock" value="€125,450" />
      </div>

      {/* Filtres */}
      <ArticleFilters />

      {/* Table */}
      <DataTable
        columns={articleColumns}
        endpoint="/api/inventory/articles"
      />
    </div>
  )
}
```

### 2.3 Colonnes de la DataTable

```typescript
// apps/web/src/app/(app)/inventory/articles/columns.tsx
export const articleColumns = [
  {
    accessorKey: "reference",
    header: "Référence",
    cell: ({ row }) => (
      <Link 
        href={`/inventory/articles/${row.original.id}`}
        className="font-medium text-primary hover:underline"
      >
        {row.getValue("reference")}
      </Link>
    )
  },
  {
    accessorKey: "designation",
    header: "Désignation",
  },
  {
    accessorKey: "category",
    header: "Catégorie",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("category")}
      </Badge>
    )
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock")
      return (
        <span className={stock > 0 ? "text-green-600" : "text-red-600"}>
          {stock}
        </span>
      )
    }
  },
  {
    accessorKey: "price",
    header: "Prix",
    cell: ({ row }) => formatCurrency(row.getValue("price"))
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ArticleActions article={row.original} />
    )
  }
]
```

### 2.4 Page Détail Article

```typescript
// apps/web/src/app/(app)/inventory/articles/[id]/page.tsx
export default async function ArticleDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const article = await getArticle(params.id)
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <Link href="/inventory">Inventaire</Link>
        <Link href="/inventory/articles">Articles</Link>
        <span>{article.reference}</span>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{article.designation}</h1>
          <p className="text-lg text-muted-foreground">
            Réf: {article.reference}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Dupliquer
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="stock">Stock</TabsTrigger>
          <TabsTrigger value="pricing">Tarification</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <ArticleGeneralInfo article={article} />
        </TabsContent>
        
        <TabsContent value="stock">
          <ArticleStock article={article} />
        </TabsContent>
        
        <TabsContent value="pricing">
          <ArticlePricing article={article} />
        </TabsContent>
        
        <TabsContent value="history">
          <ArticleHistory articleId={article.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Phase 3 : Routes API

### 3.1 Structure des Routes API

```
apps/web/src/app/api/
├── inventory/
│   ├── articles/
│   │   ├── route.ts           # GET (list), POST (create)
│   │   └── [id]/
│   │       ├── route.ts       # GET, PUT, DELETE
│   │       └── stock/
│   │           └── route.ts   # Mouvements de stock
│   └── materials/
│       └── route.ts
├── partners/
│   ├── clients/
│   │   └── route.ts
│   └── suppliers/
│       └── route.ts
└── sales/
    ├── quotes/
    │   └── route.ts
    └── orders/
        └── route.ts
```

### 3.2 Route API Articles

```typescript
// apps/web/src/app/api/inventory/articles/route.ts
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

const articleSchema = z.object({
  reference: z.string().min(1),
  designation: z.string().min(1),
  category: z.string(),
  price: z.number().positive(),
  // ...
})

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  
  const searchParams = request.nextUrl.searchParams
  const page = searchParams.get('page') || '1'
  const limit = searchParams.get('limit') || '10'
  const search = searchParams.get('search') || ''
  
  const articles = await fetchArticles({
    tenantId: session.user.tenantId,
    page: parseInt(page),
    limit: parseInt(limit),
    search
  })
  
  return Response.json(articles)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) return new Response('Unauthorized', { status: 401 })
  
  const body = await request.json()
  const validated = articleSchema.parse(body)
  
  const article = await createArticle({
    ...validated,
    tenantId: session.user.tenantId
  })
  
  return Response.json(article, { status: 201 })
}
```

## Phase 4 : Composants Réutilisables

### 4.1 Composant PageHeader

```typescript
// apps/web/src/components/ui/page-header.tsx
interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: Array<{ label: string; href?: string }>
}

export function PageHeader({ 
  title, 
  description, 
  actions, 
  breadcrumb 
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  )
}
```

### 4.2 Composant StatCard

```typescript
// apps/web/src/components/ui/stat-card.tsx
interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon?: React.ComponentType<{ className?: string }>
}

export function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <p className={`text-xs ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change}%
              </p>
            )}
          </div>
          {Icon && <Icon className="h-8 w-8 text-muted-foreground" />}
        </div>
      </CardContent>
    </Card>
  )
}
```

## Phase 5 : Navigation et Menu

### 5.1 Configuration du Menu

```typescript
// apps/web/src/config/navigation.ts
export const navigation = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Inventaire',
    icon: Package,
    children: [
      { title: 'Articles', href: '/inventory/articles' },
      { title: 'Matériaux', href: '/inventory/materials' },
      { title: 'Stock', href: '/inventory/stock' },
      { title: 'Catégories', href: '/inventory/categories' }
    ]
  },
  {
    title: 'Partenaires',
    icon: Users,
    children: [
      { title: 'Clients', href: '/partners/clients' },
      { title: 'Fournisseurs', href: '/partners/suppliers' },
      { title: 'Contacts', href: '/partners/contacts' }
    ]
  },
  {
    title: 'Ventes',
    icon: ShoppingCart,
    children: [
      { title: 'Devis', href: '/sales/quotes' },
      { title: 'Commandes', href: '/sales/orders' },
      { title: 'Contrats', href: '/sales/contracts' }
    ]
  },
  {
    title: 'Finance',
    icon: DollarSign,
    children: [
      { title: 'Factures', href: '/finance/invoices' },
      { title: 'Paiements', href: '/finance/payments' },
      { title: 'Rapports', href: '/finance/reports' }
    ]
  }
]
```

## Timeline de Migration

| Phase | Durée | Priorité | Description |
|-------|-------|----------|-------------|
| 1 | 2 jours | 🔴 Haute | Structure de base + Layout |
| 2 | 3 jours | 🔴 Haute | Module Inventory/Articles |
| 3 | 2 jours | 🔴 Haute | Routes API + Intégration |
| 4 | 3 jours | 🟡 Moyenne | Module Partners |
| 5 | 3 jours | 🟡 Moyenne | Module Sales |
| 6 | 3 jours | 🟡 Moyenne | Module Finance |
| 7 | 2 jours | 🟢 Basse | Refactoring Admin |
| 8 | 1 jour | 🟢 Basse | Tests + Documentation |

## Points d'Attention

1. **Compatibilité** : Maintenir les anciennes routes avec redirections
2. **Permissions** : Implémenter les contrôles d'accès dès le début
3. **Multi-tenant** : Toujours filtrer par tenantId
4. **Performance** : Lazy loading des modules
5. **Tests** : Tests E2E pour chaque module migré

Cette approche progressive permet de migrer l'application vers une architecture modulaire sans interruption de service.