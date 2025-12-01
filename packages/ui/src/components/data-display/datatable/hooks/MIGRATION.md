# Migration Guide: useDataTableState → useDataTable

## Vue d'ensemble

Le nouveau hook `useDataTable` est une version améliorée et mieux structurée de `useDataTableState`. Il offre les mêmes fonctionnalités mais avec une architecture plus modulaire et maintenable.

## Différences principales

### Architecture

**Avant (useDataTableState):**
- Hook monolithique de 413 lignes
- État consolidé dans un objet `state`
- Utilise les sous-hooks mais les expose via une interface unique

**Après (useDataTable):**
- Hook orchestrateur de 392 lignes
- Expose directement les propriétés et méthodes des sous-hooks
- Architecture plus claire et modulaire

### Utilisation

Les deux hooks ont **exactement la même signature** pour les options, donc le code existant est compatible.

#### Avant

```typescript
import { useDataTableState } from '@repo/ui'

const { state, setFilters, handleSort, toggleRow } = useDataTableState({
  data: users,
  columns: userColumns,
  keyField: 'id',
  sortable: true,
  filterable: true,
  pagination: { pageSize: 20 }
})

// Utilisation
<DataTable
  data={state.displayData}
  columns={state.visibleColumns}
  sortConfig={state.sortConfig}
  onSort={handleSort}
/>
```

#### Après

```typescript
import { useDataTable } from '@repo/ui'

const table = useDataTable({
  data: users,
  columns: userColumns,
  keyField: 'id',
  sortable: true,
  filterable: true,
  pagination: { pageSize: 20 }
})

// Utilisation - Plus simple, pas besoin de state.XXX
<DataTable
  data={table.data}
  columns={table.visibleColumns}
  sortConfig={table.sortConfig}
  onSort={table.handleSort}
/>
```

## Mapping des propriétés

| useDataTableState | useDataTable | Notes |
|-------------------|--------------|-------|
| `state.displayData` | `data` | Nom simplifié |
| `state.visibleColumns` | `visibleColumns` | Identique |
| `state.filters` | `filters` | Identique |
| `state.searchTerm` | `searchTerm` | Identique |
| `state.debouncedSearchTerm` | `debouncedSearchTerm` | Identique |
| `state.advancedFilters` | `advancedFilters` | Identique |
| `state.isFiltered` | `isFiltered` | Identique |
| `state.isSearchPending` | `isSearchPending` | Identique |
| `state.sortConfig` | `sortConfig` | Identique |
| `state.selection` | `selection` | Identique |
| `state.selectedData` | `selectedData` | Identique |
| `state.currentPage` | `currentPage` | Identique |
| `state.pageSize` | `pageSize` | Identique |
| `state.totalPages` | `totalPages` | Identique |
| `state.paginationInfo` | `paginationInfo` | Identique |
| `state.isExporting` | `isExporting` | Identique |
| `state.loading` | `loading` | Identique |
| `state.error` | `error` | Identique |
| `state.settings` | `settings` | Identique |
| `state.processedData` | `filtering.filteredData + sorting.sortedData` | Données intermédiaires |
| - | `totalCount` | Nouvelle propriété: nombre total d'éléments filtrés |

## Nouvelles fonctionnalités

Le hook `useDataTable` expose également des méthodes supplémentaires des sous-hooks:

### Tri
- `getSortDirection(columnId)` - Obtenir la direction de tri d'une colonne
- `addSort(columnId, direction)` - Ajouter un tri
- `removeSort(columnId)` - Supprimer un tri
- `toggleSort(columnId)` - Basculer le tri
- `isSorted(columnId)` - Vérifier si une colonne est triée
- `canSort(columnId)` - Vérifier si une colonne peut être triée
- `sortIndex(columnId)` - Position dans l'ordre de tri

### Filtrage
- `updateFilter(field, value, operator)` - Mettre à jour un filtre existant

## Exemple de migration complète

### Avant

```typescript
import { useDataTableState } from '@repo/ui'

function UsersTable() {
  const {
    state,
    setFilters,
    setSearchTerm,
    handleSort,
    toggleRow,
    toggleAll,
    goToPage,
    setPageSize,
    exportData
  } = useDataTableState({
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
      <SearchBar
        value={state.searchTerm}
        onChange={setSearchTerm}
      />
      <DataTable
        data={state.displayData}
        columns={state.visibleColumns}
        sortConfig={state.sortConfig}
        selection={state.selection}
        onSort={handleSort}
        onSelectRow={toggleRow}
        onSelectAll={toggleAll}
      />
      <Pagination
        currentPage={state.currentPage}
        totalPages={state.totalPages}
        pageSize={state.pageSize}
        onPageChange={goToPage}
        onPageSizeChange={setPageSize}
      />
      <Button onClick={() => exportData('csv')}>
        Export
      </Button>
    </div>
  )
}
```

### Après

```typescript
import { useDataTable } from '@repo/ui'

function UsersTable() {
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
      <SearchBar
        value={table.searchTerm}
        onChange={table.setSearchTerm}
      />
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
        pageSize={table.pageSize}
        onPageChange={table.goToPage}
        onPageSizeChange={table.setPageSize}
      />
      <Button onClick={() => table.exportData('csv')}>
        Export
      </Button>
    </div>
  )
}
```

## Avantages du nouveau hook

1. **Code plus lisible**: `table.data` au lieu de `state.displayData`
2. **Meilleure découvrabilité**: Toutes les méthodes disponibles directement sur l'objet retourné
3. **Architecture modulaire**: Plus facile à maintenir et étendre
4. **Accès aux fonctionnalités avancées**: Méthodes supplémentaires exposées des sous-hooks
5. **Performance identique**: Utilise les mêmes sous-hooks optimisés

## Compatibilité

Les deux hooks peuvent coexister dans le projet. Vous pouvez migrer progressivement vos composants de `useDataTableState` vers `useDataTable`.

## Recommandation

Pour les **nouveaux composants**, utilisez `useDataTable`.

Pour les **composants existants**, vous pouvez:
- Les laisser avec `useDataTableState` (stable et fonctionnel)
- Les migrer vers `useDataTable` pour bénéficier de l'API plus simple

Les deux approches sont valides et supportées.
