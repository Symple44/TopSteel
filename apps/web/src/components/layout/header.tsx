'use client'

import { Button } from '@erp/ui'
import { Building, Building2, ChevronDown, LogOut, Search, Settings, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import SyncIndicator from '@/components/auth/sync-indicator'
import { NotificationCenter } from '@/components/notifications/notification-center'
import { CommandPalette } from '@/components/search/command-palette'
import { useAuth } from '@/hooks/use-auth'
import { useTranslation } from '@/lib/i18n'
import { getApproximateTabCount } from '@/lib/tab-detection'

interface HeaderProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onShowCompanySelector?: () => void
}

export function Header({
  _onToggleSidebar,
  _isSidebarCollapsed = false,
  onShowCompanySelector,
}: HeaderProps) {
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [tabCount, setTabCount] = useState(1)
  const { user, logout, company } = useAuth()
  const { t } = useTranslation('common')
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Mettre à jour le nombre d'onglets périodiquement
  useEffect(() => {
    const updateTabCount = () => {
      const count = getApproximateTabCount()
      setTabCount(count)
    }

    // Mise à jour initiale
    updateTabCount()

    // Mise à jour toutes les 5 secondes
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Section gauche - Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-foreground">TopSteel</h1>
            <p className="text-xs text-muted-foreground">ERP Métallerie</p>
          </div>
        </div>

        {/* Section centre - Recherche */}
        <div className="flex-1 max-w-md mx-6">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="w-full flex items-center px-4 py-2 bg-muted border border-input rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all group"
          >
            <Search className="mr-3 h-4 w-4" />
            <span className="flex-1 text-left text-sm">{t('search')}...</span>
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Section droite - Actions utilisateur */}
        <div className="flex items-center space-x-2">
          {/* Indicateur de synchronisation */}
          <SyncIndicator />

          {/* Sélecteur de société */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShowCompanySelector?.()}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              title={
                company
                  ? tabCount > 1
                    ? t('companies.changeAffects', { count: tabCount })
                    : t('companies.changeCompany')
                  : t('companies.select')
              }
            >
              <Building className="h-4 w-4" />
              <span className="text-sm font-medium">
                {company ? company.code : t('companies.select')}
              </span>
              {tabCount > 1 && (
                <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">
                  {tabCount}
                </span>
              )}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>

          {/* Notifications */}
          <NotificationCenter />

          {/* Menu utilisateur */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user?.nom?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.prenom && user?.nom
                  ? `${user.prenom} ${user.nom}`.trim()
                  : user?.nom || user?.email?.split('@')[0] || t('user')}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {/* Menu déroulant */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-card rounded-lg shadow-lg border border-border py-1 z-50">
                {/* Info utilisateur */}
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {user?.prenom && user?.nom
                      ? `${user.prenom} ${user.nom}`.trim()
                      : user?.nom || user?.email?.split('@')[0] || t('user')}
                  </p>
                  <p className="text-sm text-muted-foreground">{user?.email || t('email')}</p>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      router.push('/profile')
                      setShowUserMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4 mr-3" />
                    {t('profile')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      router.push('/settings')
                      setShowUserMenu(false)
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    {t('settings')}
                  </button>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {t('logout')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette (Modal de recherche) */}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} />
    </header>
  )
}
