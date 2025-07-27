'use client'

import { createContext, useContext, ReactNode } from 'react'
import { apiClientEnhanced } from './api-client-enhanced'
import type { APIClientEnhanced } from './api-client-enhanced'

const ApiClientContext = createContext<APIClientEnhanced | undefined>(undefined)

export function ApiClientProvider({ children }: { children: ReactNode }) {
  return (
    <ApiClientContext.Provider value={apiClientEnhanced}>
      {children}
    </ApiClientContext.Provider>
  )
}

export function useApiClient() {
  const client = useContext(ApiClientContext)
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider')
  }
  return client
}

// Export global pour compatibilité
export { apiClientEnhanced as apiClient }