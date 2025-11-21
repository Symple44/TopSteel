// apps/web/src/components/layout/sidebar/components/SidebarHeader.tsx
'use client'

import { LayoutDashboard, X } from 'lucide-react'
import React from 'react'
import { cn } from '../../../../lib/utils'

interface SidebarHeaderProps {
  isCollapsed: boolean
  onToggle?: () => void
  t: (key: string) => string
}

export function SidebarHeader({ isCollapsed, onToggle, t }: SidebarHeaderProps) {
  return (
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
              type="button"
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
            type="button"
            onClick={onToggle}
            className="toggle-button flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-accent-foreground transition-all duration-200"
            aria-label={t('hideSidebar')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
