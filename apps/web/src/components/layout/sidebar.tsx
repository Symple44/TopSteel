// apps/web/src/components/layout/sidebar.tsx - VERSION AMÉLIORÉE
'use client'

import { Badge, Button, Separator } from '@erp/ui'
import {
  Activity,
  BarChart3,
  Bell,
  Briefcase,
  Building,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Cog,
  CreditCard,
  Database,
  Eye,
  Factory,
  FileBarChart,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  Home,
  Languages,
  LayoutDashboard,
  ListChecks,
  type LucideIcon,
  Menu,
  Monitor,
  Package,
  Palette,
  PieChart,
  Scale,
  Search,
  Settings,
  Settings2,
  Shield,
  Table,
  TestTube,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { ErpInfoModalWrapper as ErpInfoModal } from '@/components/wrappers'
import { SimpleTooltip as TooltipFixed } from '@erp/ui/primitives'
import { useBackendStatus } from '@/hooks/use-backend-health'
import { useDynamicMenu } from '@/hooks/use-dynamic-menu'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { getTranslatedTitle } from '@/utils/menu-translations'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }> | string
  badge?: string
  gradient?: string
  customIconColor?: string
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
  Wrench,
  Monitor,
  Languages,
  Table,
  Search,
  Globe,
  // Mappings pour les icônes des routes API
  dashboard: LayoutDashboard,
  admin: Shield,
  company: Building2,
  roles: Shield,
  database: Database,
  translations: Languages,
  notifications: Bell,
  rules: Scale,
  planning: CalendarDays,
  test: TestTube,
  menu: Menu,
  // Mappings pour les icônes du menu par défaut (string literals)
  // Removed duplicates that already exist above
}

