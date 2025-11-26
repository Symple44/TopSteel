// apps/web/src/components/layout/sidebar.tsx
'use client'

import { Button } from '@erp/ui'
import { Palette, Settings2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
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
  const [expandedItems, setExpandedItems] = useState<string[]>([t('configuration')])
  const [showErpInfo, setShowErpInfo] = useState(false)

  const { statusColor, statusText } = useBackendStatus()

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

  const navigation = useMemo(() => {
    if (!loading && Array.isArray(filteredMenu)) {
      return convertMenuCallback(filteredMenu)
    } else if (loading) {
      return staticNavigation
    } else if (error) {
      return staticNavigation
    }
    return []
  }, [loading, filteredMenu, convertMenuCallback, staticNavigation, error])

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) =>
      prev?.includes(title) ? prev?.filter((item) => item !== title) : [...prev, title]
    )
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
        'flex flex-col h-full bg-card border-r border-border transition-[width] duration-200',
        isCollapsed ? 'w-[60px]' : 'w-[240px]'
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
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
        {navigation?.length === 0 && mode === 'custom' && !loading ? (
          <div className="p-3 text-center">
            <Palette className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
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
