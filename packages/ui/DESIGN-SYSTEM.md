# TopSteel Design System

> Architecture modulaire du package `@erp/ui`
> Version 2.1.0 | Mise à jour: 29 novembre 2025

---

## Structure

```
packages/ui/src/
├── tokens/          # Design tokens (couleurs, typo, spacing...)
├── themes/          # Thèmes light/dark/system
├── variants/        # Variants CVA consolidés
├── components/      # Composants UI
│   ├── primitives/  # Composants atomiques (Button, Input...)
│   ├── data-display/# Affichage données (DataTable, Badge...)
│   ├── feedback/    # Feedback (Toast, Dialog...)
│   ├── forms/       # Formulaires (Form, Pagination...)
│   ├── layout/      # Mise en page (Card, PageHeader...)
│   ├── navigation/  # Navigation (Tabs, Dropdown...)
│   └── theme/       # Provider de thème
├── hooks/           # Hooks réutilisables
├── lib/             # Utilitaires (cn, design-system legacy)
└── index.ts         # API publique
```

---

## 1. Tokens

Les design tokens sont les valeurs fondamentales du design system.

### Import

```typescript
// Tous les tokens
import { tokens } from '@erp/ui/tokens'

// Tokens individuels
import { semanticColors, steelPalette, brandColor } from '@erp/ui/tokens'
import { spacing, componentSizes } from '@erp/ui/tokens'
import { statusByKey } from '@erp/ui/tokens'
```

### Fichiers

| Fichier | Description |
|---------|-------------|
| `colors.ts` | Couleurs sémantiques, palette steel, couleur brand |
| `typography.ts` | Fonts, tailles, weights, letter-spacing |
| `spacing.ts` | Espacements, tailles composants, containers |
| `shadows.ts` | Ombres box, focus rings |
| `radius.ts` | Border radius |
| `animations.ts` | Durées, easings, keyframes |
| `status.ts` | 13 statuts métier (projet, devis, production, stock) |
| `palettes.ts` | Palettes additionnelles (emerald, amber) |

### Couleur Brand

```typescript
// Bleu acier TopSteel
brandColor.light  // hsl(217 91% 45%)
brandColor.dark   // hsl(217 91% 60%)
```

### Statuts Métier

```typescript
import { statusByKey } from '@erp/ui/tokens'

// Usage
const status = statusByKey.EN_COURS
// { bg: 'bg-blue-500', bgLight: 'bg-blue-50', text: 'text-blue-700', ... }

// Tous les statuts disponibles:
// Projets: EN_COURS, TERMINE, ANNULE, BROUILLON
// Devis: EN_ATTENTE, ACCEPTE, REFUSE
// Production: PLANIFIE, EN_PRODUCTION, CONTROLE_QUALITE
// Stock: EN_STOCK, RUPTURE, STOCK_FAIBLE
```

---

## 2. Themes

Gestion des thèmes light/dark/system.

### Import

```typescript
import {
  lightTheme,
  darkTheme,
  themeRegistry,
  getThemeConfig,
  resolveTheme,
  getSystemTheme
} from '@erp/ui/themes'
```

### Thèmes Disponibles

| Thème | Description |
|-------|-------------|
| `light` | Thème clair (défaut) |
| `dark` | Thème sombre |
| `system` | Suit les préférences système |
| `vibrant` | En réserve (`_vibrant.ts`) |

### Utilitaires

```typescript
// Résoudre un thème
const resolved = resolveTheme('system') // 'light' ou 'dark'

// Détecter le thème système
const systemPref = getSystemTheme() // 'light' ou 'dark'

// Obtenir la config d'un thème
const config = getThemeConfig('dark')
```

---

## 3. Variants

Variants CVA (class-variance-authority) pour le styling des composants.

### Import

```typescript
import {
  buttonVariants,
  inputVariants,
  cardVariants,
  dropdownContentVariants,
  tooltipVariants,
  selectTriggerVariants,
  dialogContentVariants,
  tableVariants,
  badgeVariants,
  alertVariants
} from '@erp/ui/variants'
```

### Composants Supportés

| Variant | Fichier | Options |
|---------|---------|---------|
| Button | `button.variants.ts` | variant, size |
| Input | `input.variants.ts` | variant, size, state |
| Card | `card.variants.ts` | variant, padding, hover |
| Dropdown | `dropdown.variants.ts` | variant, size, align |
| Tooltip | `tooltip.variants.ts` | variant, size |
| Select | `select.variants.ts` | variant, size, state |
| Dialog | `dialog.variants.ts` | size, variant |
| Table | `table.variants.ts` | variant, size, header |
| Sidebar | `sidebar.variants.ts` | variant, size |
| Badge | `badge.variants.ts` | variant, size |
| Alert | `alert.variants.ts` | variant |

