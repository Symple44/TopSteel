'use client'

import { CompanyLogo } from '@erp/ui/business'
import { useCompanyInfo } from '@/hooks/use-company-info'

interface CompanyLogoWrapperProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showCompanyName?: boolean
  fallback?: React.ReactNode
  fallbackIcon?: boolean
}

export function CompanyLogoWrapper(props: CompanyLogoWrapperProps) {
  const { companyInfo, loading } = useCompanyInfo()

  return (
    <CompanyLogo
      size={props.size}
      className={props.className}
      showName={props.showCompanyName}
      fallbackIcon={props.fallbackIcon}
      companyInfo={companyInfo || undefined}
      loading={loading}
    />
  )
}

export default CompanyLogoWrapper
