// apps/web/src/components/layout/sidebar/constants/navigation.ts
import {
  Bell,
  Building2,
  Database,
  Home,
  Languages,
  Lock,
  Menu,
  Monitor,
  Palette,
  Search,
  Settings,
  Shield,
  Table,
  UserCog,
  Users,
  UsersRound,
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
    title: t('queryBuilder'),
    href: '/query-builder',
    icon: Search,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: t('settings'),
    icon: Settings,
    gradient: 'from-slate-500 to-gray-600',
    children: [
      {
        title: t('appearance'),
        href: '/settings/appearance',
        icon: Palette,
        gradient: 'from-indigo-500 to-purple-600',
      },
      {
        title: t('notifications'),
        href: '/settings/notifications',
        icon: Bell,
        gradient: 'from-amber-500 to-orange-600',
      },
      {
        title: t('security'),
        href: '/settings/security',
        icon: Lock,
        gradient: 'from-red-500 to-rose-600',
      },
      {
        title: t('menuCustomization'),
        href: '/settings/menu',
        icon: Menu,
        gradient: 'from-purple-500 to-pink-600',
      },
    ],
  },
  {
    title: t('configuration'),
    href: '/admin',
    icon: Shield,
    gradient: 'from-red-500 to-pink-600',
    roles: ['SUPER_ADMIN', 'ADMIN'],
    children: [
      {
        title: t('companySettings'),
        href: '/admin/company',
        icon: Building2,
        gradient: 'from-blue-500 to-indigo-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('usersManagement'),
        href: '/admin/users',
        icon: Users,
        gradient: 'from-violet-500 to-purple-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('rolesManagement'),
        href: '/admin/roles',
        icon: UserCog,
        gradient: 'from-orange-500 to-red-600',
        roles: ['SUPER_ADMIN'],
      },
      {
        title: t('groupsManagement'),
        href: '/admin/groups',
        icon: UsersRound,
        gradient: 'from-teal-500 to-cyan-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('societesManagement'),
        href: '/admin/societes',
        icon: Building2,
        gradient: 'from-blue-500 to-indigo-600',
        roles: ['SUPER_ADMIN'],
      },
      {
        title: t('sessionsManagement'),
        href: '/admin/sessions',
        icon: Monitor,
        gradient: 'from-cyan-500 to-teal-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('databaseManagement'),
        href: '/admin/database',
        icon: Database,
        gradient: 'from-emerald-500 to-green-600',
        roles: ['SUPER_ADMIN'],
      },
      {
        title: t('menuConfiguration'),
        href: '/admin/menu-config',
        icon: Menu,
        gradient: 'from-purple-500 to-pink-600',
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
        title: t('adminSettings'),
        href: '/admin/admin',
        icon: Settings,
        gradient: 'from-slate-500 to-gray-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        title: t('dataTableTest'),
        href: '/admin/datatable-test',
        icon: Table,
        gradient: 'from-violet-500 to-purple-600',
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
    ],
  },
]