### Exemple d'Usage

```tsx
import { buttonVariants } from '@erp/ui/variants'
import { cn } from '@erp/ui'

// Dans un composant
<button className={cn(
  buttonVariants({ variant: 'primary', size: 'md' }),
  className
)}>
  Click me
</button>
```

---

## 4. Composants

### Primitives

Composants atomiques de base.

```typescript
import {
  Button,
  Input,
  Checkbox,
  Switch,
  Select, SelectTrigger, SelectContent, SelectItem,
  Dialog, DialogContent, DialogHeader, DialogTitle,
  Tooltip, TooltipTrigger, TooltipContent,
  Progress,
  RadioGroup, RadioGroupItem,
  Textarea
} from '@erp/ui'
```

### Data Display

```typescript
import {
  DataTable,           // Table avancée avec tri, filtre, pagination
  Badge,
  Avatar, AvatarImage, AvatarFallback,
  Table, TableHeader, TableBody, TableRow, TableCell
} from '@erp/ui'
```

### Feedback

```typescript
import {
  Toast, Toaster,
  SkeletonLoader, CardSkeleton, TableSkeleton,
  EmptyState, SearchEmptyState, TableEmptyState,
  LoadingSpinner, FullPageSpinner, ButtonSpinner,
  SuccessState, FormSuccessState
} from '@erp/ui'
```

### Forms

```typescript
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
  Pagination,
  DateRangePicker,
  FileUpload,
  FormWizard, useWizard
} from '@erp/ui'
```

### Layout

```typescript
import {
  Card, CardHeader, CardContent, CardFooter,
  PageHeader,
  PageContainer, PageSection, PageGrid, PageRow,
  ScrollArea, ScrollBar,
  Separator
} from '@erp/ui'
```

### Navigation

```typescript
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Breadcrumb, AutoBreadcrumb,
  Command, CommandInput, CommandList, CommandItem
} from '@erp/ui'
```

---

## 5. DataTable

Architecture modulaire du composant DataTable.

### Structure

```
data-display/datatable/
├── DataTable.tsx        # Composant principal
├── types.ts             # Types unifiés
├── contexts/            # DataTableContext
├── components/
│   ├── DataTableHeader/ # En-tête avec tri et filtres
│   ├── DataTableBody/   # Corps avec sélection et actions
│   └── DataTableFooter/ # Pagination et export
├── hooks/
│   ├── useDataFiltering.ts
│   ├── useDataSorting.ts
│   ├── useDataSelection.ts
│   ├── useDataPagination.ts
│   ├── useDataExport.ts
│   └── useVirtualizedTable.ts
└── views/               # Vues alternatives (optionnel)
    ├── KanbanView.tsx
    ├── CardsView.tsx
    ├── TimelineView.tsx
    └── CalendarView.tsx
```

### Usage

```tsx
import { DataTable, type ColumnConfig } from '@erp/ui'

const columns: ColumnConfig<Project>[] = [
  {
    key: 'name',
    header: 'Nom',
    sortable: true,
    filterable: true
  },
  {
    key: 'status',
    header: 'Statut',
    render: (value) => <StatusBadge status={value} />
  }
]

<DataTable
  data={projects}
  columns={columns}
  pagination={{ pageSize: 20 }}
  selection={{ enabled: true }}
  onRowClick={(row) => navigate(`/projects/${row.id}`)}
/>
```

---

## 6. Hooks

```typescript
import { useTheme } from '@erp/ui'
import { usePersistedTableSettings } from '@erp/ui'
import { useUniqueId, useFormFieldIds } from '@erp/ui'
```

---

## 7. Utilitaires

### cn (classnames)

```typescript
import { cn } from '@erp/ui'

// Fusion de classes conditionnelles
cn('base-class', isActive && 'active', className)
```

### CVA

```typescript
import { cva, type VariantProps } from '@erp/ui'

const myVariants = cva('base-styles', {
  variants: {
    size: { sm: '...', md: '...', lg: '...' }
  },
  defaultVariants: { size: 'md' }
})
```

---

## Migration depuis design-system/

L'ancien module `lib/design-system.ts` est conservé pour backward compatibility.

```typescript
// Ancien (fonctionne toujours)
import { buttonVariants } from '@erp/ui'

// Nouveau (recommandé)
import { buttonVariants } from '@erp/ui/variants'
```

---

## Configuration Technique

- **Tailwind CSS v4** - Framework CSS utilitaire
- **CVA** - class-variance-authority pour les variants
- **Radix UI** - Primitives accessibles
- **TypeScript** - Types stricts exportés

---

## Notes

- **Mobile:** Non supporté (application mobile dédiée)
- **Langues:** FR, EN, ES
- **Thème par défaut:** Light
- **Couleur brand:** Bleu acier `hsl(217 91% 45%)`
