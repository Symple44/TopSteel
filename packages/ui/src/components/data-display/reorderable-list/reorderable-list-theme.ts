import type React from 'react'
import type { ItemRenderProps } from '../../../types/common'

// Types de base réutilisés
export interface ReorderableItem {
  id: string
  children?: ReorderableItem[]
  [key: string]: unknown
}

export interface RenderItemProps<T extends ReorderableItem> {
  item: T
  index: number
  level: number
  isExpanded: boolean
  hasChildren: boolean
  isDragging: boolean
  onToggleExpand?: (id: string) => void
  isDragOverlay?: boolean
}

// Interface pour les thèmes du ReorderableList
export interface ReorderableTheme {
  id: string
  name: string
  description?: string

  // Styles des conteneurs
  container: {
    spacing: 'compact' | 'normal' | 'relaxed'
    background: string
    border: string
    borderRadius: string
    padding: string
  }

  // Styles des items
  item: {
    background: string
    backgroundHover: string
    backgroundActive: string
    backgroundDragging: string
    border: string
    borderHover: string
    borderActive: string
    borderRadius: string
    padding: string
    textColor: string
    textColorHover: string
    textColorActive: string
    shadow: string
    shadowHover: string
    transition: string
  }

  // Styles de la hiérarchie
  hierarchy: {
    indentSize: number
    indentColor: string
    connectionLine: string
    connectionLineHover: string
    levelIndicator: {
      size: string
      color: string
      colorActive: string
    }
  }

  // Styles des handles de drag
  dragHandle: {
    width: string
    background: string
    backgroundHover: string
    backgroundActive: string
    border: string
    iconColor: string
    iconColorHover: string
    iconColorActive: string
  }

  // Styles des boutons d'expansion
  expandButton: {
    size: string
    background: string
    backgroundHover: string
    backgroundActive: string
    iconColor: string
    iconColorHover: string
    iconColorActive: string
  }

  // Styles des indicateurs de drop
  dropIndicator: {
    above: {
      color: string
      thickness: string
      glow: string
    }
    below: {
      color: string
      thickness: string
      glow: string
    }
    inside: {
      background: string
      border: string
      icon: string
      animation: 'pulse' | 'bounce' | 'none'
    }
  }

  // Animations
  animations: {
    hover: {
      scale: number
      translateY: number
      duration: string
      easing: string
    }
    drag: {
      opacity: number
      scale: number
      duration: string
    }
    drop: {
      duration: string
      easing: string
    }
  }
}

// Configuration utilisateur sauvegardable
export interface ReorderableListConfig {
  id: string
  userId?: string
  componentId: string // Identifiant unique du composant (ex: 'menu-settings')
  theme: string // ID du thème
  preferences: {
    defaultExpanded: boolean
    showLevelIndicators: boolean
    showConnectionLines: boolean
    enableAnimations: boolean
    compactMode: boolean
    customColors?: {
      primary?: string
      secondary?: string
      accent?: string
    }
  }
  layout: {
    maxDepth: number
    allowNesting: boolean
    dragHandlePosition: 'left' | 'right'
    expandButtonPosition: 'left' | 'right'
  }
  createdAt: Date
  updatedAt: Date
}

// Interface pour les actions de customisation
export interface ReorderableCustomization {
  // Actions de thème
  onThemeChange?: (themeId: string) => void
  onThemeReset?: () => void
  onThemeSave?: (config: ReorderableListConfig) => Promise<void>
  onThemeLoad?: (componentId: string) => Promise<ReorderableListConfig | null>

  // Actions de layout
  onLayoutChange?: (layout: ReorderableListConfig['layout']) => void
  onPreferencesChange?: (preferences: ReorderableListConfig['preferences']) => void

  // Sauvegarde
  enableSaving?: boolean
  autoSave?: boolean
  savingDelay?: number
}

// Props étendues pour le ReorderableList avec thèmes
export interface ThemedReorderableListProps<T> {
  // Props existantes du ReorderableList
  items: T[]
  onItemsChange?: (items: T[]) => void
  onSave?: (items: T[]) => void
  renderItem: (props: ItemRenderProps<T>) => React.ReactNode

  // Nouveaux props pour les thèmes
  theme?: string | ReorderableTheme
  config?: Partial<ReorderableListConfig>
  customization?: ReorderableCustomization

  // ID unique pour la sauvegarde des préférences
  componentId: string

  // Options de personnalisation
  enableCustomization?: boolean
  showCustomizationPanel?: boolean
  customizationPanelPosition?: 'top' | 'right' | 'bottom' | 'left'

  // Callbacks avancés
  onConfigChange?: (config: ReorderableListConfig) => void
  onError?: (error: Error) => void
}
