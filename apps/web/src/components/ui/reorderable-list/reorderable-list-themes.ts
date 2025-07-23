import { ReorderableTheme } from './reorderable-list-theme'

// Thème par défaut (style actuel)
export const defaultTheme: ReorderableTheme = {
  id: 'default',
  name: 'Défaut',
  description: 'Thème par défaut du système',
  
  container: {
    spacing: 'normal',
    background: 'hsl(var(--background))',
    border: 'hsl(var(--border))',
    borderRadius: '0.5rem',
    padding: '1rem'
  },
  
  item: {
    background: 'hsl(var(--card))',
    backgroundHover: 'hsl(var(--primary) / 0.1)',
    backgroundActive: 'hsl(var(--primary) / 0.15)',
    backgroundDragging: 'hsl(var(--primary) / 0.05)',
    border: 'hsl(var(--border))',
    borderHover: 'hsl(var(--primary) / 0.3)',
    borderActive: 'hsl(var(--primary) / 0.5)',
    borderRadius: '0.5rem',
    padding: '1rem',
    textColor: 'hsl(var(--foreground))',
    textColorHover: 'hsl(var(--primary))',
    textColorActive: 'hsl(var(--primary))',
    shadow: '0 1px 3px hsl(var(--foreground) / 0.1)',
    shadowHover: '0 4px 12px hsl(var(--primary) / 0.15)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  hierarchy: {
    indentSize: 24,
    indentColor: 'hsl(var(--primary) / 0.2)',
    connectionLine: 'hsl(var(--primary) / 0.1)',
    connectionLineHover: 'hsl(var(--primary) / 0.2)',
    levelIndicator: {
      size: '0.25rem',
      color: 'hsl(var(--primary) / 0.3)',
      colorActive: 'hsl(var(--primary) / 0.6)'
    }
  },
  
  dragHandle: {
    width: '2.5rem',
    background: 'hsl(var(--muted) / 0.3)',
    backgroundHover: 'hsl(var(--primary) / 0.15)',
    backgroundActive: 'hsl(var(--primary) / 0.25)',
    border: 'hsl(var(--border))',
    iconColor: 'hsl(var(--muted-foreground) / 0.7)',
    iconColorHover: 'hsl(var(--primary))',
    iconColorActive: 'hsl(var(--primary))'
  },
  
  expandButton: {
    size: '2rem',
    background: 'transparent',
    backgroundHover: 'hsl(var(--primary) / 0.1)',
    backgroundActive: 'hsl(var(--primary) / 0.15)',
    iconColor: 'hsl(var(--muted-foreground) / 0.7)',
    iconColorHover: 'hsl(var(--primary))',
    iconColorActive: 'hsl(var(--primary))'
  },
  
  dropIndicator: {
    above: {
      color: 'hsl(var(--primary))',
      thickness: '2px',
      glow: '0 0 6px hsl(var(--primary) / 0.4)'
    },
    below: {
      color: 'hsl(var(--primary))',
      thickness: '2px',
      glow: '0 0 6px hsl(var(--primary) / 0.4)'
    },
    inside: {
      background: 'hsl(var(--primary) / 0.1)',
      border: '2px solid hsl(var(--primary) / 0.5)',
      icon: '📁',
      animation: 'pulse'
    }
  },
  
  animations: {
    hover: {
      scale: 1.01,
      translateY: -2,
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    drag: {
      opacity: 0.6,
      scale: 0.95,
      duration: '200ms'
    },
    drop: {
      duration: '300ms',
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
}

// Thème compact pour les espaces restreints
export const compactTheme: ReorderableTheme = {
  ...defaultTheme,
  id: 'compact',
  name: 'Compact',
  description: 'Thème optimisé pour les espaces restreints',
  
  container: {
    ...defaultTheme.container,
    spacing: 'compact',
    padding: '0.5rem'
  },
  
  item: {
    ...defaultTheme.item,
    padding: '0.5rem',
    borderRadius: '0.25rem'
  },
  
  hierarchy: {
    ...defaultTheme.hierarchy,
    indentSize: 16
  },
  
  dragHandle: {
    ...defaultTheme.dragHandle,
    width: '2rem'
  },
  
  expandButton: {
    ...defaultTheme.expandButton,
    size: '1.5rem'
  },
  
  animations: {
    ...defaultTheme.animations,
    hover: {
      ...defaultTheme.animations.hover,
      scale: 1.005,
      translateY: -1
    }
  }
}

// Thème moderne avec effets visuels avancés
export const modernTheme: ReorderableTheme = {
  ...defaultTheme,
  id: 'modern',
  name: 'Moderne',
  description: 'Thème moderne avec effets glassmorphism',
  
  container: {
    ...defaultTheme.container,
    background: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem'
  },
  
  item: {
    ...defaultTheme.item,
    background: 'rgba(255, 255, 255, 0.05)',
    backgroundHover: 'rgba(var(--primary-rgb), 0.1)',
    backgroundActive: 'rgba(var(--primary-rgb), 0.15)',
    border: 'rgba(255, 255, 255, 0.1)',
    borderHover: 'rgba(var(--primary-rgb), 0.3)',
    borderRadius: '0.75rem',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    shadowHover: '0 12px 40px rgba(var(--primary-rgb), 0.2)'
  },
  
  animations: {
    ...defaultTheme.animations,
    hover: {
      scale: 1.02,
      translateY: -4,
      duration: '400ms',
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  }
}

// Thème minimal pour une apparence épurée
export const minimalTheme: ReorderableTheme = {
  ...defaultTheme,
  id: 'minimal',
  name: 'Minimal',
  description: 'Thème épuré sans effets visuels',
  
  item: {
    ...defaultTheme.item,
    background: 'transparent',
    backgroundHover: 'hsl(var(--muted) / 0.5)',
    backgroundActive: 'hsl(var(--muted) / 0.7)',
    border: 'transparent',
    borderHover: 'hsl(var(--border))',
    borderRadius: '0.25rem',
    shadow: 'none',
    shadowHover: 'none'
  },
  
  dragHandle: {
    ...defaultTheme.dragHandle,
    background: 'transparent',
    backgroundHover: 'hsl(var(--muted) / 0.3)',
    border: 'transparent'
  },
  
  animations: {
    ...defaultTheme.animations,
    hover: {
      scale: 1,
      translateY: 0,
      duration: '200ms',
      easing: 'ease-out'
    }
  }
}

// Thème coloré pour une interface ludique
export const colorfulTheme: ReorderableTheme = {
  ...defaultTheme,
  id: 'colorful',
  name: 'Coloré',
  description: 'Thème avec couleurs vives et dégradés',
  
  item: {
    ...defaultTheme.item,
    background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)) 100%)',
    backgroundHover: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--accent) / 0.1) 100%)',
    backgroundActive: 'linear-gradient(135deg, hsl(var(--primary) / 0.2) 0%, hsl(var(--accent) / 0.2) 100%)',
    borderHover: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
    shadowHover: '0 8px 25px hsl(var(--primary) / 0.25)'
  },
  
  dropIndicator: {
    above: {
      color: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
      thickness: '3px',
      glow: '0 0 12px hsl(var(--primary) / 0.6)'
    },
    below: {
      color: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
      thickness: '3px',
      glow: '0 0 12px hsl(var(--primary) / 0.6)'
    },
    inside: {
      background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.15) 100%)',
      border: '2px solid transparent',
      icon: '🎨',
      animation: 'bounce'
    }
  }
}

// Export de tous les thèmes par défaut
export const defaultThemes: Record<string, ReorderableTheme> = {
  default: defaultTheme,
  compact: compactTheme,
  modern: modernTheme,
  minimal: minimalTheme,
  colorful: colorfulTheme
}

// Fonction utilitaire pour obtenir un thème
export function getTheme(themeId: string): ReorderableTheme {
  return defaultThemes[themeId] || defaultTheme
}

// Fonction pour créer un thème personnalisé
export function createCustomTheme(
  baseTheme: ReorderableTheme,
  overrides: Partial<ReorderableTheme>
): ReorderableTheme {
  return {
    ...baseTheme,
    ...overrides,
    id: overrides.id || `custom-${Date.now()}`,
    name: overrides.name || 'Thème personnalisé'
  }
}