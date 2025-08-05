'use client'

import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'

interface TenantContextType {
  tenant: string | null
  setTenant: (tenant: string) => void
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  setTenant: () => {},
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Extraire le tenant depuis l'URL
    const pathSegments = pathname.split('/').filter(Boolean)
    if (pathSegments.length > 0 && pathSegments[0] !== 'storefront') {
      const currentTenant = pathSegments[0]
      setTenantState(currentTenant)
      apiClient.setTenant(currentTenant)
    }
  }, [pathname])

  const setTenant = (newTenant: string) => {
    setTenantState(newTenant)
    apiClient.setTenant(newTenant)
  }

  return <TenantContext.Provider value={{ tenant, setTenant }}>{children}</TenantContext.Provider>
}

export const useTenantContext = () => {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error('useTenantContext must be used within TenantProvider')
  }
  return context
}
