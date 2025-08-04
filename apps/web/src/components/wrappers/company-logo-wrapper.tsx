'use client'

import { CompanyLogo, type CompanyLogoProps } from '@erp/ui/business'
import { useCompanyInfo } from '@/hooks/use-company-info'

interface CompanyLogoWrapperProps extends Omit<CompanyLogoProps, 'companyInfo' | 'loading'> {
  // Override props that we'll handle internally
}

export function CompanyLogoWrapper(props: CompanyLogoWrapperProps) {
  const { companyInfo, loading } = useCompanyInfo()

  return <CompanyLogo {...props} companyInfo={companyInfo} loading={loading} />
}

export default CompanyLogoWrapper
