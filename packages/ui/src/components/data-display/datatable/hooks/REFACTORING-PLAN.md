# Plan de Refactoring des Hooks DataTable

## État actuel (Phase 1 - TERMINÉE)

### Réalisations
- ✅ Création du hook orchestrateur `useDataTable.ts` (392 lignes)
- ✅ Documentation complète (README.md)
- ✅ Guide de migration (MIGRATION.md)
- ✅ Exemples d'utilisation (examples/basic-usage.tsx)
- ✅ Export dans index.ts

### Architecture actuelle

```
Hooks principaux:
├── useDataTable.ts (392 lignes) ← NOUVEAU - Hook orchestrateur recommandé
├── useDataTableState.ts (413 lignes) - Legacy, maintenu pour compatibilité
│
Hooks spécialisés:
├── useDataExport.ts (337 lignes) ← À refactoriser
├── useDataPagination.ts (260 lignes) ← À refactoriser
├── useDataFiltering.ts (258 lignes) ← À refactoriser
├── useDataSelection.ts (228 lignes) ✓ Taille acceptable
├── useDataSorting.ts (172 lignes) ✓ Taille acceptable
│
Hooks de test (à conserver):
├── useDataFiltering.simple.ts (79 lignes)
└── useDataSorting.simple.ts (41 lignes)
```

## Phase 2: Refactoring des hooks volumineux (PROCHAINE)

### Objectif
Réduire la taille des hooks > 250 lignes en extrayant la logique dans des hooks ou utilitaires dédiés.

### 2.1 Refactoring de `useDataExport.ts` (337 lignes)

**Problème:** Logique d'export mélangée pour tous les formats.

**Solution:** Créer des exporters dédiés par format.

```
hooks/
  export/
    useDataExport.ts (hook principal, ~100 lignes)
    exporters/
      csvExporter.ts (~80 lignes)
      excelExporter.ts (~80 lignes)
      jsonExporter.ts (~40 lignes)
      pdfExporter.ts (~80 lignes)
    types.ts
```

**Bénéfices:**
- Code plus maintenable
- Possibilité d'ajouter facilement de nouveaux formats
- Tests unitaires plus simples
- Lazy loading possible des exporters lourds (Excel, PDF)

### 2.2 Refactoring de `useDataPagination.ts` (260 lignes)

**Problème:** Logique client-side et server-side mélangée.

**Solution:** Séparer en deux hooks spécialisés.

```
hooks/
  pagination/
    useDataPagination.ts (hook façade, ~80 lignes)
    useClientPagination.ts (~100 lignes)
    useServerPagination.ts (~100 lignes)
    usePaginationControls.ts (~60 lignes)
    types.ts
```

**Bénéfices:**
- Séparation claire client/server
- Optimisations spécifiques pour chaque mode
- Contrôles de pagination réutilisables

### 2.3 Refactoring de `useDataFiltering.ts` (258 lignes)

**Problème:** Logique de filtrage avancé complexe.

**Solution:** Extraire les filtres avancés dans un hook dédié.

```
hooks/
  filtering/
    useDataFiltering.ts (hook principal, ~150 lignes)
    useAdvancedFilters.ts (~100 lignes)
    useFilterDebounce.ts (~40 lignes)
    filterEngine.ts (utilitaire, ~100 lignes)
    types.ts
```

**Bénéfices:**
- Logique de filtrage simple vs avancée séparée
- Debounce réutilisable
- Engine de filtrage testable indépendamment

## Phase 3: Optimisation des performances

### 3.1 Memoization avancée

Ajouter des options de memoization pour les grandes listes:

```typescript
const table = useDataTable({
  data: largeDataset,
  columns,
  keyField: 'id',
  performance: {
    memoize: true,
    memoizeKeys: ['id', 'updatedAt'],
    virtualScroll: true,
    lazyLoading: true
  }
})
```

### 3.2 Virtualisation par défaut

Intégrer `useVirtualizedTable` automatiquement pour les listes > 1000 éléments.

### 3.3 Lazy loading

Implémenter le chargement différé des données:

```typescript
const table = useDataTable({
  data: [], // Vide au départ
  loadData: async (page, filters, sorts) => {
    return await fetchUsers({ page, filters, sorts })
  },
  mode: 'server' // Server-side processing
})
```

## Phase 4: Composabilité avancée

### 4.1 Hooks de composition

Permettre de composer facilement des fonctionnalités:

