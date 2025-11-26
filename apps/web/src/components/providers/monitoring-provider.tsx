/**
 * Monitoring Provider - Socle
 */
'use client'

import { createContext, useContext, type ReactNode } from 'react'

interface MonitoringContextType {
  trackEvent: (event: string, data?: Record<string, unknown>) => void
  trackError: (error: Error) => void
}

const MonitoringContext = createContext<MonitoringContextType>({
  trackEvent: () => {},
  trackError: () => {},
})

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const trackEvent = (event: string, data?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Monitoring]', event, data)
    }
  }

  const trackError = (error: Error) => {
    console.error('[Monitoring Error]', error)
  }

  return (
    <MonitoringContext.Provider value={{ trackEvent, trackError }}>
      {children}
    </MonitoringContext.Provider>
  )
}

export function useMonitoring() {
  return useContext(MonitoringContext)
}
