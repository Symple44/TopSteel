# 📋 Plan de Refactorisation - DataTable Component

## 🎯 Objectif
Refactoriser le composant DataTable (2447 lignes) en modules plus petits, maintenables et testables.

## 📊 Analyse Actuelle

### Problèmes Identifiés
1. **Taille excessive** : 2447 lignes dans un seul fichier
2. **Responsabilités multiples** : Gestion d'état, filtrage, tri, export, édition, vues multiples
3. **Complexité cognitive** : Difficile à comprendre et maintenir
4. **Tests difficiles** : Impossible de tester unitairement les fonctionnalités

### Points Positifs
- Déjà partiellement modularisé avec des imports de sous-composants
- Utilise des hooks personnalisés pour certaines fonctionnalités
- TypeScript bien typé

## 🏗️ Architecture Proposée

```
datatable/
├── DataTable.tsx (150 lignes max - Composant principal orchestrateur)
├── hooks/
│   ├── useDataTableState.ts (État principal)
│   ├── useDataFiltering.ts (Logique de filtrage)
│   ├── useDataSorting.ts (Logique de tri)
│   ├── useDataSelection.ts (Gestion de la sélection)
│   ├── useDataPagination.ts (Pagination)
│   └── useDataExport.ts (Export des données)
├── components/
│   ├── DataTableHeader/
│   │   ├── index.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ActionButtons.tsx
│   │   └── ViewToggle.tsx
│   ├── DataTableBody/
│   │   ├── index.tsx
│   │   ├── TableRow.tsx
│   │   ├── TableCell.tsx
│   │   └── InlineActions.tsx
│   ├── DataTableFooter/
│   │   ├── index.tsx
│   │   ├── Pagination.tsx
│   │   └── Summary.tsx
│   └── DataTableToolbar/
│       ├── index.tsx
│       ├── FilterPanel.tsx
│       ├── ColumnManager.tsx
│       └── BulkActions.tsx
├── utils/
│   ├── filterUtils.ts
│   ├── sortUtils.ts
│   ├── exportUtils.ts
│   └── dataTransformers.ts
└── contexts/
    └── DataTableContext.tsx (Context pour partager l'état)
```

## 📝 Plan d'Exécution

### Phase 1: Extraction des Hooks (Priorité Haute)
1. **useDataTableState** - Centraliser tout l'état
2. **useDataFiltering** - Extraire la logique de filtrage (lignes 236-500)
3. **useDataSorting** - Extraire la logique de tri
4. **useDataSelection** - Extraire la gestion de sélection

### Phase 2: Extraction des Composants UI
1. **DataTableHeader** - Barre de recherche, actions, vue
2. **DataTableBody** - Rendu des lignes et cellules
3. **DataTableFooter** - Pagination et résumé
4. **DataTableToolbar** - Filtres avancés et actions bulk

### Phase 3: Utils et Helpers
1. **filterUtils.ts** - Fonctions de filtrage pures
2. **sortUtils.ts** - Fonctions de tri pures
3. **dataTransformers.ts** - Transformations de données

### Phase 4: Context API
1. Créer **DataTableContext** pour partager l'état
2. Éviter le prop drilling
3. Permettre aux sous-composants d'accéder à l'état

## 💡 Principes de Refactorisation

### 1. Single Responsibility Principle
- Chaque module a une seule responsabilité
- Les hooks gèrent la logique
- Les composants gèrent le rendu

### 2. Composition Over Inheritance
- Utiliser la composition de composants
- Hooks composables
- Props bien définies

### 3. Pure Functions
- Extraire la logique en fonctions pures
- Faciliter les tests unitaires
- Améliorer la réutilisabilité

### 4. Type Safety
- Interfaces bien définies
- Génériques pour la flexibilité
- Pas de `any` types

## 🔄 Migration Progressive

### Étape 1: Créer la nouvelle structure
```typescript
// hooks/useDataFiltering.ts
export function useDataFiltering<T>(
  data: T[],
  columns: ColumnConfig<T>[],
  filters: FilterConfig[]
) {
  // Logique extraite
  return { filteredData, applyFilter, clearFilters }
}
```

### Étape 2: Intégrer dans le composant principal
```typescript
// DataTable.tsx
const { filteredData } = useDataFiltering(data, columns, filters)
```

### Étape 3: Tests unitaires
```typescript
// __tests__/useDataFiltering.test.ts
describe('useDataFiltering', () => {
  it('should filter data correctly', () => {
    // Tests
  })
})
```

## 📈 Métriques de Succès

- [ ] Aucun fichier > 300 lignes
- [ ] Couverture de tests > 80%
- [ ] Temps de build < 5s
- [ ] Complexité cyclomatique < 10 par fonction
- [ ] Aucune régression fonctionnelle

## ⚠️ Points d'Attention

1. **Compatibilité** : Maintenir l'API publique
2. **Performance** : Éviter les re-renders inutiles
3. **État partagé** : Bien gérer les dépendances
4. **Tests** : Écrire les tests avant la refacto

## 🚀 Prochaines Actions

1. Créer la structure de dossiers
2. Extraire `useDataFiltering` en premier
3. Tester l'intégration
4. Continuer avec les autres hooks
5. Documenter les changements

---

*Ce plan sera mis à jour au fur et à mesure de la refactorisation*