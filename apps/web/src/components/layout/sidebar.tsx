// apps/web/src/components/layout/sidebar.tsx - VERSION AMÉLIORÉE
'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge, Separator, Button } from '@erp/ui'
import { TooltipFixed } from '@/components/ui/tooltip-fixed'
import { useTranslation } from '@/lib/i18n'
import { useDynamicMenu } from '@/hooks/use-dynamic-menu'
import { useMenuMode } from '@/hooks/use-menu-mode'

import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Database,
  Factory,
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  User,
  Users,
  Wrench,
  Menu,
  X,
  Building,
  Building2,
  Bell,
  Activity,
  Calendar,
  Briefcase,
  UserCheck,
  FileBarChart,
  TrendingUp,
  PieChart,
  HardDrive,
  Cog,
  Eye,
  LucideIcon,
  ToggleLeft,
  ToggleRight,
  ListChecks,
  Palette,
  Settings2
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }> | string
  badge?: string
  gradient?: string
  children?: NavItem[]
  roles?: string[]
  isFavorite?: boolean
  isPinned?: boolean
  isCustomized?: boolean
}

// Mapping des noms d'icônes vers les composants Lucide
const iconMap: Record<string, LucideIcon> = {
  Home,
  Shield,
  Users,
  Building,
  Building2,
  Bell,
  Settings,
  Activity,
  Calendar,
  Briefcase,
  UserCheck,
  FileBarChart,
  TrendingUp,
  PieChart,
  HardDrive,
  Cog,
  Eye,
  BarChart3,
  CreditCard,
  Database,
  Factory,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Package,
  User,
  Wrench
}

