// Exemple d'intégration du ThemedReorderableList dans la page menu
'use client'

import { Badge } from '../badge'
import { Button } from '../../primitives/button'
import { Eye, EyeOff, Star } from 'lucide-react'
import React from 'react'
import { cn } from '../../../lib/utils'
import { ThemedReorderableList } from './themed-reorderable-list'

// Type d'exemple basé sur MenuItem existant
interface ExampleMenuItem {
  id: string
  title: string
  href?: string
  icon?: string
  gradient?: string
  orderIndex: number
  isVisible: boolean
  parentId?: string
  children?: ExampleMenuItem[]
  userPreferences?: {
    customTitle?: string
    isFavorite?: boolean
  }
}

// Composant d'affichage d'un élément de menu avec le nouveau système
function ExampleMenuItemDisplay({
  item,
  onToggleVisibility,
}: {
  item: ExampleMenuItem
  onToggleVisibility: (id: string) => void
}) {
  // Mapping d'icônes simplifié pour l'exemple
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    // Ajouter vos icônes ici
  }

  const IconComponent = item.icon ? iconMap[item.icon] : null

  return (
    <div className="flex items-center gap-3 w-full py-1 px-2 group rounded-md transition-colors duration-200">
      {/* Icône avec gradient */}
      {IconComponent && (
        <div
          className={cn(
            'flex items-center justify-center rounded-lg h-8 w-8 flex-shrink-0',
            'transition-all duration-200 ease-out',
            'hover:scale-110 hover:shadow-lg',
            item.gradient
              ? `bg-gradient-to-br ${item.gradient} text-white shadow-md`
              : 'bg-primary/10 text-primary border border-primary/20'
          )}
        >
          <IconComponent className="h-4 w-4" />
        </div>
      )}

      {/* Contenu principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {item.userPreferences?.customTitle || item.title}
          </h3>

          {/* Badges */}
          {item.children && item.children.length > 0 && (
            <Badge variant="outline" className="h-5 px-2 text-xs">
              {item.children.length}
            </Badge>
          )}
          {item.userPreferences?.isFavorite && (
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
          )}
        </div>

        {item.href && (
          <p className="text-xs text-muted-foreground/80 truncate mt-0.5 font-mono">{item.href}</p>
        )}
      </div>

      {/* Toggle de visibilité */}
      <Button
        variant="ghost"
        size="sm"
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          e.preventDefault()
          onToggleVisibility(item.id)
        }}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
        className={cn(
          'h-8 w-8 p-0 shrink-0 rounded-lg transition-all duration-200',
          item.isVisible
            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
        )}
      >
        {item.isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
    </div>
  )
}

// Exemple d'utilisation
export function ReorderableListExample() {
  // Données d'exemple
  const [menuItems, setMenuItems] = React.useState<ExampleMenuItem[]>([
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      href: '/dashboard',
      icon: 'LayoutDashboard',
      gradient: 'from-blue-500 to-blue-600',
      orderIndex: 0,
      isVisible: true,
      children: [],
    },
    {
      id: 'admin',
      title: 'Administration',
      href: '/admin',
      icon: 'Settings',
      gradient: 'from-purple-500 to-purple-600',
      orderIndex: 1,
      isVisible: true,
      children: [
        {
          id: 'admin-users',
          title: 'Utilisateurs',
          href: '/admin/users',
          icon: 'Users',
          orderIndex: 0,
          isVisible: true,
          parentId: 'admin',
        },
        {
          id: 'admin-roles',
          title: 'Rôles',
          href: '/admin/roles',
          icon: 'Shield',
          orderIndex: 1,
          isVisible: true,
          parentId: 'admin',
        },
      ],
    },
  ])

  const handleItemsChange = (newItems: ExampleMenuItem[]) => {
    setMenuItems(newItems)
  }

  const handleToggleVisibility = (id: string) => {
    const toggleInItems = (items: ExampleMenuItem[]): ExampleMenuItem[] => {
      return items.map((item) => {
        if (item.id === id) {
          return { ...item, isVisible: !item.isVisible }
        }
        if (item.children) {
          return { ...item, children: toggleInItems(item.children) }
        }
        return item
      })
    }

    setMenuItems(toggleInItems(menuItems))
  }

  const handleSave = (_items: ExampleMenuItem[]) => {
    // Ici vous pourriez faire un appel API pour sauvegarder
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Exemple de ThemedReorderableList</h1>
        <p className="text-muted-foreground">
          Composant avec système de thèmes, personnalisation et sauvegarde des préférences
        </p>
      </div>

      <ThemedReorderableList
        // Props de base
        items={menuItems}
        onItemsChange={handleItemsChange}
        onSave={handleSave}
        renderItem={({ item }) => (
          <ExampleMenuItemDisplay item={item} onToggleVisibility={handleToggleVisibility} />
        )}
        // Configuration du système de thèmes
        componentId="menu-settings-example"
        theme="default" // ou 'compact', 'modern', 'minimal', 'colorful'
        // Personnalisation
        enableCustomization={true}
        showCustomizationPanel={false} // L'utilisateur peut l'ouvrir avec le bouton
        customizationPanelPosition="right"
        // Callbacks
        onConfigChange={(_config) => {}}
        onError={(_error) => {}}
      />
    </div>
  )
}

