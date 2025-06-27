'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
, Calendar, Clock, ArrowUpDown} from 'lucide-react'
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
      { title: 'Ordres de fabrication', href: '/production/ordres', icon: Factory },
      { title: 'Planning', href: '/production/planning', icon: Calendar },
      { title: 'Suivi temps', href: '/production/temps', icon: Clock },
      { title: 'Rapports', href: '/production/rapports', icon: FileText },
    ],
  },
  {
    title: 'Stock & Achats',
    icon: Package,
    children: [
      { title: 'Stock', href: '/stock', icon: Package },
      { title: 'Mouvements', href: '/stock/mouvements', icon: ArrowUpDown },
      { title: 'Commandes', href: '/achats/commandes', icon: Truck },
      { title: 'Fournisseurs', href: '/achats/fournisseurs', icon: Building2 },
    ],
  },
  {
    title: 'Comptabilité',
    icon: CreditCard,
    children: [
      { title: 'Factures', href: '/comptabilite/factures', icon: FileText },
      { title: 'Paiements', href: '/comptabilite/paiements', icon: CreditCard },
      { title: 'Rapports', href: '/comptabilite/rapports', icon: BarChart3 },
    ],
  },
  {
    title: 'Administration',
    icon: Settings,
    children: [
      { title: 'Utilisateurs', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
      { title: 'Paramètres', href: '/admin/settings', icon: Settings, roles: ['ADMIN'] },
      { title: 'Sécurité', href: '/admin/security', icon: Shield, roles: ['ADMIN'] },
      { title: 'Base de données', href: '/admin/database', icon: Database, roles: ['ADMIN'] },
    ],
  },
]

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>(['projets'])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const Icon = item.icon
    const isExpanded = expandedItems.includes(item.title.toLowerCase())
    const isActive = item.href ? pathname === item.href : false
    const hasChildren = item.children && item.children.length > 0

    return (
      <div key={item.title}>
        <div
          className={cn(
            "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg cursor-pointer transition-colors",
            level > 0 && "ml-4",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.title.toLowerCase())
            } else if (item.href) {
              router.push(item.href)
            }
          }}
        >
          <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5" />
            {!isCollapsed && (
              <>
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </div>
          {!isCollapsed && hasChildren && (
            isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          )}
        </div>

        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col h-full bg-background border-r", isCollapsed && "w-16")}>
      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">TS</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-lg">TopSteel</h1>
              <p className="text-xs text-muted-foreground">ERP Métallurgie</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map(item => renderNavItem(item))}
      </nav>

      <Separator />

      <div className="p-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-muted rounded-full"></div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">Administrateur</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

