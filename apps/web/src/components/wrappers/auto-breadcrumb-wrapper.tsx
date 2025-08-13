'use client'

import { AutoBreadcrumb, type AutoBreadcrumbProps } from '@erp/ui/navigation'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/hooks'

interface AutoBreadcrumbWrapperProps
  extends Omit<AutoBreadcrumbProps, 'pathname' | 'translateSegment'> {
  // Override props that we'll handle internally
}

export function AutoBreadcrumbWrapper(props: AutoBreadcrumbWrapperProps) {
  const pathname = usePathname()
  const { t } = useTranslation('breadcrumb')

  const translateSegment = (segment: string) => {
    // Si c'est un UUID, ne pas afficher dans le breadcrumb
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(segment)) {
      return 'Détail'
    }
    
    // Utiliser la traduction ou fallback sur le segment formaté
    return t(segment) || segment.charAt(0).toUpperCase() + segment.slice(1)
  }

  return <AutoBreadcrumb {...props} pathname={pathname} translateSegment={translateSegment} />
}

export default AutoBreadcrumbWrapper
