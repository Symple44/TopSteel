/**
 * Connection Context Stub - Socle
 */
'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

interface ConnectionContextType {
  isConnected: boolean
  isOnline: boolean
}

const ConnectionContext = createContext<ConnectionContextType>({
  isConnected: true,
  isOnline: true,
})

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  
  return (
    <ConnectionContext.Provider value={{ isConnected: true, isOnline }}>
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  return useContext(ConnectionContext)
}
