// apps/web/src/components/layout/sidebar.tsx
'use client'

import { Button } from '@erp/ui'
import { Palette, Settings2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ErpInfoModalWrapper as ErpInfoModal } from '../../components/wrappers'
import { useBackendStatus } from '../../hooks/use-backend-health'
import { useDynamicMenu } from '../../hooks/use-dynamic-menu'
import { usePermissions } from '../../hooks/use-permissions'
import { useSidebarPreferences } from '../../hooks/use-ui-preferences'
import { useTranslation } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { NavItem } from './sidebar/components/NavItem'
import { SidebarFooter } from './sidebar/components/SidebarFooter'
import { SidebarHeader } from './sidebar/components/SidebarHeader'
import { SidebarMenuSwitch } from './sidebar/components/SidebarMenuSwitch'
import { getNavigation } from './sidebar/constants/navigation'
import type { NavItem as NavItemType } from './sidebar/types'
import { isActive } from './sidebar/utils/active-state'
import { convertDynamicToNavItem } from './sidebar/utils/menu-converter'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation('navigation')

  // Utiliser les préférences persistées pour les items expandés
  const { expandedItems: persistedExpanded, setExpandedItems: persistExpanded, toggleExpandedItem } = useSidebarPreferences()
  const [expandedItems, setExpandedItems] = useState<string[]>([t('configuration')])
  const [showErpInfo, setShowErpInfo] = useState(false)

  // Synchroniser avec les préférences persistées
  useEffect(() => {
    if (persistedExpanded.length > 0) {
      setExpandedItems(persistedExpanded)
    }
  }, [persistedExpanded])

  const { statusColor, statusText } = useBackendStatus()
  const { hasAnyRole } = usePermissions()

  const {
    filteredMenu,
    loading,
    error,
    currentMode,
    toggleMode,
    isCustom,
    refreshKey,
  } = useDynamicMenu()

  const staticNavigation = getNavigation(t)
  const mode = currentMode

  const convertMenuCallback = useCallback(
    (items: any[]) => convertDynamicToNavItem(items, t),
    [t]
  )

  // Filter navigation items by role
  const filterNavByRole = useCallback((items: NavItemType[]): NavItemType[] => {
    return items
      .filter((item) => {
        // If no roles are specified, show the item to everyone
        if (!item.roles || item.roles.length === 0) {
          return true
        }
        // Check if user has any of the required roles
        return hasAnyRole(item.roles)
      })
      .map((item) => ({
        ...item,
        // Recursively filter children
        children: item.children ? filterNavByRole(item.children) : undefined,
      }))
      .filter((item) => {
        // Remove items that have no href and no children (empty folders)
        return item.href || (item.children && item.children.length > 0)
      })
  }, [hasAnyRole])

  const navigation = useMemo(() => {
    if (!loading && Array.isArray(filteredMenu) && filteredMenu.length > 0) {
      // Le filtrage par rôle est déjà fait côté serveur par l'endpoint /tree/filtered
      // Ne pas refiltrer côté frontend pour éviter les race conditions
      const converted = convertMenuCallback(filteredMenu)
      return converted
    } else if (loading) {
      // Pendant le chargement, montrer le menu statique filtré par rôle
      return filterNavByRole(staticNavigation)
    } else if (error || filteredMenu.length === 0) {
      // En cas d'erreur ou menu vide, utiliser le menu statique filtré
      return filterNavByRole(staticNavigation)
    }
    return filterNavByRole(staticNavigation)
  }, [loading, filteredMenu, convertMenuCallback, staticNavigation, error, filterNavByRole])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => {
      const newExpanded = prev?.includes(title)
        ? prev?.filter((item) => item !== title)
        : [...prev, title]
      // Persister dans localStorage
      persistExpanded(newExpanded)
      return newExpanded
    })
  }

  const renderNavItem = (item: NavItemType, index: number) => {
    const itemIsActive = isActive(item.href, pathname)
    const hasActiveChild =
      item.children &&
      item.children.length > 0 &&
      item.children.some((child) => {
        if (!child.href) return false
        return pathname === child.href || pathname?.startsWith(`${child.href}/`)
      })
    const isExpanded = expandedItems?.includes(item.title)

    return (
      <NavItem
        key={`${item.href || item.title}-${index}-${refreshKey}`}
        item={item}
        level={0}
        isCollapsed={isCollapsed}
        isExpanded={isExpanded}
        isActive={itemIsActive}
        hasActiveChild={hasActiveChild || false}
        onToggleExpanded={toggleExpanded}
      />
    )
  }

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card/95 backdrop-blur-sm border-r border-border/50 transition-all duration-300 ease-out shadow-sm',
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      )}
    >
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} onToggle={onToggle} t={t} />

      {/* Menu mode switch */}
      <SidebarMenuSwitch
        isCollapsed={isCollapsed}
        isCustom={isCustom}
        onToggleMode={toggleMode}
        t={t}
      />

      {/* Navigation */}
      <nav className={cn('flex-1 overflow-y-auto overflow-x-hidden py-3', isCollapsed ? 'px-2' : 'px-3')}>
        {navigation?.length === 0 && mode === 'custom' && !loading ? (
          <div className="p-3 text-center">
            <Palette className="h-5 w-5 mx-auto mb-2 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground mb-2">{t('emptyCustomMenu')}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router?.push('/settings/menu')}
              className="text-xs h-7"
            >
              <Settings2 className="h-3 w-3 mr-1" />
              {t('customize')}
            </Button>
          </div>
        ) : (
          <div className="space-y-0.5">
            {navigation?.map((item, index) => renderNavItem(item, index))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <SidebarFooter
        isCollapsed={isCollapsed}
        statusColor={statusColor}
        statusText={statusText}
        onShowErpInfo={() => setShowErpInfo(true)}
        t={t}
      />

      {/* ERP Info Modal */}
      {typeof window !== 'undefined' && (
        <ErpInfoModal isOpen={showErpInfo} onClose={() => setShowErpInfo(false)} />
      )}
    </aside>
  )
}
