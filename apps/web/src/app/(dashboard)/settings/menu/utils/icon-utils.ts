import type React from 'react'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle,
  CreditCard,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileText,
  FolderOpen,
  Globe,
  Home,
  Key,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Monitor,
  Package,
  Phone,
  PieChart,
  RefreshCw,
  Search,
  Settings,
  Shield,
  TrendingUp,
  Truck,
  Upload,
  User,
  Users,
  Wrench,
} from 'lucide-react'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

export const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  // Navigation & Structure
  Home,
  LayoutDashboard,
  FolderOpen,
  Settings,
  Search,
  Eye,

  // Administration & Sécurité
  Shield,
  Users,
  User,
  Key,
  Lock,

  // Entreprise & Organisation
  Building,
  Building2,
  Globe,
  Briefcase,

  // Données & Rapports
  Database,
  BarChart3,
  PieChart,
  Activity,
  TrendingUp,
  FileText,

  // Production & Stock
  Package,
  Wrench,
  Truck,

  // Communication & Documents
  Mail,
  Phone,
  Calendar,
  Bell,

  // Actions & États
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  RefreshCw,

  // Finance
  CreditCard,

  // Technique
  Monitor,
  ExternalLink,
  MapPin,
  Check,
}

export const getAvailableIcons = () => {
  return Object.keys(iconMap).sort()
}

export const getIconsByCategory = (t: TranslationFunction) => {
  return {
    [t('settings.menu.iconCategories.navigation')]: [
      'Home',
      'LayoutDashboard',
      'FolderOpen',
      'Settings',
      'Search',
      'Eye',
    ],
    [t('settings.menu.iconCategories.security')]: ['Shield', 'Users', 'User', 'Key', 'Lock'],
    [t('settings.menu.iconCategories.enterprise')]: [
      'Building',
      'Building2',
      'Globe',
      'Briefcase',
    ],
    [t('settings.menu.iconCategories.data')]: [
      'Database',
      'BarChart3',
      'PieChart',
      'Activity',
      'TrendingUp',
      'FileText',
    ],
    [t('settings.menu.iconCategories.production')]: ['Package', 'Wrench', 'Truck'],
    [t('settings.menu.iconCategories.communication')]: ['Mail', 'Phone', 'Calendar', 'Bell'],
    [t('settings.menu.iconCategories.actions')]: [
      'Download',
      'Upload',
      'CheckCircle',
      'AlertTriangle',
      'RefreshCw',
    ],
    [t('settings.menu.iconCategories.finance')]: [
      'CreditCard',
      'Monitor',
      'ExternalLink',
      'MapPin',
      'Check',
    ],
  }
}

export const getIconComponent = (
  iconName: string
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  return iconMap[iconName] || Settings
}