// Exemple avec thème personnalisé
export function CustomThemedExample() {
  const customTheme = {
    id: 'custom-example',
    name: 'Thème Exemple',
    description: 'Thème personnalisé pour la démo',

    // Configuration personnalisée
    container: {
      spacing: 'normal' as const,
      background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/50) 100%)',
      border: 'hsl(var(--primary) / 0.2)',
      borderRadius: '1rem',
      padding: '1.5rem',
    },

    item: {
      background: 'rgba(255, 255, 255, 0.7)',
      backgroundHover: 'hsl(var(--primary) / 0.15)',
      backgroundActive: 'hsl(var(--primary) / 0.2)',
      backgroundDragging: 'hsl(var(--primary) / 0.1)',
      border: 'hsl(var(--border))',
      borderHover: 'hsl(var(--primary) / 0.4)',
      borderActive: 'hsl(var(--primary) / 0.6)',
      borderRadius: '0.75rem',
      padding: '1rem',
      textColor: 'hsl(var(--foreground))',
      textColorHover: 'hsl(var(--primary))',
      textColorActive: 'hsl(var(--primary))',
      shadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      shadowHover: '0 8px 30px hsl(var(--primary) / 0.2)',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    },

    // ... autres propriétés du thème
    hierarchy: {
      indentSize: 32,
      indentColor: 'hsl(var(--primary) / 0.3)',
      connectionLine: 'hsl(var(--primary) / 0.2)',
      connectionLineHover: 'hsl(var(--primary) / 0.4)',
      levelIndicator: {
        size: '0.375rem',
        color: 'hsl(var(--primary) / 0.4)',
        colorActive: 'hsl(var(--primary) / 0.8)',
      },
    },

    dragHandle: {
      width: '3rem',
      background: 'hsl(var(--muted) / 0.5)',
      backgroundHover: 'hsl(var(--primary) / 0.2)',
      backgroundActive: 'hsl(var(--primary) / 0.3)',
      border: 'hsl(var(--border))',
      iconColor: 'hsl(var(--muted-foreground))',
      iconColorHover: 'hsl(var(--primary))',
      iconColorActive: 'hsl(var(--primary))',
    },

    expandButton: {
      size: '2.5rem',
      background: 'transparent',
      backgroundHover: 'hsl(var(--primary) / 0.15)',
      backgroundActive: 'hsl(var(--primary) / 0.2)',
      iconColor: 'hsl(var(--muted-foreground))',
      iconColorHover: 'hsl(var(--primary))',
      iconColorActive: 'hsl(var(--primary))',
    },

    dropIndicator: {
      above: {
        color: 'hsl(var(--primary))',
        thickness: '3px',
        glow: '0 0 10px hsl(var(--primary) / 0.5)',
      },
      below: {
        color: 'hsl(var(--primary))',
        thickness: '3px',
        glow: '0 0 10px hsl(var(--primary) / 0.5)',
      },
      inside: {
        background: 'hsl(var(--primary) / 0.15)',
        border: '2px dashed hsl(var(--primary) / 0.6)',
        icon: '✨',
        animation: 'pulse' as const,
      },
    },

    animations: {
      hover: {
        scale: 1.02,
        translateY: -3,
        duration: '400ms',
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      drag: {
        opacity: 0.7,
        scale: 0.95,
        duration: '250ms',
      },
      drop: {
        duration: '350ms',
        easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Exemple avec Thème Personnalisé</h1>
        <p className="text-muted-foreground">
          Démonstration avec un thème entièrement personnalisé
        </p>
      </div>

      <ThemedReorderableList
        items={[]} // Vos données ici
        onItemsChange={() => {}}
        renderItem={() => <div>Item personnalisé</div>}
        componentId="custom-theme-example"
        theme={customTheme}
        enableCustomization={true}
        showCustomizationPanel={true}
        customizationPanelPosition="right"
      />
    </div>
  )
}