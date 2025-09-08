'use client'

import { useCompanyInfo } from '@/hooks/use-company-info'

interface CompanyLogoWrapperProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showCompanyName?: boolean
  fallback?: React.ReactNode
  fallbackIcon?: boolean
}

export function CompanyLogoWrapper(props: CompanyLogoWrapperProps) {
  const { companyInfo } = useCompanyInfo()

  return (
    <div className={`flex items-center gap-2 ${props.className || ''}`}>
      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
        {props.fallbackIcon ? '🏢' : companyInfo?.name?.[0] || 'C'}
      </div>
      {props.showCompanyName && (
        <span className="font-semibold">{companyInfo?.name || 'Company'}</span>
      )}
    </div>
  )
}

export default CompanyLogoWrapper
