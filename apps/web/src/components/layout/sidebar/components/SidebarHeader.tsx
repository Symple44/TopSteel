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
    <div className={cn('px-4 py-4 border-b border-border/50', isCollapsed && 'px-3')}>
      <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25">
          <LayoutDashboard className="h-5 w-5" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate tracking-tight">{t('navigationTitle')}</p>
            <p className="text-xs text-muted-foreground/80 truncate">{t('modulesERP')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
