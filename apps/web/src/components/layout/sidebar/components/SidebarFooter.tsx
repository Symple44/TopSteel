// apps/web/src/components/layout/sidebar/components/SidebarFooter.tsx
'use client'

import { Monitor } from 'lucide-react'
import React from 'react'
import { cn } from '../../../../lib/utils'

interface SidebarFooterProps {
  isCollapsed: boolean
  statusColor: string
  statusText: string
  onShowErpInfo: () => void
  t: (key: string) => string
}

export function SidebarFooter({
  isCollapsed,
  statusColor,
  statusText,
  onShowErpInfo,
  t,
}: SidebarFooterProps) {
  return (
    <div className="p-3">
      <button
        type="button"
        onClick={onShowErpInfo}
        className={cn(
          'flex items-center rounded-lg bg-gradient-to-r from-muted/50 to-accent/50 p-2.5 border border-border/60 transition-all duration-200 cursor-pointer group',
          'hover:from-accent/50 hover:to-accent/70 hover:border-accent/60 hover:shadow-md',
          isCollapsed && 'justify-center'
        )}
        aria-label="Afficher les informations du système ERP"
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
      </button>
    </div>
  )
}
