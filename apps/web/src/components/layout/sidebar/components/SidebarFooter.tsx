// apps/web/src/components/layout/sidebar/components/SidebarFooter.tsx
'use client'

import { Circle } from 'lucide-react'
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
    <div className={cn('px-3 py-3 border-t border-border', isCollapsed && 'px-2')}>
      <button
        type="button"
        onClick={onShowErpInfo}
        className={cn(
          'flex items-center w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted',
          isCollapsed && 'justify-center px-0'
        )}
        aria-label="System info"
      >
        <div className="relative shrink-0">
          <Circle className={cn('h-2 w-2 fill-current', statusColor)} />
        </div>
        {!isCollapsed && (
          <div className="ml-2 min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">{statusText}</p>
          </div>
        )}
      </button>
    </div>
  )
}
