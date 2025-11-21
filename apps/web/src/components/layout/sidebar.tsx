// apps/web/src/components/layout/sidebar.tsx - REFACTORED VERSION
'use client'

import { Button, Separator } from '@erp/ui'
import { Palette, Settings2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import React, { useCallback, useMemo, useState } from 'react'
import { ErpInfoModalWrapper as ErpInfoModal } from '../../components/wrappers'
import { useBackendStatus } from '../../hooks/use-backend-health'
import { useDynamicMenu } from '../../hooks/use-dynamic-menu'
import { useTranslation } from '../../lib/i18n'
import { cn } from '../../lib/utils'
import { NavItem } from './sidebar/components/NavItem'
import { SidebarFooter } from './sidebar/components/SidebarFooter'
import { SidebarHeader } from './sidebar/components/SidebarHeader'
import { SidebarMenuSwitch } from './sidebar/components/SidebarMenuSwitch'
import { getNavigation } from './sidebar/constants/navigation'
import type { NavItem as NavItemType } from './sidebar/types'
import { isActive, isParentActive } from './sidebar/utils/active-state'
import { convertDynamicToNavItem } from './sidebar/utils/menu-converter'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation('navigation')
  const [expandedItems, setExpandedItems] = useState<string[]>([t('configuration')])
  const [showErpInfo, setShowErpInfo] = useState(false)

  // Hook pour le statut du backend
  const { isOnline: _, statusColor, statusText } = useBackendStatus()

  // Hooks pour la gestion du menu
  const {
    filteredMenu,
    loading,
    error,
    currentMode,
    refreshMenu: _refreshMenu,
    toggleMode,
    isStandard: _isStandard,
    isCustom,
    refreshKey,
  } = useDynamicMenu()
  const staticNavigation = getNavigation(t)

  // Utiliser le mode depuis useDynamicMenu pour éviter les désynchronisations
  const mode = currentMode

  // Convertir le menu dynamique au format NavItem (mémoïsé pour éviter les re-renders)
  const convertMenuCallback = useCallback(
    (items: any[]) => convertDynamicToNavItem(items, t),
    [t]
  )

  // Utiliser le menu dynamique (depuis la DB) dans tous les cas
  // En mode custom, même si le menu est vide, ne pas retomber sur staticNavigation
  const navigation = useMemo(() => {
    if (!loading && Array.isArray(filteredMenu)) {
      return convertMenuCallback(filteredMenu) // Peut être vide en mode custom
    } else if (loading) {
      return staticNavigation // Pendant le loading, afficher le menu statique temporairement
    } else if (error) {
      return staticNavigation // Fallback en cas d'erreur
    } else {
      return [] // Menu vide si pas de données et pas d'erreur
    }
  }, [loading, filteredMenu, convertMenuCallback, staticNavigation, error])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev?.includes(title) ? prev?.filter((item) => item !== title) : [...prev, title]
    )
  }

  const renderNavItem = (item: NavItemType, index: number) => {
    const itemIsActive = isActive(item.href, pathname)
    const parentIsActive = isParentActive(item, pathname)
    const hasActiveChild =
      item.children &&
      item.children?.length > 0 &&
      item.children?.some((child) => {
        if (!child.href) return false
        return pathname === child.href || pathname?.startsWith(`${child.href}/`)
      })
    const isExpanded = expandedItems?.includes(item.title)

    return (
      <NavItem
        key={`${item.href || item.title || 'unnamed'}-nav-${index}-${navigation?.length}-refresh-${refreshKey}`}
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
      {/* Header */}
      <SidebarHeader isCollapsed={isCollapsed} onToggle={onToggle} t={t} />

      {/* Section de basculement du menu */}
      <SidebarMenuSwitch
        isCollapsed={isCollapsed}
        isCustom={isCustom}
        onToggleMode={toggleMode}
        t={t}
      />

      {/* Navigation */}
      <nav className="flex-1 p-1.5 space-y-0.5 overflow-y-auto">
        {navigation?.length === 0 && mode === 'custom' && !loading ? (
          // Message quand le menu personnalisé est vierge
          <div className="p-4 text-center">
            <div className="text-muted-foreground text-sm">
              <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium mb-1">{t('emptyCustomMenu')}</p>
              <p className="text-xs opacity-75 mb-3">{t('customizeMenuDescription')}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router?.push('/settings/menu')}
                className="text-xs"
              >
                <Settings2 className="h-3 w-3 mr-1" />
                {t('customize')}
              </Button>
            </div>
          </div>
        ) : (
          navigation?.map((item, index) => renderNavItem(item, index))
        )}
      </nav>

      <Separator className="bg-border/60" />

      {/* Footer */}
      <SidebarFooter
        isCollapsed={isCollapsed}
        statusColor={statusColor}
        statusText={statusText}
        onShowErpInfo={() => setShowErpInfo(true)}
        t={t}
      />

      {/* Modal d'information ERP - Portal pour centre de l'écran */}
      {typeof window !== 'undefined' && (
        <ErpInfoModal isOpen={showErpInfo} onClose={() => setShowErpInfo(false)} />
      )}
    </div>
  )
}
