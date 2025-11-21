// apps/web/src/components/layout/sidebar/components/NavItem.tsx
'use client'

import { Badge } from '@erp/ui'
import { ChevronDown, ChevronRight, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { cn } from '../../../../lib/utils'
import { getTranslatedTitle } from '../../../../utils/menu-translations'
import type { NavItem as NavItemType } from '../types'

interface NavItemProps {
  item: NavItemType
  level?: number
  isCollapsed: boolean
  isExpanded: boolean
  isActive: boolean
  hasActiveChild: boolean
  onToggleExpanded: (title: string) => void
}

export function NavItem({
  item,
  level = 0,
  isCollapsed,
  isExpanded,
  isActive,
  hasActiveChild,
  onToggleExpanded,
}: NavItemProps) {
  const router = useRouter()
  const hasChildren = item.children && item?.children?.length > 0

  const handleClick = () => {
    if (hasChildren) {
      onToggleExpanded(item.title)
    } else if (item.href) {
      router?.push(item.href)
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
          isActive
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
        {isActive && level === 0 && (
          <div
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-gradient-to-b',
              item.gradient || 'from-blue-500 to-purple-600'
            )}
          />
        )}
        {/* Indicateur parent avec enfant actif - plus subtil */}
        {hasActiveChild && !isActive && level === 0 && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-primary/40" />
        )}
        {/* Petit indicateur pour les sous-menus */}
        {isActive && level === 1 && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-accent" />
        )}

        {/* Icône avec gradient - différenciée par niveau */}
        <div
          className={cn(
            'flex items-center justify-center rounded-md transition-all duration-200',
            level === 0 ? 'h-6 w-6' : 'h-5 w-5',
            isActive
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
                item.customIconColor && !isActive ? { color: item.customIconColor } : undefined
              }
            />
          ) : (
            <Settings
              className={level === 0 ? 'h-3.5 w-3.5' : 'h-3 w-3'}
              style={
                item.customIconColor && !isActive ? { color: item.customIconColor } : undefined
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
            <NavItemRecursive
              key={`${child.href || child.title || 'unnamed'}-child-${childIndex}-level-${level}`}
              item={child}
              level={level + 1}
              isCollapsed={isCollapsed}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Wrapper récursif pour NavItem qui gère la logique d'état
 */
interface NavItemRecursiveProps {
  item: NavItemType
  level: number
  isCollapsed: boolean
  onToggleExpanded: (title: string) => void
}

function NavItemRecursive({
  item,
  level,
  isCollapsed,
  onToggleExpanded,
}: NavItemRecursiveProps) {
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  const isExpanded = expandedItems?.includes(item.title)

  const handleToggle = (title: string) => {
    setExpandedItems((prev) =>
      prev?.includes(title) ? prev?.filter((i) => i !== title) : [...prev, title]
    )
  }

  // Utiliser le pathname pour déterminer l'état actif
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''

  const isActive = item.href ? pathname === item.href : false

  const hasActiveChild =
    item.children &&
    item.children?.length > 0 &&
    item.children?.some((child) => {
      if (!child.href) return false
      return pathname === child.href || pathname?.startsWith(`${child.href}/`)
    })

  return (
    <NavItem
      item={item}
      level={level}
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      isActive={isActive}
      hasActiveChild={hasActiveChild || false}
      onToggleExpanded={level === 0 ? onToggleExpanded : handleToggle}
    />
  )
}
