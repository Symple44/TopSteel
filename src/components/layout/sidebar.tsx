'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderOpen, 
  Factory, 
  Package, 
  Calculator,
  Users,
  FileText,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Wrench,
  Truck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'projets',
    label: 'Projets',
    icon: FolderOpen,
    href: '/projets',
  },
  {
    id: 'production',
    label: 'Production',
    icon: Factory,
    href: '/production',
    badge: '3',
  },
  {
    id: 'stocks',
    label: 'Stocks',
    icon: Package,
    href: '/stocks',
    badge: '!',
    badgeColor: 'bg-red-500',
  },
  {
    id: 'chiffrage',
    label: 'Chiffrage',
    icon: Calculator,
    href: '/chiffrage',
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: Users,
    href: '/clients',
  },
  {
    id: 'fournisseurs',
    label: 'Fournisseurs',
    icon: Truck,
    href: '/fournisseurs',
  },
  {
    id: 'devis',
    label: 'Devis',
    icon: FileText,
    href: '/devis',
  },
  {
    id: 'rapports',
    label: 'Rapports',
    icon: BarChart3,
    href: '/rapports',
  },
]

const bottomMenuItems = [
  {
    id: 'outils',
    label: 'Outils',
    icon: Wrench,
    href: '/outils',
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    icon: Settings,
    href: '/parametres',
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const isSidebarOpen = useStore((state) => state.isSidebarOpen)
  const toggleSidebar = useStore((state) => state.toggleSidebar)

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-gray-900 text-white transition-all duration-300',
          isSidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo et toggle */}
          <div className="flex h-16 items-center justify-between px-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-6 w-6 text-primary-foreground" />
              </div>
              {isSidebarOpen && (
                <span className="text-xl font-bold">ERP Métallerie</span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {isSidebarOpen ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Menu principal */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon

              if (!isSidebarOpen) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex h-10 w-12 items-center justify-center rounded-lg transition-colors relative',
                          isActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.badge && (
                          <span
                            className={cn(
                              'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white',
                              item.badgeColor || 'bg-blue-500'
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-xs font-bold text-white',
                        item.badgeColor || 'bg-blue-500'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Menu du bas */}
          <div className="border-t border-gray-800 p-2">
            {bottomMenuItems.map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon

              if (!isSidebarOpen) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex h-10 w-12 items-center justify-center rounded-lg transition-colors',
                          isActive
                            ? 'bg-gray-800 text-white'
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}