```typescript
// Au lieu de useDataTable avec toutes les options
const filtering = useDataFiltering({ data, columns })
const sorting = useDataSorting({ data: filtering.filteredData, columns })
const table = useDataTable({
  data: sorting.sortedData,
  columns,
  // Réutiliser les hooks externes
  externalFiltering: filtering,
  externalSorting: sorting
})
```

### 4.2 Plugins système

Créer un système de plugins pour étendre les fonctionnalités:

```typescript
const table = useDataTable({
  data,
  columns,
  plugins: [
    rowGroupingPlugin(),
    aggregationPlugin(),
    columnResizingPlugin(),
    columnFreezingPlugin()
  ]
})
```

## Phase 5: TypeScript et DX

### 5.1 Amélioration du typage

- Inférence automatique des types à partir des colonnes
- Types génériques plus stricts
- Meilleure auto-complétion

### 5.2 DevTools

Créer des outils de développement:

```typescript
const table = useDataTable({
  data,
  columns,
  debug: true, // Active le mode debug
  devtools: true // Intégration React DevTools
})
```

### 5.3 Documentation interactive

- Storybook stories pour chaque hook
- Playground interactif
- Exemples Codesandbox

## Phase 6: Tests et qualité

### 6.1 Couverture de tests

Objectif: 90%+ de couverture pour tous les hooks.

```
hooks/
  __tests__/
    useDataTable.test.ts
    useDataExport.test.ts
    useDataFiltering.test.ts
    useDataPagination.test.ts
    useDataSelection.test.ts
    useDataSorting.test.ts
    integration/
      full-workflow.test.ts
      performance.test.ts
```

### 6.2 Tests de performance

Benchmarks pour mesurer les performances:

```typescript
describe('Performance', () => {
  it('should handle 10k rows efficiently', () => {
    const start = performance.now()
    const table = useDataTable({ data: largeDataset, columns })
    const end = performance.now()
    expect(end - start).toBeLessThan(100) // < 100ms
  })
})
```

### 6.3 Tests de régression

S'assurer que les refactorings ne cassent pas l'existant.

## Métriques de succès

### Taille des fichiers
- ✅ Aucun hook > 400 lignes (actuellement: useDataTableState 413 lignes)
- 🎯 Aucun hook > 250 lignes (Phase 2)
- 🎯 Aucun hook > 200 lignes (Phase 3)

### Performance
- 🎯 < 16ms pour le rendu initial (60 FPS)
- 🎯 < 50ms pour appliquer un filtre
- 🎯 < 10ms pour trier 1000 éléments
- 🎯 Support de 100k+ éléments avec virtualisation

### Qualité du code
- 🎯 90%+ couverture de tests
- 🎯 0 erreurs TypeScript strict
- 🎯 0 warnings ESLint
- 🎯 Documentation à jour pour tous les hooks

### Developer Experience
- ✅ API simple et intuitive (useDataTable)
- 🎯 Auto-complétion complète
- 🎯 Messages d'erreur clairs
- 🎯 Exemples pour tous les cas d'usage

## Prochaines actions (Par ordre de priorité)

1. **Immédiat (cette semaine):**
   - [ ] Tester le nouveau hook `useDataTable` dans un composant réel
   - [ ] Recueillir les retours de l'équipe
   - [ ] Ajuster l'API si nécessaire

2. **Court terme (2 semaines):**
   - [ ] Refactoring de `useDataExport.ts` (Phase 2.1)
   - [ ] Ajouter des tests pour `useDataTable`
   - [ ] Créer des Storybook stories

3. **Moyen terme (1 mois):**
   - [ ] Refactoring de `useDataPagination.ts` (Phase 2.2)
   - [ ] Refactoring de `useDataFiltering.ts` (Phase 2.3)
   - [ ] Migration progressive des composants existants

4. **Long terme (3 mois):**
   - [ ] Optimisations de performance (Phase 3)
   - [ ] Système de plugins (Phase 4)
   - [ ] DevTools (Phase 5)

## Notes

### Décisions prises
- **Conserver** les fichiers `.simple.ts` pour les tests (ne pas les supprimer)
- **Conserver** `useDataTableState` pour compatibilité ascendante
- **Recommander** `useDataTable` pour tous les nouveaux composants

### Leçons apprises
- Les hooks orchestrateurs simplifient grandement l'API
- La documentation est aussi importante que le code
- Les exemples concrets aident beaucoup à l'adoption

### Risques identifiés
- Migration progressive peut créer de la confusion
- Besoin de maintenir deux APIs en parallèle temporairement
- Tests de régression essentiels pour éviter les régressions
