'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'
import {
    AlertCircle,
    BarChart3,
    Building2,
    Calculator,
    ChevronDown,
    ChevronRight,
    CreditCard,
    Database,
    Factory,
    FileText,
    FolderOpen,
    LayoutDashboard,
    Package,
    Settings,
    Shield,
    Truck,
    Users
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

interface NavItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  children?: NavItem[]
  roles?: string[]
}

const navigation: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Projets',
    icon: FolderOpen,
    children: [
      { title: 'Tous les projets', href: '/projets', icon: FolderOpen },
      { title: 'Nouveau projet', href: '/projets/nouveau', icon: FolderOpen },
      { title: 'En cours', href: '/projets/en-cours', icon: FolderOpen, badge: '12' },
      { title: 'Terminés', href: '/projets/termines', icon: FolderOpen },
    ],
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Users,
    badge: '247',
  },
  {
    title: 'Chiffrage & Devis',
    icon: Calculator,
    children: [
      { title: 'Nouveau chiffrage', href: '/chiffrage', icon: Calculator },
      { title: 'Devis en cours', href: '/devis/en-cours', icon: FileText, badge: '8' },
      { title: 'Templates', href: '/chiffrage/templates', icon: FileText },
      { title: 'Historique', href: '/chiffrage/historique', icon: FileText },
    ],
  },
  {
    title: 'Production',
    icon: Factory,
    children: [
      { title: 'Ordres de fabrication', href: '/production', icon: Factory, badge: '5' },
      { title: 'Planning', href: '/production/planning', icon: Factory },
      { title: 'Contrôle qualité', href: '/production/qualite', icon: Shield },
      { title: 'Maintenance', href: '/production/maintenance', icon: Settings },
    ],
  },
  {
    title: 'Stock & Achats',
    icon: Package,
    children: [
      { title: 'Gestion des stocks', href: '/stock', icon: Package },
      { title: 'Commandes', href: '/achats/commandes', icon: Truck },
      { title: 'Fournisseurs', href: '/achats/fournisseurs', icon: Building2 },
      { title: 'Réceptions', href: '/achats/receptions', icon: Package },
      { title: 'Inventaires', href: '/stock/inventaires', icon: Database },
    ],
  },
  {
    title: 'Facturation',
    icon: CreditCard,
    children: [
      { title: 'Factures', href: '/facturation', icon: CreditCard },
      { title: 'Avoirs', href: '/facturation/avoirs', icon: CreditCard },
      { title: 'Relances', href: '/facturation/relances', icon: AlertCircle, badge: '3' },
      { title: 'Encaissements', href: '/facturation/encaissements', icon: CreditCard },
    ],
  },
  {
    title: 'Rapports',
    icon: BarChart3,
    children: [
      { title: 'Chiffre d\'affaires', href: '/rapports/ca', icon: BarChart3 },
      { title: 'Rentabilité', href: '/rapports/rentabilite', icon: BarChart3 },
      { title: 'Production', href: '/rapports/production', icon: BarChart3 },
      { title: 'Stocks', href: '/rapports/stocks', icon: BarChart3 },
    ],
  },
]

const adminNavigation: NavItem[] = [
  {
    title: 'Administration',
    icon: Settings,
    children: [
      { title: 'Utilisateurs', href: '/admin/users', icon: Users },
      { title: 'Paramètres', href: '/admin/settings', icon: Settings },
      { title: 'Sauvegardes', href: '/admin/backups', icon: Database },
      { title: 'Logs', href: '/admin/logs', icon: FileText },
    ],
  },
]

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Projets'])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isItemActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  const isGroupActive = (children?: NavItem[]) => {
    if (!children) return false
    return children.some(child => isItemActive(child.href))
  }

  const SidebarNavItem = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const isActive = isItemActive(item.href)
    const isGroupActiveState = isGroupActive(item.children)

    const handleClick = () => {
      if (hasChildren) {
        toggleExpanded(item.title)
      } else if (item.href) {
        router.push(item.href)
      }
    }

    const content = (
      <div className="w-full">
        <Button
          variant={isActive ? 'secondary' : 'ghost'}
          className={cn(
            'w-full justify-start h-9',
            level > 0 && 'ml-4 w-[calc(100%-1rem)]',
            isActive && 'bg-secondary font-medium',
            isGroupActiveState && !isActive && 'bg-secondary/50'
          )}
          onClick={handleClick}
        >
          <item.icon className={cn('h-4 w-4', isCollapsed ? 'mr-0' : 'mr-2')} />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                isExpanded ? (
                  <ChevronDown className="h-3 w-3 ml-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 ml-1" />
                )
              )}
            </>
          )}
        </Button>
      </div>
    )

    if (isCollapsed && hasChildren) {
      return (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              {content}
            </TooltipTrigger>
            <TooltipContent side="right" className="p-2">
              <div className="font-medium">{item.title}</div>
              {item.children?.map((child) => (
                <Button
                  key={child.title}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-8"
                  onClick={() => child.href && router.push(child.href)}
                >
                  <child.icon className="h-3 w-3 mr-2" />
                  {child.title}
                  {child.badge && (
                    <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                      {child.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return (
      <div>
        {content}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map((child) => (
              <SidebarNavItem key={child.title} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-r transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
              TS
            </div>
            <div>
              <h2 className="text-lg font-semibold">TopSteel</h2>
              <p className="text-xs text-muted-foreground">ERP Métallurgie</p>
            </div>
          </div>
        )}
        {onToggle && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
            <ChevronRight className={cn('h-4 w-4 transition-transform', !isCollapsed && 'rotate-180')} />
          </Button>
        )}
      </div>

      <Separator />

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {navigation.map((item) => (
            <SidebarNavItem key={item.title} item={item} />
          ))}
        </div>

        <Separator className="my-4" />

        {/* Admin section */}
        <div className="space-y-1">
          {adminNavigation.map((item) => (
            <SidebarNavItem key={item.title} item={item} />
          ))}
        </div>
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="flex h-2 w-2 rounded-full bg-green-500" />
            <span>Système opérationnel</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Version 1.0.0
          </div>
        </div>
      )}
    </div>
  )
}