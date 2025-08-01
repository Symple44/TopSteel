'use client'

import { createContext, useContext } from 'react'
import type { AuthContextType } from './auth-types'

// Context d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Hook pour utiliser le contexte d'authentification
 * @throws {Error} Si utilisé en dehors d'un AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
        'Make sure to wrap your component tree with <AuthProvider>.'
    )
  }

  return context
}

export { AuthContext }
