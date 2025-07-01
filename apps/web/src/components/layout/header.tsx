// apps/web/src/components/layout/header.tsx - VERSION AVEC DROPDOWNS FONCTIONNELS
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
  Clock,
  Factory,
  FolderOpen,
  HelpCircle,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  User,
  X,
  Zap
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

interface HeaderProps {
  onToggleSidebar?: () => void
}

interface Notification {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  description: string
  timestamp: string
  icon: React.ComponentType<{ className?: string }>
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { user, logout } = useAuth()

  // Refs pour gérer les clics à l'extérieur
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Notifications simulées
  const notifications: Notification[] = [
    {
      id: '1',
      type: 'success',
      title: 'Nouveau projet créé',
      description: 'PRJ-2025-001 assigné à votre équipe',
      timestamp: 'Il y a 2 heures',
      icon: FolderOpen
    },
    {
      id: '2',
      type: 'warning',
      title: 'Stock faible',
      description: 'Profilé IPE 200 - Réapprovisionnement nécessaire',
      timestamp: 'Il y a 4 heures',
      icon: Package
    },
    {
      id: '3',
      type: 'info',
      title: 'Devis approuvé',
      description: 'DEV-2025-045 validé par Entreprise Dupont',
      timestamp: 'Il y a 6 heures',
      icon: CheckCircle
    },
    {
      id: '4',
      type: 'error',
      title: 'Ordre en retard',
      description: 'OF-2025-023 dépasse la date prévue',
      timestamp: 'Il y a 1 jour',
      icon: Factory
    }
  ]

  // Fermer les dropdowns au clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-100 text-emerald-600'
      case 'warning': return 'bg-orange-100 text-orange-600'
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
      <div className="container flex h-16 items-center">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          className="mr-2 md:hidden hover:bg-slate-100"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo principal TopSteel */}
        <div className="mr-6 flex items-center space-x-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm shadow-lg">
              TS
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
              <Zap className="h-2.5 w-2.5 text-white" />
            </div>
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              TopSteel
            </h1>
            <p className="text-xs text-slate-500 -mt-1">ERP Métallurgie</p>
          </div>
        </div>

        {/* Barre de recherche moderne */}
        <div className="flex flex-1 items-center space-x-2">
          <form onSubmit={handleSearch} className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="search"
              placeholder="Rechercher projets, clients, commandes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border-slate-200 bg-slate-50/50 backdrop-blur-sm focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </form>
        </div>

        {/* Actions de droite */}
        <div className="flex items-center space-x-2">
          
          {/* NOTIFICATIONS DROPDOWN MANUEL */}
          <div className="relative" ref={notificationsRef}>
            <Button 
              variant="ghost" 
              size="sm" 
              className="relative hover:bg-slate-100 group"
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
            >
              <Bell className="h-4 w-4 text-slate-600 group-hover:text-slate-800" />
              {notifications.length > 0 && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-white text-xs font-bold">{notifications.length}</span>
                </div>
              )}
            </Button>

            {/* Dropdown Notifications */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Notifications ({notifications.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNotifications(false)}
                      className="h-6 w-6 p-0 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => {
                    const IconComponent = notification.icon
                    return (
                      <div 
                        key={notification.id} 
                        className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      >
                        <div className="flex items-start space-x-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            getNotificationColor(notification.type)
                          )}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium text-slate-800 leading-tight">
                              {notification.title}
                            </p>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {notification.description}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {notification.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                <div className="p-4 border-t border-slate-200">
                  <Button variant="ghost" size="sm" className="w-full text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                    Voir toutes les notifications
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Messages */}
          <Button variant="ghost" size="sm" className="hover:bg-slate-100 group">
            <MessageSquare className="h-4 w-4 text-slate-600 group-hover:text-slate-800" />
          </Button>

          {/* Aide */}
          <Button variant="ghost" size="sm" className="hover:bg-slate-100 group">
            <HelpCircle className="h-4 w-4 text-slate-600 group-hover:text-slate-800" />
          </Button>

          {/* MENU UTILISATEUR DROPDOWN MANUEL */}
          <div className="relative" ref={userMenuRef}>
            <Button 
              variant="ghost" 
              className="relative h-10 w-10 rounded-full p-0 hover:bg-slate-100"
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
            >
              <Avatar className="h-10 w-10 border-2 border-white shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {user?.prenom?.charAt(0) || 'U'}
                  {user?.nom?.charAt(0) || 'S'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </Button>

            {/* Dropdown Menu Utilisateur */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {user?.prenom?.charAt(0) || 'U'}
                        {user?.nom?.charAt(0) || 'S'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900 leading-none">
                        {user?.prenom || 'Utilisateur'} {user?.nom || 'Test'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {user?.email || 'user@topsteel.fr'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                      En ligne
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Admin
                    </Badge>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push('/profile')
                    }}
                    className="flex items-center w-full p-3 text-left hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <User className="mr-3 h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">Mon profil</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push('/settings')
                    }}
                    className="flex items-center w-full p-3 text-left hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <Settings className="mr-3 h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">Paramètres</span>
                  </button>
                  
                  <hr className="my-2 border-slate-200" />
                  
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center w-full p-3 text-left text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}