const getNavigation = (t: any): NavItem[] => [
  {
    title: t('dashboard'),
    href: '/dashboard',
    icon: Home,
    gradient: 'from-blue-500 to-purple-600',
  },
  {
    title: t('configuration'),
    href: '/admin',
    icon: Shield,
    gradient: 'from-red-500 to-pink-600',
    roles: ['ADMIN'],
  },
]

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation('navigation')
  const [expandedItems, setExpandedItems] = useState<string[]>(['Administration'])
  
  // Hooks pour la gestion du menu
  const { filteredMenu, loading, error, currentMode, refreshMenu } = useDynamicMenu()
  const { mode, toggleMode, isStandard, isCustom } = useMenuMode()
  const staticNavigation = getNavigation(t)
  
  // Convertir le menu dynamique au format NavItem
  const convertDynamicToNavItem = (items: any[]): NavItem[] => {
    if (!Array.isArray(items)) {
      console.warn('convertDynamicToNavItem: items is not an array:', items)
      return []
    }
    return items.map(item => {
      // Appliquer les préférences utilisateur si disponibles
      const displayTitle = item.userPreferences?.customTitle || 
                          (item.titleKey ? t(item.titleKey) : item.title)
      const displayIcon = item.userPreferences?.customIcon || item.icon
      const displayBadge = item.userPreferences?.customBadge || item.badge
      
      return {
        title: displayTitle,
        href: item.href,
        icon: typeof displayIcon === 'string' ? iconMap[displayIcon] || Settings : displayIcon,
        badge: displayBadge,
        gradient: item.gradient,
        children: item.children ? convertDynamicToNavItem(item.children) : undefined,
        roles: item.roles,
        // Ajouter des indicateurs visuels pour les préférences
        isFavorite: item.userPreferences?.isFavorite,
        isPinned: item.userPreferences?.isPinned,
        isCustomized: item.userPreferences?.customTitle || 
                     item.userPreferences?.customIcon || 
                     item.userPreferences?.customBadge
      }
    })
  }
  
  // Utiliser le menu dynamique si disponible, sinon le menu statique
  // En mode custom, utiliser le menu filtré même s'il est vide
  const navigation = !loading && (Array.isArray(filteredMenu) && (filteredMenu.length > 0 || mode === 'custom'))
    ? convertDynamicToNavItem(filteredMenu)
    : staticNavigation

  // Debug pour voir quel menu est utilisé
  useEffect(() => {
    console.log('[Sidebar] Mode:', mode, '| Loading:', loading, '| Filtered:', filteredMenu.length, '| Navigation:', navigation.length)
    if (filteredMenu.length > 0) {
      console.log('[Sidebar] Items du menu filtré:', filteredMenu.map(item => item.title))
    }
    if (navigation.length > 0) {
      console.log('[Sidebar] Items de navigation:', navigation.map(item => item.title))
    }
  }, [loading, filteredMenu, mode, navigation])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/dashboard') return pathname === href

    return pathname.startsWith(href)
  }

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true

    return item.children?.some((child) => isActive(child.href)) || false
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const itemIsActive = isActive(item.href)
    const parentIsActive = isParentActive(item)

    const handleClick = () => {
      if (hasChildren) {
        toggleExpanded(item.title)
      } else if (item.href) {
        router.push(item.href)
      }
    }

    return (
      <div key={item.title} className="space-y-1">
        <button
          onClick={handleClick}
          aria-label={item.title}
          type="button"
          className={cn(
            'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200 w-full text-left',
            level === 0 && 'mx-1',
            level === 1 && 'ml-4 mr-1',
            itemIsActive || parentIsActive
              ? 'bg-accent text-accent-foreground shadow-lg backdrop-blur-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
            isCollapsed && 'justify-center'
          )}
        >
          {/* Indicateur actif moderne */}
          {(itemIsActive || parentIsActive) && (
            <div
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b',
                item.gradient || 'from-blue-500 to-purple-600'
              )}
            />
          )}

          {/* Icône avec gradient */}
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200',
              itemIsActive || parentIsActive
                ? `bg-gradient-to-br ${item.gradient || 'from-blue-500 to-purple-600'} text-white shadow-lg`
                : 'text-muted-foreground group-hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
          </div>

          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{item.title}</span>

              {/* Badge moderne */}
              {item.badge && (
                <Badge className="h-5 px-2 text-xs font-semibold text-white border-0 shadow-sm bg-gradient-to-r from-blue-500 to-purple-600">
                  {item.badge}
                </Badge>
              )}

              {/* Chevron pour les éléments avec enfants */}
              {hasChildren && (
                <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              )}
            </>
          )}
        </button>

        {/* Sous-menu avec animation */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
            {item.children?.map((child) => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
        className={cn(
          'flex flex-col h-full bg-card/60 backdrop-blur-md border-r border-border/60 transition-all duration-300 relative',
          isCollapsed ? 'w-16' : 'w-64'
        )}
        style={{ 
          overflow: 'visible',
          transform: 'translateZ(0)', // Force hardware acceleration
          isolation: 'auto' // Évite les problèmes de stacking context
        }}
      >
      {/* Header avec bouton toggle toujours visible */}
      <div className="p-4 border-b border-border/60 relative sidebar-header">
        <div
          className={cn('flex items-center', isCollapsed ? 'justify-center' : 'justify-between')}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="navigation-icon flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="navigation-status absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background animate-pulse"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-foreground tracking-wide">{t('navigationTitle')}</p>
                <p className="text-xs text-muted-foreground font-medium">{t('modulesERP')}</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="relative">
              <div className="navigation-icon flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="navigation-status absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-background animate-pulse"></div>
            </div>
          )}

          {/* Bouton toggle */}
          <button
            onClick={onToggle}
            className="toggle-button flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-accent-foreground transition-all duration-200"
            aria-label={isCollapsed ? t('showSidebar') : t('hideSidebar')}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Section de basculement du menu */}
      <div className="px-4 py-3 border-b border-border/60">
        {!isCollapsed ? (
          /* Version étendue */
          <TooltipFixed
            side="right"
            sideOffset={15}
            content={
              <div>
                <p className="font-medium">
                  {isCustom ? 'Menu Personnalisé Actif' : 'Menu Standard Actif'}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {isCustom 
                    ? 'Affiche vos préférences et personnalisations' 
                    : 'Affiche le menu par défaut configuré par les admins'
                  }
                </p>
                <p className="text-xs opacity-75 mt-1">
                  Cliquez pour basculer
                </p>
              </div>
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('[Sidebar] Toggle mode manuel + refresh')
                toggleMode()
                setTimeout(() => refreshMenu(), 100)
              }}
              className={cn(
                "w-full justify-start gap-2 text-xs font-medium transition-all duration-200",
                isCustom 
                  ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100" 
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              {isCustom ? (
                <Palette className="h-4 w-4" />
              ) : (
                <ListChecks className="h-4 w-4" />
              )}
              <span className="truncate">
                {isCustom ? 'Menu Personnalisé' : 'Menu Standard'}
              </span>
              {isCustom ? (
                <ToggleRight className="h-4 w-4 ml-auto text-purple-600" />
              ) : (
                <ToggleLeft className="h-4 w-4 ml-auto text-blue-600" />
              )}
            </Button>
          </TooltipFixed>
        ) : (
          /* Version compacte */
          <TooltipFixed
            side="right"
            sideOffset={15}
            content={
              <div>
                <p className="font-medium">
                  {isCustom ? 'Menu Personnalisé' : 'Menu Standard'}
                </p>
                <p className="text-xs opacity-90 mt-1">
                  {isCustom 
                    ? 'Vos préférences sont appliquées' 
                    : 'Menu standard administrateur'
                  }
                </p>
                <p className="text-xs opacity-75 mt-1">
                  Cliquez pour basculer
                </p>
              </div>
            }
          >
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              className={cn(
                "w-full h-9 px-0 justify-center transition-all duration-200",
                isCustom 
                  ? "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100" 
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              )}
            >
              {isCustom ? (
                <Palette className="h-4 w-4" />
              ) : (
                <ListChecks className="h-4 w-4" />
              )}
            </Button>
          </TooltipFixed>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigation.map((item) => renderNavItem(item))}
      </nav>

      <Separator className="bg-border/60" />

      {/* Bouton de personnalisation du menu (en bas, visible uniquement en mode custom) */}
      {isCustom && (
        <div className="px-4 pt-2">
          {!isCollapsed ? (
            <TooltipFixed
              side="right"
              sideOffset={15}
              content={
                <div>
                  <p className="font-medium">Personnaliser le menu</p>
                  <p className="text-xs opacity-90 mt-1">
                    Ouvrir le dashboard de personnalisation
                  </p>
                </div>
              }
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings/menu')}
                className="w-full justify-start gap-2 text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200/50 hover:border-purple-300"
              >
                <Settings2 className="h-4 w-4" />
                <span className="truncate">Personnaliser le menu</span>
              </Button>
            </TooltipFixed>
          ) : (
            <TooltipFixed
              side="top"
              sideOffset={15}
              content={
                <div>
                  <p className="font-medium">Personnaliser le menu</p>
                  <p className="text-xs opacity-90 mt-1">
                    Ouvrir les paramètres de menu
                  </p>
                </div>
              }
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/settings/menu')}
                className="w-full h-9 px-0 justify-center text-purple-600 hover:text-purple-700 hover:bg-purple-50 border border-purple-200/50 hover:border-purple-300"
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </TooltipFixed>
          )}
        </div>
      )}

      {/* Footer utilisateur simplifié avec effet hover */}
      <div className="p-4">
        <div
          className={cn(
            'flex items-center rounded-xl bg-gradient-to-r from-muted/50 to-accent/50 p-3 border border-border/60 transition-all duration-200 cursor-pointer group',
            'hover:from-accent/50 hover:to-accent/70 hover:border-accent/60 hover:shadow-md',
            isCollapsed && 'justify-center'
          )}
        >
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 group-hover:from-emerald-600 group-hover:to-teal-700 group-hover:shadow-lg group-hover:scale-105">
              <User className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full transition-all duration-200 group-hover:bg-emerald-600 group-hover:scale-110" />
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1 transition-all duration-200">
              <p className="text-sm font-medium text-foreground leading-none group-hover:text-foreground transition-colors duration-200">
                {t('connected') || 'Connecté'}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-muted-foreground group-hover:text-muted-foreground transition-colors duration-200">
                  {t('erpActive') || 'ERP Actif'}
                </p>
                <div className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isCustom ? "bg-purple-500" : "bg-blue-500"
                )} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
