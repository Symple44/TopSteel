# DataTable Hooks Architecture

Cette documentation décrit l'architecture modulaire des hooks du DataTable.

## Vue d'ensemble

Le système de hooks du DataTable est organisé en plusieurs couches:

```
┌─────────────────────────────────────────┐
│         useDataTable (Hook orchestrateur)         │
│         392 lignes - Interface simplifiée         │
└─────────────────────────────────────────┘
                    ↓ utilise
┌─────────────────────────────────────────┐
│        Hooks spécialisés (découplés)     │
├─────────────────────────────────────────┤
│ • useDataFiltering (258 lignes)         │
│ • useDataSorting (172 lignes)           │
│ • useDataSelection (228 lignes)         │
│ • useDataPagination (260 lignes)        │
│ • useDataExport (337 lignes)            │
└─────────────────────────────────────────┘
```

## Hooks disponibles

### 1. Hook orchestrateur (Recommandé)

#### `useDataTable`
**Fichier:** `useDataTable.ts` (392 lignes)

Hook principal qui combine automatiquement tous les hooks spécialisés. C'est le hook recommandé pour la plupart des cas d'usage.

**Avantages:**
- Interface simple et cohérente
- Combine automatiquement tous les hooks
- Gère le pipeline de transformation des données
- Expose toutes les fonctionnalités

**Utilisation:**
```typescript
const table = useDataTable({
  data: users,
  columns: userColumns,
  keyField: 'id',
  sortable: true,
  filterable: true,
  pagination: { pageSize: 20 }
})

// Accès simplifié
table.data              // Données transformées
table.handleSort(...)   // Tri
table.setSearchTerm(...) // Recherche
table.toggleRow(...)    // Sélection
```

### 2. Hooks spécialisés (Pour usage avancé)

Ces hooks peuvent être utilisés individuellement pour des besoins spécifiques.

#### `useDataFiltering`
**Fichier:** `useDataFiltering.ts` (258 lignes)

Gère le filtrage des données avec support de:
- Recherche globale avec debounce
- Filtres par colonne
- Filtres avancés (groupes avec AND/OR)

**Utilisation:**
```typescript
const { filteredData, filters, setSearchTerm } = useDataFiltering({
  data: users,
  columns: userColumns,
  searchable: true,
  searchDebounceMs: 300
})
```

#### `useDataSorting`
**Fichier:** `useDataSorting.ts` (172 lignes)

Gère le tri des données avec support de:
- Tri simple et multi-colonnes
- Tri personnalisé par colonne
- Cycle asc/desc/none

**Utilisation:**
```typescript
const { sortedData, sortConfig, handleSort } = useDataSorting({
  data: filteredData,
  columns: userColumns,
  sortable: true,
  multiSort: false
})
```

#### `useDataSelection`
**Fichier:** `useDataSelection.ts` (228 lignes)

Gère la sélection de lignes avec support de:
- Sélection simple et multiple
- Sélection de plage (Shift+Click)
- Tout sélectionner/désélectionner

**Utilisation:**
```typescript
const { selection, selectedData, toggleRow, toggleAll } = useDataSelection({
  data: sortedData,
  keyField: 'id',
  selectable: true,
  onSelectionChange: (selection) => console.log(selection)
})
```

#### `useDataPagination`
**Fichier:** `useDataPagination.ts` (260 lignes)

Gère la pagination avec support de:
- Pagination client-side ou server-side
- Taille de page configurable
- Navigation entre pages

**Utilisation:**
```typescript
const { paginatedData, currentPage, totalPages, goToPage } = useDataPagination({
  data: sortedData,
  pagination: { pageSize: 20 }
})
```

#### `useDataExport`
**Fichier:** `useDataExport.ts` (337 lignes)

Gère l'export des données avec support de:
- Formats: CSV, Excel, JSON, PDF
- Export sélectif (lignes sélectionnées uniquement)
- Options personnalisées

**Utilisation:**
```typescript
const { exportData, isExporting } = useDataExport({
  data: sortedData,
  columns: userColumns,
  selectedRows: selection.selectedRows,
  keyField: 'id',
  exportable: true
})

await exportData('csv', { includeHeaders: true })
```

### 3. Hook legacy (Maintenu pour compatibilité)

#### `useDataTableState`
**Fichier:** `useDataTableState.ts` (413 lignes)

Version originale du hook orchestrateur. Identique à `useDataTable` mais avec une API légèrement différente (expose un objet `state`).

**Note:** Pour les nouveaux projets, préférez `useDataTable`.

### 4. Hooks utilitaires

#### `useVirtualizedTable`
**Fichier:** `useVirtualizedTable.ts`

Gère la virtualisation pour les grandes listes (optimisation de performance).

## Pipeline de transformation des données

Le hook `useDataTable` applique les transformations dans cet ordre:

