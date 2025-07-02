// apps/web/src/hooks/use-auth.ts - SANS ZUSTAND
import { useState, useCallback } from 'react'

const mockUser = {
  id: '1',
  nom: 'Utilisateur',
  email: 'user@topsteel.com',
  role: 'admin'
}

export const useAuth = () => {
  const [user, setUser] = useState(mockUser)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    // Simuler connexion
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUser(mockUser)
    setIsLoading(false)
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    setUser(null)
    setIsLoading(false)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  }
}

export const useCurrentUser = () => {
  const { user } = useAuth()
  return user
}

export const useIsAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}
