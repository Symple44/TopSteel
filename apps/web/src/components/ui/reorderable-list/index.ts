// Point d'entrée principal pour le composant ReorderableList avec thèmes

// Types et interfaces
export type { 
  ReorderableItem,
  RenderItemProps,
  ReorderableTheme,
  ReorderableListConfig,
  ReorderableCustomization,
  ThemedReorderableListProps
} from './reorderable-list-theme'

// Thèmes et utilitaires
export { 
  defaultThemes,
  defaultTheme,
  compactTheme,
  modernTheme,
  minimalTheme,
  colorfulTheme,
  getTheme,
  createCustomTheme
} from './reorderable-list-themes'

// Hook de configuration
export { useReorderableConfig } from './use-reorderable-config'

// Composants
export { ReorderableListCustomizationPanel } from './reorderable-list-customization-panel'
export { ThemedReorderableList } from './themed-reorderable-list'

// Exemples (optionnel, pour dev/tests)
export { ReorderableListExample, CustomThemedExample } from './reorderable-list-example'

// Composant par défaut
export { ThemedReorderableList as default } from './themed-reorderable-list'

// Export nommé principal pour rétrocompatibilité
export { ThemedReorderableList as ReorderableList } from './themed-reorderable-list'