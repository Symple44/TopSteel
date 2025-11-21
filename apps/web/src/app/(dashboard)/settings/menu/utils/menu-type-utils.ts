import type React from 'react'
import { BarChart3, ExternalLink, FolderOpen, LayoutDashboard, Settings } from 'lucide-react'
import type { TranslationFunction } from '../../../../../lib/i18n/types'

export const getTypeLabel = (type: string, t: TranslationFunction) => {
  switch (type) {
    case 'M':
      return t('menu.elementTypes.folder')
    case 'P':
      return t('menu.elementTypes.program')
    case 'L':
      return t('menu.elementTypes.link')
    case 'D':
      return t('menu.elementTypes.dataView')
    default:
      return type
  }
}

export const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'M':
      return 'bg-blue-500'
    case 'P':
      return 'bg-green-500'
    case 'L':
      return 'bg-purple-500'
    case 'D':
      return 'bg-orange-500'
    default:
      return 'bg-gray-500'
  }
}

export const getTypeIcon = (
  type: string
): React.ComponentType<{ className?: string; style?: React.CSSProperties }> => {
  switch (type) {
    case 'M':
      return FolderOpen
    case 'P':
      return LayoutDashboard
    case 'L':
      return ExternalLink
    case 'D':
      return BarChart3
    default:
      return Settings
  }
}
