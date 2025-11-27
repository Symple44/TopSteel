// apps/web/src/components/layout/sidebar/components/SidebarHeader.tsx
'use client'

import { LayoutDashboard } from 'lucide-react'
import React from 'react'
import { cn } from '../../../../lib/utils'

interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggle?: () => void
  t: (key: string) => string
}

export function SidebarHeader({ isCollapsed, onToggle, t }: SidebarHeaderProps) {
  return (
    <div className={cn('px-3 py-3 border-b border-border', isCollapsed && 'px-2')}>
      <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-2.5')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{t('navigationTitle')}</p>
            <p className="text-[11px] text-muted-foreground truncate">{t('modulesERP')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
