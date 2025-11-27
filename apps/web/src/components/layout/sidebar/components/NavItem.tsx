// apps/web/src/components/layout/sidebar/components/NavItem.tsx
'use client'

import { Badge, SimpleTooltip } from '@erp/ui'
import { ChevronRight, Settings } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
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
        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm cursor-pointer w-full text-left',
        'transition-all duration-200 ease-out',
        level === 0 && 'font-medium',
        level === 1 && 'text-[13px] pl-4 py-2 rounded-lg',
        isActive
          ? 'bg-primary/10 text-primary shadow-sm shadow-primary/10 font-semibold'
          : hasActiveChild
            ? 'text-foreground bg-muted/40'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-0.5',
        isCollapsed && 'justify-center px-2 rounded-lg'
      )}
    >
        {/* Active indicator - animated left border */}
        <div
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-primary transition-all duration-200',
            isActive ? 'h-5 opacity-100' : 'h-0 opacity-0'
          )}
        />

        {/* Icon with subtle animation */}
        <div
          className={cn(
            'flex items-center justify-center shrink-0 transition-transform duration-200',
            level === 0 ? 'h-5 w-5' : 'h-4 w-4',
            !isActive && 'group-hover:scale-110'
          )}
        >
          {item.icon ? (
            <item.icon
              className={cn(
                'transition-colors duration-200',
                level === 0 ? 'h-[18px] w-[18px]' : 'h-4 w-4',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
          ) : (
            <Settings
              className={cn(
                'transition-colors duration-200',
                level === 0 ? 'h-[18px] w-[18px]' : 'h-4 w-4',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
          )}
        </div>

        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{translatedTitle}</span>

            {/* Badge with improved style */}
            {item.badge && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-medium bg-primary/10 text-primary border-0">
                {item.badge}
              </Badge>
            )}

            {/* Animated chevron for items with children */}
            {hasChildren && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200 ease-out',
                  isExpanded && 'rotate-90',
                  'group-hover:text-foreground'
                )}
              />
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

      {/* Submenu with smooth animation */}
      {hasChildren && !isCollapsed && (
        <div
          className={cn(
            'overflow-hidden transition-all duration-200 ease-out',
            isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="mt-1 ml-3 pl-3 border-l border-border/50 space-y-0.5 py-0.5">
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
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])
  const isExpanded = expandedItems?.includes(item.title)

  const handleToggle = (title: string) => {
    setExpandedItems((prev) =>
      prev?.includes(title) ? prev?.filter((i) => i !== title) : [...prev, title]
    )
  }

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
