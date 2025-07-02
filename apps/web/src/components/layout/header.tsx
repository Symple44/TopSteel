// apps/web/src/components/layout/header.tsx - VERSION AMÉLIORÉE
'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  Bell,
  CheckCircle,
  FolderOpen,
  HelpCircle,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  User,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface HeaderProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
}

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
}

// Données de démonstration
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Projet terminé',
    description: 'Le projet "Hangar Industrial A" a été marqué comme terminé',
    timestamp: '2 min',
    icon: CheckCircle
  },
  {
    id: '2',
    type: 'warning',
    title: 'Stock faible',
    description: 'Profilé IPE 200 : seulement 5 unités restantes',
    timestamp: '15 min',
    icon: Package
  },
  {
    id: '3',
    type: 'info',
    title: 'Nouveau devis',
    description: 'Devis DEV-2024-156 en attente de validation',
    timestamp: '1h',
    icon: FolderOpen
  }
]

export function Header({ onToggleSidebar, isSidebarCollapsed = false }: HeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Fermer les dropdowns au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-100 text-emerald-600'
      case 'warning': return 'bg-amber-100 text-amber-600'
      case 'error': return 'bg-red-100 text-red-600'
      case 'info': return 'bg-blue-100 text-blue-600'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    setShowUserMenu(false)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      router.push('/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        
        {/* Section gauche : Boutons toggle + Logo */}
        <div className="flex items-center space-x-4">
          {/* Boutons de toggle sidebar */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-slate-100"
              onClick={onToggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Desktop toggle button */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex hover:bg-slate-100"
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Logo principal TopSteel */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm shadow-lg">
                TS
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                <Zap className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                TopSteel
              </h1>
              <p className="text-xs text-slate-500 -mt-1">ERP Métallurgie</p>
            </div>
          </div>
        </div>

        {/* Section centre : Barre de recherche positionnée absolument */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Rechercher projets, clients, commandes, stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-11 text-base bg-white/70 border-slate-200/60 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-xl"
            />
          </form>
        </div>

        {/* Section droite : Actions - maintenant complètement à droite */}
        <div className="flex items-center space-x-3">
          {/* Aide */}
          <Button
            variant="ghost"
            size="sm"
            className="h-10 w-10 rounded-full hover:bg-slate-100"
            title="Aide et support"
          >
            <HelpCircle className="h-5 w-5 text-slate-600" />
          </Button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              size="sm"
              className="relative h-10 w-10 rounded-full hover:bg-slate-100"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {mockNotifications.length > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 hover:bg-red-500">
                  {mockNotifications.length}
                </Badge>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <p className="text-sm text-slate-500">{mockNotifications.length} nouvelles</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div key={notification.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          getNotificationBadgeColor(notification.type)
                        )}>
                          <notification.icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{notification.title}</p>
                          <p className="text-sm text-slate-600 mt-1">{notification.description}</p>
                          <p className="text-xs text-slate-400 mt-2">{notification.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-slate-200">
                  <Button variant="ghost" size="sm" className="w-full text-blue-600 hover:text-blue-700">
                    Voir toutes les notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Menu utilisateur avec effet hover */}
          <div className="relative" ref={userMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 rounded-full hover:bg-slate-100 transition-all duration-200 group"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar className="h-8 w-8 transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-bold transition-all duration-200 group-hover:from-blue-600 group-hover:to-purple-700 group-hover:shadow-inner">
                  AD
                </AvatarFallback>
              </Avatar>
            </Button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-200">
                  <p className="font-semibold text-slate-900">Admin User</p>
                  <p className="text-sm text-slate-500">admin@topsteel.com</p>
                </div>
                <div className="p-2">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-slate-700 hover:bg-slate-100">
                    <User className="h-4 w-4 mr-3" />
                    Mon profil
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-slate-700 hover:bg-slate-100">
                    <Settings className="h-4 w-4 mr-3" />
                    Paramètres
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-slate-700 hover:bg-slate-100">
                    <MessageSquare className="h-4 w-4 mr-3" />
                    Support
                  </Button>
                  <div className="border-t border-slate-200 my-2" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}