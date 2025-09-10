# DataTable Component Changelog

## [2.0.0] - 2025-01-10

### 🚨 Breaking Changes
- **Type Constraints**: TOUTES les interfaces utilisées avec DataTable doivent maintenant étendre `Record<string, unknown>`
- **Suppression de `any`**: Tous les types `any` ont été remplacés par `unknown` pour une meilleure sécurité de type
- **Generic Constraints**: Toutes les interfaces et hooks utilisent maintenant `T extends Record<string, unknown>`
- **API Unifiée**: Une seule version du composant DataTable (suppression de DataTableFlexible)

### 🔧 Improvements
- **Type Safety**: Amélioration complète de la sécurité des types
  - Tous les hooks utilisent maintenant des contraintes génériques cohérentes
  - Les colonnes sont typées avec `ColumnConfig<T extends Record<string, unknown>>`
  - Les fonctions de rendu sont typées correctement sans `any`

- **Code Quality**: Conformité totale avec Biome linter
  - 0 erreurs TypeScript
  - 0 utilisation de `any`
  - Code formaté selon les standards du projet

### 📦 Updated Components
- `DataTable.tsx`: Contraintes génériques mises à jour
- `types.ts`: Types refactorisés sans `any`
- `types/column-types.ts`: Nouveau système de types pour les colonnes
- Tous les hooks (8 fichiers): Contraintes génériques uniformisées
- `export-utils.ts`: Types corrigés pour l'export
- `render-utils.tsx`: Types améliorés pour le rendu
- `FormulaEditor.tsx`: Suppression des `any`

### 🔄 Migration Guide

#### Mise à jour des interfaces
```tsx
// Avant
interface MyData {
  id: string
  name: string
}

// Après
interface MyData extends Record<string, unknown> {
  id: string
  name: string
}
```

#### Utilisation avec DataTable
```tsx
import { DataTable } from '@erp/ui'
import type { Partner } from '@erp/types' // Déjà mis à jour pour étendre Record<string, unknown>

// Utiliser DataTable directement
<DataTable data={partners} columns={columns} keyField="id" />
```

#### Interfaces déjà mises à jour
Toutes les interfaces métier du projet ont été mises à jour :
- `Partner`, `PartnerGroup`, `Contact`, `PartnerSite`, `PartnerAddress` (@erp/types)
- `Material`, `Article`, `User`, `Project` (@erp/types)
- `TranslationEntry` (apps/web)
- Toutes les interfaces de store

### 📝 Documentation Updates
- README.md mis à jour avec des exemples pour DataTable et DataTableFlexible
- Ajout d'une section TypeScript détaillée
- Guide de migration complet
- Exemples de code pour tous les cas d'usage

### 🐛 Bug Fixes
- Correction des erreurs de type dans les fonctions de rendu
- Résolution des problèmes de compatibilité avec les interfaces métier
- Fix des exports manquants dans index.ts

## [1.x.x] - Previous Versions

### Features
- Système de DataTable modulaire avec hooks
- Support pour tri, filtrage, pagination, sélection
- Export CSV/Excel
- Édition inline
- Vues multiples (Table, Cards, Kanban, Calendar, Timeline)
- Persistance des préférences utilisateur
- Support du virtual scrolling
- Formules et calculs
- Drag & drop des colonnes