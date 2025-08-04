'use client'

import { useParams } from 'next/navigation'
import { type ReactNode, createContext, useContext } from 'react'

interface ParamsContextType {
  params: Record<string, string | string[]>
}

const ParamsContext = createContext<ParamsContextType | null>(null)

export function ParamsWrapper({ children }: { children: ReactNode }) {
  const params = useParams()

  return <ParamsContext.Provider value={{ params }}>{children}</ParamsContext.Provider>
}

export function useParamsContext() {
  const context = useContext(ParamsContext)
  if (!context) {
    throw new Error('useParamsContext must be used within a ParamsWrapper')
  }
  return context
}
