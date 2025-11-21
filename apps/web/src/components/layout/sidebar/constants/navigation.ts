// apps/web/src/components/layout/sidebar/constants/navigation.ts
import {
  Briefcase,
  Building2,
  CreditCard,
  Factory,
  FileText,
  FolderKanban,
  HardDrive,
  Home,
  Languages,
  ListChecks,
  Monitor,
  Package,
  Search,
  Shield,
  Table,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { NavItem } from '../types'

/**
 * Génère la navigation statique par défaut
 * @param t - Fonction de traduction
 * @returns Liste des éléments de navigation
 */
export const getNavigation = (t: (key: string) => string): NavItem[] => [
  {
    title: t('dashboard'),
    href: '/dashboard',
    icon: Home,
    gradient: 'from-blue-500 to-purple-600',
  },
  {
    title: 'Partenaires',
    icon: Users,
    gradient: 'from-violet-500 to-purple-600',
    children: [
      {
        title: 'Tous les partenaires',
        href: '/partners',
        icon: Users,
      },
      {
        title: 'Clients',
        href: '/partners/clients',
        icon: Briefcase,
      },
      {
        title: 'Fournisseurs',
        href: '/partners/suppliers',
        icon: Building2,
      },
    ],
  },
  {
    title: 'Inventaire',
    icon: Package,
    gradient: 'from-orange-500 to-red-600',
    children: [
      {
        title: 'Matériaux',
        href: '/inventory/materials',
        icon: Factory,
      },
      {
        title: 'Articles',
        href: '/inventory/articles',
        icon: Package,
      },
      {
        title: 'Stock',
        href: '/inventory/stock',
        icon: HardDrive,
      },
    ],
  },
  {
    title: 'Ventes',
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600',
    children: [
      {
        title: 'Devis',
        href: '/sales/quotes',
        icon: FileText,
      },
      {
        title: 'Commandes',
        href: '/sales/orders',
        icon: ListChecks,
      },
    ],
  },
  {
    title: 'Finance',
    href: '/finance/invoices',
    icon: CreditCard,
    gradient: 'from-yellow-500 to-orange-600',
  },
  {
    title: 'Projets',
    href: '/projects',
    icon: FolderKanban,
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    title: t('queryBuilder'),
    href: '/query-builder',
    icon: Search,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: t('configuration'),
    href: '/admin',
    icon: Shield,
    gradient: 'from-red-500 to-pink-600',
    roles: ['ADMIN'],
    children: [
      {
        title: t('sessionsManagement'),
        href: '/admin/sessions',
        icon: Monitor,
        gradient: 'from-cyan-500 to-teal-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('translationsManagement'),
        href: '/admin/translations',
        icon: Languages,
        gradient: 'from-emerald-500 to-green-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('dataTableTest'),
        href: '/admin/datatable-test',
        icon: Table,
        gradient: 'from-violet-500 to-purple-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: 'Gestion des Sociétés',
        href: '/admin/societes',
        icon: Building2,
        gradient: 'from-blue-500 to-indigo-600',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
]