const getNavigation = (t: any): NavItem[] => [
  {
    title: t('dashboard'),
    href: '/dashboard',
    icon: Home,
    gradient: 'from-blue-500 to-purple-600',
  },
  {
    title: t('queryBuilder'),
    href: '/query-builder',
    icon: Search,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: t('configuration'),
    href: '/admin',
    icon: Shield,
    gradient: 'from-red-500 to-pink-600',
    roles: ['ADMIN'],
    children: [
      {
        title: t('sessionsManagement'),
        href: '/admin/sessions',
        icon: Monitor,
        gradient: 'from-cyan-500 to-teal-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('translationsManagement'),
        href: '/admin/translations',
        icon: Languages,
        gradient: 'from-emerald-500 to-green-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('dataTableTest'),
        href: '/admin/datatable-test',
        icon: Table,
        gradient: 'from-violet-500 to-purple-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
]

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation('navigation')
  const [expandedItems, setExpandedItems] = useState<string[]>([t('configuration')])
  const [showErpInfo, setShowErpInfo] = useState(false)

  // Hook pour le statut du backend
  const { isOnline, statusColor, statusText } = useBackendStatus()

  // Hooks pour la gestion du menu
  const {
    filteredMenu,
    loading,
    error,
    currentMode,
    refreshMenu,
    toggleMode,
    isStandard,
    isCustom,
    refreshKey,
  } = useDynamicMenu()
  const staticNavigation = getNavigation(t)

  // Utiliser le mode depuis useDynamicMenu pour éviter les désynchronisations
  const mode = currentMode

  // Convertir le menu dynamique au format NavItem (mémoïsé pour éviter les re-renders)
  const convertDynamicToNavItem = useCallback(
    (items: any[]): NavItem[] => {
      if (!Array.isArray(items)) {
        return []
      }

      const converted = items.map((item) => {
        // Appliquer les préférences utilisateur si disponibles
        const displayTitle =
          item.userPreferences?.customTitle ||
          (item.titleKey ? t(item.titleKey) : getTranslatedTitle(item))
        const displayIcon = item.userPreferences?.customIcon || item.icon
        const displayBadge = item.userPreferences?.customBadge || item.badge

        // Générer le href basé sur le type de menu du nouveau système
        let href: string | undefined

        switch (item.type) {
          case 'P': // Programme
            href = item.programId
            break
          case 'L': // Lien externe
            href = item.externalUrl
            break
          case 'D': // Vue Data
            href = item.queryBuilderId ? `/query-builder/${item.queryBuilderId}/view` : undefined
            break
          default:
            href = item.href // Fallback pour compatibilité
            break
        }

        return {
          title: displayTitle,
          href,
          icon: typeof displayIcon === 'string' ? iconMap[displayIcon] || Settings : displayIcon,
          badge: displayBadge,
          gradient: item.gradient,
          customIconColor: item.userPreferences?.customColor, // Ajouter la couleur personnalisée
          children: item.children ? convertDynamicToNavItem(item.children) : undefined,
          roles: item.roles,
          // Ajouter des indicateurs visuels pour les préférences
          isFavorite: item.userPreferences?.isFavorite,
          isPinned: item.userPreferences?.isPinned,
          isCustomized:
            item.userPreferences?.customTitle ||
            item.userPreferences?.customIcon ||
            item.userPreferences?.customBadge,
        }
      })

      return converted
    },
    [t]
  )

  // Utiliser le menu dynamique (depuis la DB) dans tous les cas
  // En mode custom, même si le menu est vide, ne pas retomber sur staticNavigation
  const navigation = useMemo(() => {
    if (!loading && Array.isArray(filteredMenu)) {
      return convertDynamicToNavItem(filteredMenu) // Peut être vide en mode custom
    } else if (loading) {
      return staticNavigation // Pendant le loading, afficher le menu statique temporairement
    } else if (error) {
      return staticNavigation // Fallback en cas d'erreur
    } else {
      return [] // Menu vide si pas de données et pas d'erreur
    }
  }, [loading, filteredMenu, convertDynamicToNavItem, staticNavigation, error])

  // Sidebar state tracking (debug removed)

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    )
  }

  const isActive = (href?: string) => {
    if (!href) return false

    // Correspondance exacte uniquement - pas de startsWith
    return pathname === href
  }

  const isParentActive = (item: NavItem) => {
    // L'accueil (/dashboard) est traité comme un élément indépendant, pas un parent
    if (item.href === '/dashboard') return false

    if (isActive(item.href)) return true

    return item.children?.some((child) => isActive(child.href)) || false
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const itemIsActive = isActive(item.href)
    const _parentIsActive = isParentActive(item)
    const hasActiveChild =
      hasChildren &&
      item.children?.some((child) => {
        if (!child.href) return false
        // Un enfant est actif si l'URL courante correspond exactement ou est une sous-page
        return pathname === child.href || pathname.startsWith(`${child.href}/`)
      })

    const handleClick = () => {
      if (hasChildren) {
        toggleExpanded(item.title)
      } else if (item.href) {
        router.push(item.href)
      }
    }

    return (
      <div className="space-y-1">
        <button
          onClick={handleClick}
          aria-label={item.title}
          type="button"
          className={cn(
            'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium cursor-pointer transition-all duration-200 w-full text-left',
            level === 0 && 'mx-0.5 font-semibold',
            level === 1 && 'ml-0 mr-0.5 text-xs menu-submenu-bg font-normal',
            itemIsActive
              ? level === 0
                ? 'menu-item-active-primary shadow-md backdrop-blur-sm'
                : 'menu-item-active-secondary shadow-sm'
              : hasActiveChild && level === 0
                ? 'menu-item-parent-with-active-child'
                : level === 0
                  ? 'menu-item-inactive'
                  : 'menu-item-inactive-sub',
            isCollapsed && 'justify-center px-2'
          )}
        >
          {/* Indicateur actif moderne - adapté au niveau */}
          {itemIsActive && level === 0 && (
            <div
              className={cn(
                'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-gradient-to-b',
                item.gradient || 'from-blue-500 to-purple-600'
              )}
            />
          )}
          {/* Indicateur parent avec enfant actif - plus subtil */}
          {hasActiveChild && !itemIsActive && level === 0 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary/40" />
          )}
          {/* Petit indicateur pour les sous-menus */}
          {itemIsActive && level === 1 && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-accent" />
          )}

          {/* Icône avec gradient - différenciée par niveau */}
          <div
            className={cn(
              'flex items-center justify-center rounded-md transition-all duration-200',
              level === 0 ? 'h-6 w-6' : 'h-5 w-5',
              itemIsActive
                ? level === 0
                  ? `bg-gradient-to-br ${item.gradient || 'from-blue-500 to-purple-600'} text-white shadow-md`
                  : 'menu-icon-active shadow-sm'
                : hasActiveChild && level === 0
                  ? 'menu-icon-parent-with-active-child'
                  : 'menu-icon-inactive'
            )}
          >
            {item.icon ? (
              <item.icon
                className={level === 0 ? 'h-3.5 w-3.5' : 'h-3 w-3'}
                style={
                  item.customIconColor && !itemIsActive
                    ? { color: item.customIconColor }
                    : undefined
                }
              />
            ) : (
              <Settings
                className={level === 0 ? 'h-3.5 w-3.5' : 'h-3 w-3'}
                style={
                  item.customIconColor && !itemIsActive
                    ? { color: item.customIconColor }
                    : undefined
                }
              />
            )}
          </div>

          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{getTranslatedTitle(item)}</span>

              {/* Badge moderne - plus compact */}
              {item.badge && (
                <Badge className="h-4 px-1.5 text-xs font-medium text-white border-0 shadow-sm bg-gradient-to-r from-blue-500 to-purple-600">
                  {item.badge}
                </Badge>
              )}

              {/* Chevron pour les éléments avec enfants - plus petit */}
              {hasChildren && (
                <div className="menu-chevron transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </div>
              )}
            </>
          )}
        </button>

        {/* Sous-menu avec animation - séparation claire et hiérarchie renforcée */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 ml-4 pl-4 border-l-2 border-primary/30 bg-muted/20 rounded-r-lg space-y-0.5 animate-in slide-in-from-top-1 duration-200">
            {(item.children || []).map((child, childIndex) => (
              <React.Fragment
                key={`${child.href || child.title || 'unnamed'}-child-${childIndex}-level-${level}`}
              >
                {renderNavItem(child, level + 1)}
              </React.Fragment>
            ))}
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
        isolation: 'auto', // Évite les problèmes de stacking context
      }}
    >
      {/* Header avec bouton toggle toujours visible */}
      <div className="px-4 py-3 border-b border-border/60 relative sidebar-header">
        <div
          className={cn(
            'flex items-center',
            isCollapsed ? 'justify-center w-full' : 'justify-between'
          )}
        >
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="navigation-icon flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{t('navigationTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('modulesERP')}</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="flex items-center justify-center w-full h-11">
              <button
                onClick={onToggle}
                className="navigation-icon flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-lg cursor-pointer hover:scale-110 transition-all duration-200"
                aria-label={t('showSidebar')}
              >
                <LayoutDashboard className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Bouton fermer - visible uniquement quand ouvert */}
          {!isCollapsed && (
            <button
              onClick={onToggle}
              className="toggle-button flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-accent-foreground transition-all duration-200"
              aria-label={t('hideSidebar')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Section de basculement du menu */}
      <div className="px-4 py-3 border-b border-border/60">
        {isCollapsed ? (
          /* Version compacte - Pas de switch, juste indicateur visuel */
          <div className="flex justify-center">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-muted/60 to-accent/20 transition-all duration-300">
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-md transition-all duration-300',
                  isCustom
                    ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
                )}
              >
                {isCustom ? <Palette className="h-3 w-3" /> : <ListChecks className="h-3 w-3" />}
              </div>
            </div>
          </div>
        ) : (
          /* Version étendue - Switch compact sur une seule ligne */
          <div className="flex items-center justify-between">
            <TooltipFixed
              side="right"
              sideOffset={15}
              content={
                <div>
                  <p className="font-medium">{isCustom ? t('customMenu') : t('standardMenu')}</p>
                  <p className="text-xs opacity-90 mt-1">
                    {isCustom ? t('customPreferencesApplied') : t('standardAdminMenu')}
                  </p>
                  <p className="text-xs opacity-75 mt-1">{t('clickToSwitch')}</p>
                </div>
              }
            >
              <div
                className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-muted/50 to-accent/20 backdrop-blur-sm border border-border/40 hover:from-accent/20 hover:to-accent/30 transition-all duration-300 cursor-pointer group flex-1"
                onClick={() => {
                  toggleMode()
                  // Le refreshMenu sera déclenché automatiquement par le useEffect du changement de mode
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      'w-3 h-6 rounded-full transition-all duration-300 relative flex-shrink-0',
                      isCustom ? 'bg-gradient-to-b from-purple-400 to-pink-500' : 'bg-muted'
                    )}
                  >
                    <div
                      className={cn(
                        'w-2 h-2 bg-white rounded-full shadow-sm transition-all duration-300 absolute left-0.5',
                        isCustom ? 'translate-y-3' : 'translate-y-0.5'
                      )}
                    />
                  </div>
                  <div
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-md transition-all duration-300 flex-shrink-0',
                      isCustom
                        ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md group-hover:shadow-purple-500/25 group-hover:scale-110'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md group-hover:shadow-blue-500/25 group-hover:scale-110'
                    )}
                  >
                    {isCustom ? (
                      <Palette className="h-3 w-3" />
                    ) : (
                      <ListChecks className="h-3 w-3" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-foreground flex-1 text-left">
                    {isCustom ? t('customMenu') : t('standardMenu')}
                  </span>
                </div>
              </div>
            </TooltipFixed>

            {/* Bouton de personnalisation sur la même ligne */}
            {isCustom && (
              <TooltipFixed
                side="right"
                sideOffset={15}
                triggerAsChild={true}
                content={
                  <div>
                    <p className="font-medium">{t('customizeMenu')}</p>
                    <p className="text-xs opacity-90 mt-1">{t('openCustomizationDashboard')}</p>
                  </div>
                }
              >
                <button
                  type="button"
                  onClick={() => router.push('/settings/menu')}
                  className="inline-flex items-center justify-center w-10 h-8 p-0 ml-0.5 bg-gradient-to-br from-accent/10 to-accent/20 hover:from-accent/20 hover:to-accent/30 border border-accent/20 hover:border-accent/30 transition-all duration-300 flex-shrink-0 rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  <Settings2 className="h-3 w-3" />
                </button>
              </TooltipFixed>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
        {navigation.length === 0 && mode === 'custom' && !loading ? (
          // Message quand le menu personnalisé est vierge
          <div className="p-4 text-center">
            <div className="text-muted-foreground text-sm">
              <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium mb-1">{t('emptyCustomMenu')}</p>
              <p className="text-xs opacity-75 mb-3">{t('customizeMenuDescription')}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/settings/menu')}
                className="text-xs"
              >
                <Settings2 className="h-3 w-3 mr-1" />
                {t('customize')}
              </Button>
            </div>
          </div>
        ) : (
          navigation.map((item, index) => (
            <React.Fragment
              key={`${item.href || item.title || 'unnamed'}-nav-${index}-${navigation.length}-refresh-${refreshKey}`}
            >
              {renderNavItem(item)}
            </React.Fragment>
          ))
        )}
      </nav>

      <Separator className="bg-border/60" />

      {/* Footer utilisateur simplifié avec effet hover - plus compact */}
      <div className="p-3">
        <div
          onClick={() => setShowErpInfo(true)}
          className={cn(
            'flex items-center rounded-lg bg-gradient-to-r from-muted/50 to-accent/50 p-2.5 border border-border/60 transition-all duration-200 cursor-pointer group',
            'hover:from-accent/50 hover:to-accent/70 hover:border-accent/60 hover:shadow-md',
            isCollapsed && 'justify-center'
          )}
        >
          <div className="relative">
            <div className="h-7 w-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all duration-200 group-hover:from-emerald-600 group-hover:to-teal-700 group-hover:shadow-lg group-hover:scale-105">
              <Monitor className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
            </div>
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 border-2 border-white rounded-full transition-all duration-200 group-hover:scale-110',
                statusColor
              )}
            />
          </div>
          {!isCollapsed && (
            <div className="ml-2.5 flex-1 transition-all duration-200">
              <p className="text-sm font-medium text-foreground leading-none group-hover:text-foreground transition-colors duration-200">
                {t('connected') || 'Connecté'}
              </p>
              <div className="flex items-center space-x-2 mt-0.5">
                <p className="text-xs text-muted-foreground group-hover:text-muted-foreground transition-colors duration-200">
                  {statusText}
                </p>
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-colors duration-200',
                    statusColor
                  )}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'information ERP - Portal pour centre de l'écran */}
      {typeof window !== 'undefined' && (
        <ErpInfoModal
          isOpen={showErpInfo}
          onClose={() => setShowErpInfo(false)}
        />
      )}
    </div>
  )
}
