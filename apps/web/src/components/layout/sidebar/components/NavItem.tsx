// apps/web/src/components/layout/sidebar/components/NavItem.tsx
'use client'

import { Badge, SimpleTooltip } from '@erp/ui'
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

  const translatedTitle = getTranslatedTitle(item)

  const buttonContent = (
    <button
      onClick={handleClick}
      aria-label={translatedTitle}
      aria-expanded={hasChildren ? isExpanded : undefined}
      aria-current={isActive ? 'page' : undefined}
      aria-haspopup={hasChildren ? 'true' : undefined}
      type="button"
      className={cn(
        'group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm cursor-pointer transition-colors w-full text-left',
        level === 0 && 'font-medium',
        level === 1 && 'text-[13px] pl-3',
        isActive
          ? 'bg-primary/10 text-primary'
          : hasActiveChild
            ? 'text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
        {/* Active indicator - simple left border */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
        )}

        {/* Icon - simple, no gradients */}
        <div
          className={cn(
            'flex items-center justify-center shrink-0',
            level === 0 ? 'h-5 w-5' : 'h-4 w-4'
          )}
        >
          {item.icon ? (
            <item.icon
              className={cn(
                level === 0 ? 'h-[18px] w-[18px]' : 'h-4 w-4',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
          ) : (
            <Settings
              className={cn(
                level === 0 ? 'h-[18px] w-[18px]' : 'h-4 w-4',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
          )}
        </div>

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{translatedTitle}</span>

            {/* Badge - simple style */}
            {item.badge && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium">
                {item.badge}
              </Badge>
            )}

            {/* Chevron for items with children */}
            {hasChildren && (
              <div className="text-muted-foreground">
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
  )

  return (
    <div>
      {/* Wrap with tooltip when collapsed */}
      {isCollapsed ? (
        <SimpleTooltip content={translatedTitle} side="right">
          {buttonContent}
        </SimpleTooltip>
      ) : (
        buttonContent
      )}

      {/* Submenu - clean hierarchy */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-0.5 ml-3 pl-3 border-l border-border space-y-0.5">
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
 * Recursive wrapper for NavItem that handles state logic
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

  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const isActive = item.href ? pathname === item.href : false
  const hasActiveChild =
    item.children?.some((child) => child.href && (pathname === child.href || pathname?.startsWith(`${child.href}/`))) || false

  return (
    <NavItem
      item={item}
      level={level}
      isCollapsed={isCollapsed}
      isExpanded={isExpanded}
      isActive={isActive}
      hasActiveChild={hasActiveChild}
      onToggleExpanded={level === 0 ? onToggleExpanded : handleToggle}
    />
  )
}
