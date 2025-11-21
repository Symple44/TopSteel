// apps/web/src/components/layout/sidebar/components/SidebarMenuSwitch.tsx
'use client'

import { SimpleTooltip as TooltipFixed } from '@erp/ui'
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

  return (
    <div className="px-4 py-3 border-b border-border/60">
      {isCollapsed ? (
        /* Version compacte - Pas de switch, juste indicateur visuel */
        <div className="flex justify-center">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-muted/60 to-accent/20 transition-all duration-300">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-md transition-all duration-300',
                isCustom
                  ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md'
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md'
              )}
            >
              {isCustom ? <Palette className="h-3 w-3" /> : <ListChecks className="h-3 w-3" />}
            </div>
          </div>
        </div>
      ) : (
        /* Version étendue - Switch compact sur une seule ligne */
        <div className="flex items-center justify-between">
          <TooltipFixed
            side="right"
            sideOffset={15}
            content={
              <div>
                <p className="font-medium">{isCustom ? t('customMenu') : t('standardMenu')}</p>
                <p className="text-xs opacity-90 mt-1">
                  {isCustom ? t('customPreferencesApplied') : t('standardAdminMenu')}
                </p>
                <p className="text-xs opacity-75 mt-1">{t('clickToSwitch')}</p>
              </div>
            }
          >
            <button
              type="button"
              className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-muted/50 to-accent/20 backdrop-blur-sm border border-border/40 hover:from-accent/20 hover:to-accent/30 transition-all duration-300 cursor-pointer group flex-1"
              onClick={onToggleMode}
              aria-label={isCustom ? t('switchToStandardMenu') : t('switchToCustomMenu')}
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    'w-3 h-6 rounded-full transition-all duration-300 relative flex-shrink-0',
                    isCustom ? 'bg-gradient-to-b from-purple-400 to-pink-500' : 'bg-muted'
                  )}
                >
                  <div
                    className={cn(
                      'w-2 h-2 bg-white rounded-full shadow-sm transition-all duration-300 absolute left-0.5',
                      isCustom ? 'translate-y-3' : 'translate-y-0.5'
                    )}
                  />
                </div>
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-md transition-all duration-300 flex-shrink-0',
                    isCustom
                      ? 'bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-md group-hover:shadow-purple-500/25 group-hover:scale-110'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md group-hover:shadow-blue-500/25 group-hover:scale-110'
                  )}
                >
                  {isCustom ? <Palette className="h-3 w-3" /> : <ListChecks className="h-3 w-3" />}
                </div>
                <span className="text-xs font-medium text-foreground flex-1 text-left">
                  {isCustom ? t('customMenu') : t('standardMenu')}
                </span>
              </div>
            </button>
          </TooltipFixed>

          {/* Bouton de personnalisation sur la même ligne */}
          {isCustom && (
            <TooltipFixed
              side="right"
              sideOffset={15}
              triggerAsChild={true}
              content={
                <div>
                  <p className="font-medium">{t('customizeMenu')}</p>
                  <p className="text-xs opacity-90 mt-1">{t('openCustomizationDashboard')}</p>
                </div>
              }
            >
              <button
                type="button"
                onClick={() => router?.push('/settings/menu')}
                className="inline-flex items-center justify-center w-10 h-8 p-0 ml-0.5 bg-gradient-to-br from-accent/10 to-accent/20 hover:from-accent/20 hover:to-accent/30 border border-accent/20 hover:border-accent/30 transition-all duration-300 flex-shrink-0 rounded-md text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                <Settings2 className="h-3 w-3" />
              </button>
            </TooltipFixed>
          )}
        </div>
      )}
    </div>
  )
}
