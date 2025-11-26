'use client'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  SimpleTooltip,
} from '@erp/ui'
import {
  Building,
  Building2,
  ChevronDown,
  Keyboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import SyncIndicator from '../../components/auth/sync-indicator'
import { NotificationCenter } from '../../components/notifications/notification-center'
import { CommandPalette } from '../../components/search/command-palette'
import { useAuth } from '../../hooks/use-auth'
import { useTranslation } from '../../lib/i18n'
import { getApproximateTabCount } from '../../lib/tab-detection'

interface HeaderProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onShowCompanySelector?: () => void
}

export function Header({
  onToggleSidebar,
  isSidebarCollapsed = false,
  onShowCompanySelector,
}: HeaderProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [tabCount, setTabCount] = useState(1)
  const { user, logout, company } = useAuth()
  const { t } = useTranslation('common')
  const router = useRouter()

  // Mettre à jour le nombre d'onglets périodiquement
  useEffect(() => {
    const updateTabCount = () => {
      const count = getApproximateTabCount()
      setTabCount(count)
    }
    updateTabCount()
    const interval = setInterval(updateTabCount, 5000)
    return () => clearInterval(interval)
  }, [])

  // Raccourci clavier pour ouvrir la recherche (Ctrl+K ou Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommandPalette(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (_error) {}
  }

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        {/* Section gauche - Toggle sidebar + Logo */}
        <div className="flex items-center gap-3">
          {/* Sidebar toggle button */}
          {onToggleSidebar && (
            <SimpleTooltip content={`${isSidebarCollapsed ? 'Ouvrir' : 'Réduire'} la sidebar (${isMac ? '⌘' : 'Ctrl'}+B)`}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleSidebar}
                aria-label={isSidebarCollapsed ? 'Ouvrir la sidebar' : 'Réduire la sidebar'}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>
            </SimpleTooltip>
          )}

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground leading-none">TopSteel</h1>
              <p className="text-[10px] text-muted-foreground">ERP Métallerie</p>
            </div>
          </div>
        </div>

        {/* Section centre - Recherche */}
        <div className="flex-1 max-w-xl">
          <button
            type="button"
            onClick={() => setShowCommandPalette(true)}
            aria-label={t('search')}
            className="w-full flex items-center px-3 py-2 bg-muted/50 border border-input/50 rounded-lg text-muted-foreground hover:bg-muted hover:border-input transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search className="mr-2.5 h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
            <span className="flex-1 text-left text-sm">Rechercher...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              {isMac ? '⌘' : 'Ctrl'}+K
            </kbd>
          </button>
        </div>

        {/* Section droite - Actions */}
        <div className="flex items-center gap-1">
          {/* Indicateur de synchronisation */}
          <SyncIndicator />

          {/* Sélecteur de société */}
          <SimpleTooltip
            content={
              company
                ? tabCount > 1
                  ? `Changer de société (${tabCount} onglets affectés)`
                  : 'Changer de société'
                : 'Sélectionner une société'
            }
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onShowCompanySelector?.()}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-2.5"
            >
              <Building className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium max-w-[100px] truncate">
                {company ? company.code : 'Société'}
              </span>
              {tabCount > 1 && (
                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-semibold">
                  {tabCount}
                </span>
              )}
            </Button>
          </SimpleTooltip>

          {/* Notifications */}
          <NotificationCenter />

          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t('userMenu')}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground px-2"
              >
                <div className="h-7 w-7 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold text-sm">
                  {user?.nom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:block text-sm font-medium max-w-[120px] truncate">
                  {user?.prenom && user?.nom
                    ? `${user.prenom} ${user.nom}`.trim()
                    : user?.nom || user?.email?.split('@')[0] || t('user')}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              {/* Info utilisateur */}
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.prenom && user?.nom
                      ? `${user.prenom} ${user.nom}`.trim()
                      : user?.nom || user?.email?.split('@')[0] || t('user')}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || t('email')}
                  </p>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {/* Actions */}
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('profile')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('settings')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Raccourcis clavier */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal flex items-center gap-1.5">
                <Keyboard className="h-3.5 w-3.5" />
                Raccourcis
              </DropdownMenuLabel>
              <div className="px-2 py-1.5 text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Recherche</span>
                  <kbd className="font-mono bg-muted px-1 rounded">{isMac ? '⌘' : 'Ctrl'}+K</kbd>
                </div>
                <div className="flex justify-between">
                  <span>Sidebar</span>
                  <kbd className="font-mono bg-muted px-1 rounded">{isMac ? '⌘' : 'Ctrl'}+B</kbd>
                </div>
              </div>

              <DropdownMenuSeparator />

              {/* Déconnexion */}
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} />
    </header>
  )
}
