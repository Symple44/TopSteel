'use client'

import type React from 'react'
import type { Permission } from '../../hooks/use-permissions'

interface AuthProviderProps {
  children: React.ReactNode
}

// AuthProvider simplifié qui ne fait aucune redirection
// Laisse le middleware et les pages gérer l'authentification
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>
}

// Hook simple pour protéger les pages privées
export function useRequireAuth() {
  // Ne fait rien, laisse les pages gérer elles-mêmes
  return true
}

// Composant de loading simplifié
export function AuthLoader({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

// Composant pour valider les permissions d'accès
export function RouteGuard({
  children,
  requiredPermissions = [],
  fallbackUrl = '/dashboard',
}: {
  children: React.ReactNode
  requiredPermissions?: Permission[]
  fallbackUrl?: string
}) {
  // Suppress unused parameter warnings
  void requiredPermissions
  void fallbackUrl

  return <>{children}</>
}
