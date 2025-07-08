'use client'

import { Bell, PanelLeftClose, PanelLeftOpen, Search, Zap } from 'lucide-react'
import { useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

interface HeaderProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
}

export function Header({ onToggleSidebar, isSidebarCollapsed = false }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Section gauche */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </Button>

          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold">TopSteel</h1>
              <p className="text-xs text-muted-foreground">Système ERP</p>
            </div>
          </div>
        </div>

        {/* Section centre */}
        <div className="flex-1 max-w-md mx-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery((e.target as HTMLInputElement | HTMLTextAreaElement).value)
              }
              className="pl-10"
            />
          </div>
        </div>

        {/* Section droite */}
        <div className="flex items-center space-x-2">
          <ThemeSwitcher />

          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
              2
            </span>
          </Button>

          <Button variant="ghost" size="sm" className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="hidden md:block text-sm">User</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
