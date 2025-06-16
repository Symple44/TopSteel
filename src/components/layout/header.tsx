'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Bell, 
  Search, 
  User, 
  LogOut, 
  Settings, 
  HelpCircle,
  Moon,
  Sun,
  Menu
} from 'lucide-react'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function Header() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const logout = useStore((state) => state.logout)
  const theme = useStore((state) => state.theme)
  const setTheme = useStore((state) => state.setTheme)
  const toggleSidebar = useStore((state) => state.toggleSidebar)
  const [searchQuery, setSearchQuery] = useState('')

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const notifications = [
    {
      id: 1,
      title: 'Nouveau devis accepté',
      description: 'Le devis PRJ-2025-0142 a été accepté par le client',
      time: 'Il y a 5 minutes',
      read: false,
    },
    {
      id: 2,
      title: 'Stock critique',
      description: 'Le stock de tubes carrés 40x40 est en dessous du seuil minimum',
      time: 'Il y a 1 heure',
      read: false,
    },
    {
      id: 3,
      title: 'Production terminée',
      description: "L'ordre de fabrication OF-2025-0089 est terminé",
      time: 'Il y a 2 heures',
      read: true,
    },
  ]

  const unreadCount = notifications.filter((n) => !n.read).length

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-white px-6 dark:bg-gray-800">
      <div className="flex flex-1 items-center space-x-4">
        {/* Bouton menu mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Barre de recherche */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Rechercher un projet, client, devis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Bouton thème */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Notifications</h3>
              <Button variant="ghost" size="sm">
                Tout marquer comme lu
              </Button>
            </div>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg p-3 transition-colors cursor-pointer ${
                    notification.read
                      ? 'bg-gray-50 dark:bg-gray-800'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">{notification.time}</p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" size="sm">
                Voir toutes les notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center space-x-3 px-3"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/api/avatar/${user?.id}`} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user ? getInitials(user.nom) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium">{user?.nom}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profil')}>
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/parametres')}>
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/aide')}>
              <HelpCircle className="mr-2 h-4 w-4" />
              Aide et support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}