```
Données brutes (data)
    ↓
[1] Filtrage (useDataFiltering)
    ├─ Recherche globale
    ├─ Filtres par colonne
    └─ Filtres avancés
    ↓
Données filtrées (filteredData)
    ↓
[2] Tri (useDataSorting)
    └─ Tri simple ou multi-colonnes
    ↓
Données triées (sortedData)
    ↓
[3] Sélection (useDataSelection)
    └─ Suivi des lignes sélectionnées
    ↓
[4] Pagination (useDataPagination)
    └─ Extraction de la page courante
    ↓
Données affichées (data)
```

## Hooks de test (version simple)

Pour les tests unitaires, des versions simplifiées sont disponibles:

- `useDataFiltering.simple.ts` (79 lignes)
- `useDataSorting.simple.ts` (41 lignes)

Ces versions ont une API simplifiée (retournent directement les données transformées) pour faciliter les tests.

**Note:** Ces fichiers ne doivent être utilisés que dans les tests.

## Choix du bon hook

### Utiliser `useDataTable` si:
- Vous avez besoin de plusieurs fonctionnalités (tri + filtrage + pagination)
- Vous voulez une interface simple et cohérente
- Vous créez un nouveau composant
- Vous ne voulez pas gérer manuellement le pipeline de données

### Utiliser les hooks spécialisés si:
- Vous n'avez besoin que d'une fonctionnalité spécifique
- Vous voulez un contrôle total sur le pipeline
- Vous optimisez les performances pour un cas très spécifique
- Vous créez votre propre hook orchestrateur personnalisé

### Utiliser `useDataTableState` si:
- Vous maintenez du code existant qui l'utilise déjà
- Vous préférez l'API avec objet `state`

## Exemples d'utilisation

### Exemple 1: Table simple avec tri et recherche

```typescript
const table = useDataTable({
  data: users,
  columns: userColumns,
  keyField: 'id',
  sortable: true,
  searchable: true
})

return (
  <div>
    <SearchBar value={table.searchTerm} onChange={table.setSearchTerm} />
    <DataTable
      data={table.data}
      columns={table.visibleColumns}
      sortConfig={table.sortConfig}
      onSort={table.handleSort}
    />
  </div>
)
```

### Exemple 2: Table avec toutes les fonctionnalités

```typescript
const table = useDataTable({
  data: users,
  columns: userColumns,
  keyField: 'id',
  sortable: true,
  filterable: true,
  searchable: true,
  selectable: true,
  exportable: true,
  pagination: { pageSize: 20 }
})

return (
  <div>
    <Toolbar>
      <SearchBar value={table.searchTerm} onChange={table.setSearchTerm} />
      <FilterButton filters={table.filters} onFiltersChange={table.setFilters} />
      <ExportButton onClick={() => table.exportData('csv')} />
    </Toolbar>

    <DataTable
      data={table.data}
      columns={table.visibleColumns}
      sortConfig={table.sortConfig}
      selection={table.selection}
      onSort={table.handleSort}
      onSelectRow={table.toggleRow}
      onSelectAll={table.toggleAll}
    />

    <Pagination
      currentPage={table.currentPage}
      totalPages={table.totalPages}
      onPageChange={table.goToPage}
    />
  </div>
)
```

### Exemple 3: Usage avancé avec hooks individuels

```typescript
// Filtrage personnalisé
const { filteredData, setSearchTerm } = useDataFiltering({
  data: users,
  columns: userColumns,
  searchable: true
})

// Tri avec multi-colonnes
const { sortedData, handleSort } = useDataSorting({
  data: filteredData,
  columns: userColumns,
  multiSort: true
})

// Pagination custom
const { paginatedData, goToPage } = useDataPagination({
  data: sortedData,
  pagination: { pageSize: 50 }
})
```

## Taille des fichiers

| Hook | Lignes | Description |
|------|--------|-------------|
| `useDataTable.ts` | 392 | Hook orchestrateur recommandé |
| `useDataTableState.ts` | 413 | Hook legacy (compatible) |
| `useDataExport.ts` | 337 | Export de données |
| `useDataPagination.ts` | 260 | Pagination |
| `useDataFiltering.ts` | 258 | Filtrage et recherche |
| `useDataSelection.ts` | 228 | Sélection de lignes |
| `useDataSorting.ts` | 172 | Tri de données |
| `useDataFiltering.simple.ts` | 79 | Version simplifiée (tests) |
| `useDataSorting.simple.ts` | 41 | Version simplifiée (tests) |

## Prochaines étapes de refactoring

Pour continuer à améliorer l'architecture:

1. **Diviser les gros hooks** (> 250 lignes):
   - `useDataExport.ts` (337 lignes) → Extraire la logique d'export par format
   - `useDataPagination.ts` (260 lignes) → Séparer pagination client/server
   - `useDataFiltering.ts` (258 lignes) → Extraire la logique de filtres avancés

2. **Créer des sous-hooks**:
   - `useAdvancedFilters.ts` - Logique des filtres avancés
   - `useExportFormats.ts` - Gestion des formats d'export
   - `useServerPagination.ts` - Pagination côté serveur

3. **Optimiser les performances**:
   - Ajouter des options de memoization
   - Implémenter la virtualisation par défaut pour les grandes listes
   - Lazy loading pour les données volumineuses
