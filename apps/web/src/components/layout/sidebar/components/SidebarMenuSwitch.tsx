// apps/web/src/components/layout/sidebar/components/SidebarMenuSwitch.tsx
'use client'

import { SimpleTooltip } from '@erp/ui'
import { ListChecks, Palette, Settings2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { cn } from '../../../../lib/utils'

interface SidebarMenuSwitchProps {
  isCollapsed: boolean
  isCustom: boolean
  onToggleMode: () => void
  t: (key: string) => string
}

export function SidebarMenuSwitch({
  isCollapsed,
  isCustom,
  onToggleMode,
  t,
}: SidebarMenuSwitchProps) {
  const router = useRouter()

  if (isCollapsed) {
    return (
      <div className="px-2 py-2 border-b border-border">
        <SimpleTooltip content={isCustom ? t('customMenu') : t('standardMenu')} side="right">
          <button
            type="button"
            onClick={onToggleMode}
            className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {isCustom ? <Palette className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
          </button>
        </SimpleTooltip>
      </div>
    )
  }

  return (
    <div className="px-3 py-2 border-b border-border">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleMode}
          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          {isCustom ? <Palette className="h-4 w-4" /> : <ListChecks className="h-4 w-4" />}
          <span className="text-xs">{isCustom ? t('customMenu') : t('standardMenu')}</span>
        </button>
        {isCustom && (
          <SimpleTooltip content={t('customizeMenu')} side="right">
            <button
              type="button"
              onClick={() => router?.push('/settings/menu')}
              className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </SimpleTooltip>
        )}
      </div>
    </div>
  )
}
