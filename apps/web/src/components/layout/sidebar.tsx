'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  ArrowUpDown,
  Award,
  BarChart3,
  Building2,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Database,
  Factory,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Package,
  Settings,
  Shield,
  Target,
  TrendingUp,
  Truck,
  User,
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
  gradient?: string
}

const navigation: NavItem[] = [
  {
    title: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    gradient: 'from-blue-500 to-purple-600'
  },
  {
    title: 'Projets',
    icon: FolderOpen,
    gradient: 'from-emerald-500 to-teal-600',
    children: [
      { title: 'Tous les projets', href: '/projets', icon: FolderOpen },
      { title: 'Nouveau projet', href: '/projets/nouveau', icon: Target },
      { title: 'En cours', href: '/projets/en-cours', icon: TrendingUp, badge: '12' },
      { title: 'Terminés', href: '/projets/termines', icon: Award },
    ],
  },
  {
    title: 'Clients',
    href: '/clients',
    icon: Users,
    badge: '247',
    gradient: 'from-indigo-500 to-blue-600',
  },
  {
    title: 'Chiffrage & Devis',
    icon: Calculator,
    gradient: 'from-orange-500 to-red-500',
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
    gradient: 'from-purple-500 to-pink-600',
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
    gradient: 'from-cyan-500 to-blue-500',
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
    gradient: 'from-green-500 to-emerald-600',
    children: [
      { title: 'Factures', href: '/comptabilite/factures', icon: FileText },
      { title: 'Paiements', href: '/comptabilite/paiements', icon: CreditCard },
      { title: 'Rapports', href: '/comptabilite/rapports', icon: BarChart3 },
    ],
  },
  {
    title: 'Administration',
    icon: Settings,
    gradient: 'from-slate-500 to-slate-700',
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

  const isActive = (href?: string) => {
    if (!href) return false
    if (href === '/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true
    return item.children?.some(child => isActive(child.href)) || false
  }

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const itemIsActive = isActive(item.href)
    const parentIsActive = isParentActive(item)

    const handleClick = () => {
      if (hasChildren) {
        toggleExpanded(item.title)
      } else if (item.href) {
        router.push(item.href)
      }
    }

    return (
      <div key={item.title} className="space-y-1">
        <div
          onClick={handleClick}
          className={cn(
            "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200",
            level === 0 && "mx-1",
            level === 1 && "ml-4 mr-1",
            itemIsActive || parentIsActive
              ? "bg-white/80 text-slate-900 shadow-lg backdrop-blur-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50",
            isCollapsed && "justify-center"
          )}
        >
          {/* Indicateur actif moderne */}
          {(itemIsActive || parentIsActive) && (
            <div className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b",
              item.gradient || "from-blue-500 to-purple-600"
            )} />
          )}

          {/* Icône avec gradient */}
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
            itemIsActive || parentIsActive
              ? `bg-gradient-to-br ${item.gradient || "from-blue-500 to-purple-600"} text-white shadow-lg`
              : "text-slate-500 group-hover:text-slate-700"
          )}>
            <item.icon className="h-4 w-4" />
          </div>

          {!isCollapsed && (
            <>
              <span className="flex-1 truncate">{item.title}</span>
              
              {/* Badge moderne */}
              {item.badge && (
                <Badge className="h-5 px-2 text-xs font-semibold text-white border-0 shadow-sm bg-gradient-to-r from-blue-500 to-purple-600">
                  {item.badge}
                </Badge>
              )}

              {/* Chevron pour les éléments avec enfants */}
              {hasChildren && (
                <div className="text-slate-400 group-hover:text-slate-600 transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Sous-menu avec animation */}
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
            {item.children?.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-white/60 backdrop-blur-md border-r border-slate-200/60 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      
      {/* Header simplifié - SANS DOUBLON */}
      <div className="p-4 border-b border-slate-200/60">
        <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white">
                <LayoutDashboard className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Navigation</p>
                <p className="text-xs text-slate-500">Modules ERP</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 text-white">
              <LayoutDashboard className="h-4 w-4" />
            </div>
          )}
          
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0 hover:bg-slate-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navigation.map(item => renderNavItem(item))}
      </nav>

      <Separator className="bg-slate-200/60" />

      {/* Footer utilisateur simplifié */}
      <div className="p-4">
        <div className={cn(
          "flex items-center rounded-xl bg-gradient-to-r from-slate-50 to-blue-50/50 p-3 border border-slate-200/60",
          isCollapsed && "justify-center"
        )}>
          <div className="relative">
            <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              <User className="h-4 w-4" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          {!isCollapsed && (
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-slate-800 leading-none">Connecté</p>
              <p className="text-xs text-slate-500 mt-1">ERP Actif</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}