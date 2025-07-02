// apps/web/src/hooks/use-auth.ts
import { useAuthStore } from '@/stores/auth.store'
import { useEffect } from 'react'
import { shallow } from 'zustand/shallow'

export const useAuth = () => {
  const auth = useAuthStore(
    (state) => ({
      user: state.user,
      tokens: state.tokens,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      error: state.error,
      login: state.login,
      logout: state.logout,
      clearError: state.clearError,
      updateUser: state.updateUser,
    }),
    shallow
  )

  useEffect(() => {
    const checkAuth = useAuthStore.getState().checkAuth
    if (auth.tokens?.accessToken && !auth.user) {
      checkAuth().catch(console.error)
    }
  }, [])

  return auth
}

export const useCurrentUser = () => {
  return useAuthStore((state) => state.user)
}

export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated)
}