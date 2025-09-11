'use client'

import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthService } from '../../services/auth-service'
import { callClientApi } from '../../utils/backend-api'
import { AuthAdapter } from './auth-adapter'
import { AuthContext } from './auth-context'
import { authStorage } from './auth-storage'
import type {
  AuthBroadcastEvent,
  AuthContextType,
  AuthState,
  AuthTokens,
  Company,
  User,
} from './auth-types'
import type { ExtendedUser } from './rbac-types'

// État par défaut
const defaultAuthState: AuthState = {
  isLoading: true,
  isAuthenticated: false,
  user: null,
  tokens: null,
  mfa: { required: false },
  company: null,
  requiresCompanySelection: false,
  mounted: false,
}

interface AuthProviderProps {
  children: React.ReactNode
}

// Type guards pour valider les types unknown
function isValidUser(user: unknown): user is User {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    'nom' in user &&
    'prenom' in user &&
    'role' in user &&
    'isActive' in user &&
    typeof (user as User).id === 'string' &&
    typeof (user as User).email === 'string'
  )
}

function isValidCompany(company: unknown): company is Company {
  return (
    typeof company === 'object' &&
    company !== null &&
    'id' in company &&
    'nom' in company &&
    'code' in company &&
    typeof (company as Company).id === 'string' &&
    typeof (company as Company).nom === 'string' &&
    typeof (company as Company).code === 'string'
  )
}

function isValidAuthTokens(tokens: unknown): tokens is AuthTokens {
  return (
    typeof tokens === 'object' &&
    tokens !== null &&
    'accessToken' in tokens &&
    'refreshToken' in tokens &&
    typeof (tokens as AuthTokens).accessToken === 'string' &&
    typeof (tokens as AuthTokens).refreshToken === 'string'
  )
}

function isValidExtendedUser(user: unknown): user is ExtendedUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    'firstName' in user &&
    'lastName' in user &&
    'societeRoles' in user &&
    typeof (user as ExtendedUser).id === 'string' &&
    typeof (user as ExtendedUser).email === 'string' &&
    Array.isArray((user as ExtendedUser).societeRoles)
  )
}

function hasRoleProperty(user: unknown): user is { role: string } {
  return (
    typeof user === 'object' &&
    user !== null &&
    'role' in user &&
    typeof (user as { role: string }).role === 'string'
  )
}

function hasSocieteRoles(user: unknown): user is { societeRoles: unknown[] } {
  return (
    typeof user === 'object' &&
    user !== null &&
    'societeRoles' in user &&
    Array.isArray((user as { societeRoles: unknown[] }).societeRoles)
  )
}

function hasIsActiveProperty(company: unknown): company is { isActive: boolean } {
  return (
    typeof company === 'object' &&
    company !== null &&
    'isActive' in company &&
    typeof (company as { isActive: boolean }).isActive === 'boolean'
  )
}

export function AuthProvider({ children }: AuthProviderProps) {
  // État principal
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState)

  // État pour gérer l'hydratation SSR
  const [isHydrated, setIsHydrated] = useState(false)

  // Références pour éviter les re-initialisations
  const tabId = useRef<string>('')
  const initializationRef = useRef<boolean>(false)
  const broadcastChannel = useRef<BroadcastChannel | null>(null)

  // ===========================================
  // GESTION DE L'HYDRATATION SSR
  // ===========================================

  useEffect(() => {
    // Marquer comme hydraté uniquement côté client
    setIsHydrated(true)

    // Générer un ID unique pour cet onglet
    if (typeof window !== 'undefined' && !tabId?.current) {
      tabId.current = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }, [])

  // ===========================================
  // SYNCHRONISATION MULTI-ONGLETS
  // ===========================================

  const initializeBroadcastChannel = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const config = authStorage?.getConfig()
      if (broadcastChannel.current !== undefined && config) {
        broadcastChannel.current = new BroadcastChannel(config.broadcastChannelName)
      }

      if (broadcastChannel.current) {
        broadcastChannel.current.onmessage = (event: MessageEvent<AuthBroadcastEvent>) => {
          const { type, tabId: senderTabId, data } = event.data

          // Ignorer les messages de ce même onglet
          if (senderTabId === tabId?.current) return

          switch (type) {
            case 'USER_LOGIN': {
              // Un autre onglet s'est connecté
              const { user, tokens, company } = data
              setAuthState((prev) => ({
                ...prev,
                isAuthenticated: true,
                user: user || null,
                tokens: tokens || null,
                company: company || null,
                requiresCompanySelection: !company,
                mfa: { required: false },
              }))
              break
            }

            case 'USER_LOGOUT':
              // Un autre onglet s'est déconnecté
              setAuthState({
                ...defaultAuthState,
                isLoading: false,
                mounted: true,
              })
              break

            case 'COMPANY_CHANGED': {
              // Un autre onglet a changé de société
              const { user: updatedUser, tokens: updatedTokens, company: newCompany } = data
              setAuthState((prev) => ({
                ...prev,
                user: updatedUser || null,
                tokens: updatedTokens || null,
                company: newCompany || null,
                requiresCompanySelection: false,
              }))
              break
            }

            case 'TOKEN_REFRESH': {
              // Un autre onglet a rafraîchi les tokens
              const { tokens: refreshedTokens } = data
              setAuthState((prev) => ({
                ...prev,
                tokens: refreshedTokens || null,
              }))
              break
            }
          }
        }
      }
    } catch (_error) {
      // Ignore broadcast channel errors
    }
  }, [])

  // ===========================================
  // INITIALISATION DE L'AUTHENTIFICATION
  // ===========================================

  useEffect(() => {
    if (!isHydrated || initializationRef?.current) return undefined
    if (initializationRef.current !== undefined) {
      initializationRef.current = true
    }

    const initializeAuth = async () => {
      try {
        // Récupérer la session stockée
        const storedSession = authStorage?.getStoredSession()
        let { user, tokens, company } = storedSession

        // Convertir l'utilisateur existant vers le nouveau format si nécessaire
        if (user && !hasSocieteRoles(user)) {
          // Convertir vers le format ExistingUser attendu par l'adaptateur
          const existingUserFormat = {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role || 'USER',
            permissions: user.permissions || [],
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }
          const extendedUser = AuthAdapter?.toExtendedUser(existingUserFormat)
          user = AuthAdapter?.toAuthUser(extendedUser)
        }

        // Convertir la société existante si nécessaire
        if (company && !hasIsActiveProperty(company)) {
          if (isValidCompany(company)) {
            company = AuthAdapter?.toNewCompany(company)
          }
        }

        if (user && tokens) {
          // Vérifier si les tokens ne sont pas expirés
          if (authStorage?.areTokensExpired(tokens)) {
            try {
              const newTokens = await AuthService?.refreshTokens(tokens?.refreshToken)
              authStorage?.updateTokens(newTokens)

              setAuthState({
                isLoading: false,
                isAuthenticated: true,
                user,
                tokens: newTokens,
                mfa: { required: false },
                company: company || null,
                requiresCompanySelection: !company,
                mounted: true,
              })
            } catch (_refreshError) {
              authStorage?.clearSession()
              setAuthState({
                ...defaultAuthState,
                isLoading: false,
                mounted: true,
              })
            }
          } else {
            // Valider les tokens avec le serveur
            const isValid = await AuthService?.validateTokens(tokens)

            if (isValid) {
              setAuthState({
                isLoading: false,
                isAuthenticated: true,
                user,
                tokens,
                mfa: { required: false },
                company: company || null,
                requiresCompanySelection: !company,
                mounted: true,
              })
            } else {
              authStorage?.clearSession()
              setAuthState({
                ...defaultAuthState,
                isLoading: false,
                mounted: true,
              })
            }
          }
        } else {
          // Pas de session stockée
          setAuthState({
            ...defaultAuthState,
            isLoading: false,
            mounted: true,
          })
        }

        // Initialiser la synchronisation multi-onglets
        initializeBroadcastChannel()
      } catch (_error) {
        authStorage?.clearSession()
        setAuthState({
          ...defaultAuthState,
          isLoading: false,
          mounted: true,
        })
      }
    }

    initializeAuth()

    // Nettoyage lors du démontage
    return () => {
      if (broadcastChannel?.current) {
        broadcastChannel?.current?.close()
      }
    }
  }, [
    isHydrated, // Initialiser la synchronisation multi-onglets
    initializeBroadcastChannel,
  ])

  const broadcastAuthEvent = useCallback(
    (type: AuthBroadcastEvent['type'], data: Record<string, unknown>) => {
      if (!broadcastChannel?.current) return

      try {
        const event: AuthBroadcastEvent = {
          type,
          tabId: tabId.current,
          data,
        }

        broadcastChannel?.current?.postMessage(event)
      } catch (_error) {}
    },
    [] // Dependencies are refs, which are stable
  )

  // ===========================================
  // ACTIONS D'AUTHENTIFICATION
  // ===========================================

  const login = useCallback(
    async (identifier: string, password: string, rememberMe = false): Promise<void> => {
      setAuthState((prev) => ({ ...prev, isLoading: true }))

      try {
        const result = await AuthService?.login(identifier, password)

        if (result?.requiresMFA && result?.mfa) {
          // MFA requis
          setAuthState((prev) => ({
            ...prev,
            isLoading: false,
            mfa: result.mfa!,
          }))
          return
        }

        if (result?.user && result?.tokens) {
          // Login réussi - convertir les données API vers le nouveau format
          if (!isValidUser(result.user)) {
            throw new Error('Invalid user data received from login')
          }
          if (!isValidAuthTokens(result.tokens)) {
            throw new Error('Invalid tokens received from login')
          }

          const extendedUser = AuthAdapter?.toExtendedUser(result.user)
          const user = AuthAdapter?.toAuthUser(extendedUser)
          const tokens = AuthAdapter?.toNewAuthTokens(result.tokens)

          // Sauvegarder temporairement les tokens pour permettre les appels API
          authStorage?.saveSession(user, tokens, null, rememberMe)

          // Vérifier s'il y a une société par défaut
          try {
            const response = await callClientApi('auth/user/default-company', {
              method: 'GET',
            })

            if (response?.ok) {
              const defaultCompanyData = await response?.json()

              if (defaultCompanyData?.success && defaultCompanyData?.data) {
                // L'utilisateur a une société par défaut - se connecter automatiquement
                const companyId = defaultCompanyData?.data?.id

                // IMPORTANT: Attendre un peu pour s'assurer que les tokens sont bien propagés
                await new Promise((resolve) => setTimeout(resolve, 100))

                const companySelectResult = await AuthService?.selectCompany(
                  companyId,
                  tokens?.accessToken
                )

                if (!companySelectResult?.user || !isValidUser(companySelectResult.user)) {
                  throw new Error('Invalid user data received from company selection')
                }
                if (
                  !companySelectResult?.tokens ||
                  !isValidAuthTokens(companySelectResult.tokens)
                ) {
                  throw new Error('Invalid tokens received from company selection')
                }
                if (!companySelectResult?.company || !isValidCompany(companySelectResult.company)) {
                  throw new Error('Invalid company data received from company selection')
                }

                const adaptedUser = AuthAdapter?.toAuthUser(
                  AuthAdapter?.toExtendedUser(companySelectResult.user)
                )
                const adaptedTokens = AuthAdapter?.toNewAuthTokens(companySelectResult.tokens)
                const adaptedCompany = AuthAdapter?.toNewCompany(companySelectResult.company)

                authStorage?.saveSession(adaptedUser, adaptedTokens, adaptedCompany, rememberMe)

                const newState = {
                  isLoading: false,
                  isAuthenticated: true,
                  user: adaptedUser,
                  tokens: adaptedTokens,
                  mfa: { required: false },
                  company: adaptedCompany,
                  requiresCompanySelection: false,
                  mounted: true,
                }
                setAuthState(newState)
                broadcastAuthEvent('USER_LOGIN', {
                  user: adaptedUser,
                  tokens: adaptedTokens,
                  company: adaptedCompany,
                })

                // IMPORTANT: Rediriger immédiatement vers le dashboard
                if (typeof window !== 'undefined') {
                  window.location.href = '/dashboard'
                }

                return
              } else {
              }
            } else {
            }
          } catch (_error) {}

          // Pas de société par défaut ou erreur - forcer la sélection (tokens déjà sauvegardés)

          const newState = {
            isLoading: false,
            isAuthenticated: true,
            user,
            tokens,
            mfa: { required: false },
            company: null,
            requiresCompanySelection: true,
            mounted: true,
          }

          setAuthState((prev) => ({ ...prev, ...newState }))
          broadcastAuthEvent('USER_LOGIN', { user, tokens, company: null })
        }
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        throw error
      }
    },
    [broadcastAuthEvent]
  )

  const verifyMFA = useCallback(
    async (
      mfaType: string,
      code?: string,
      webauthnResponse?: PublicKeyCredential
    ): Promise<void> => {
      if (!authState?.mfa?.required || !authState?.mfa?.userId) {
        throw new Error('MFA not required or no user ID available')
      }

      setAuthState((prev) => ({ ...prev, isLoading: true }))

      try {
        const mfaResult = await AuthService?.verifyMFA(
          authState?.mfa?.userId!,
          mfaType,
          code,
          webauthnResponse
        )

        if (!mfaResult?.user || !isValidUser(mfaResult.user)) {
          throw new Error('Invalid user data received from MFA verification')
        }
        if (!mfaResult?.tokens || !isValidAuthTokens(mfaResult.tokens)) {
          throw new Error('Invalid tokens received from MFA verification')
        }

        // Convertir les données vers le format attendu
        const extendedUser = AuthAdapter?.toExtendedUser(mfaResult.user)
        const user = AuthAdapter?.toAuthUser(extendedUser)
        const tokens = AuthAdapter?.toNewAuthTokens(mfaResult.tokens)

        // Forcer la sélection de société après MFA aussi
        authStorage?.saveSession(user, tokens, null)

        const newState = {
          isLoading: false,
          isAuthenticated: true,
          user,
          tokens,
          mfa: { required: false },
          company: null,
          requiresCompanySelection: true,
          mounted: true,
        }

        setAuthState((prev) => ({ ...prev, ...newState }))

        broadcastAuthEvent('USER_LOGIN', { user, tokens, company: null })
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        throw error
      }
    },
    [authState.mfa, broadcastAuthEvent]
  )

  const selectCompany = useCallback(
    async (company: Company): Promise<void> => {
      if (!authState.tokens?.accessToken) {
        throw new Error('No access token available')
      }

      setAuthState((prev) => ({ ...prev, isLoading: true }))

      try {
        const result = await AuthService?.selectCompany(company.id, authState?.tokens?.accessToken)

        if (!result?.user || !isValidUser(result.user)) {
          throw new Error('Invalid user data received from company selection')
        }
        if (!result?.tokens || !isValidAuthTokens(result.tokens)) {
          throw new Error('Invalid tokens received from company selection')
        }
        if (!result?.company || !isValidCompany(result.company)) {
          throw new Error('Invalid company data received from company selection')
        }

        // Convertir les données vers le format attendu
        const extendedUser = AuthAdapter?.toExtendedUser(result.user)
        const user = AuthAdapter?.toAuthUser(extendedUser)
        const tokens = AuthAdapter?.toNewAuthTokens(result.tokens)
        const adaptedCompany = AuthAdapter?.toNewCompany(result.company)

        authStorage?.saveSession(user, tokens, adaptedCompany)

        const newState = {
          isLoading: false,
          user: user,
          tokens: tokens,
          company: adaptedCompany,
          requiresCompanySelection: false,
        }

        setAuthState((prev) => ({ ...prev, ...newState }))

        broadcastAuthEvent('COMPANY_CHANGED', result)
      } catch (error) {
        setAuthState((prev) => ({ ...prev, isLoading: false }))
        throw error
      }
    },
    [authState.tokens?.accessToken, broadcastAuthEvent]
  )

  const logout = useCallback(async (): Promise<void> => {
    setAuthState((prev) => ({ ...prev, isLoading: true }))

    try {
      await AuthService?.logout(authState.tokens?.accessToken)
    } catch (_error) {
    } finally {
      // Nettoyer la session
      authStorage?.clearSession()

      setAuthState({
        ...defaultAuthState,
        isLoading: false,
        mounted: true,
      })

      // Notifier les autres onglets
      broadcastAuthEvent('USER_LOGOUT', {})

      // Rediriger vers la page de login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }, [authState.tokens, broadcastAuthEvent])

  // ===========================================
  // ACTIONS UTILITAIRES
  // ===========================================

  const resetMFA = useCallback((): void => {
    setAuthState((prev) => ({
      ...prev,
      mfa: { required: false },
    }))
  }, [])

  const setUser = useCallback(
    (user: User | null): void => {
      if (user && authState.tokens) {
        authStorage?.saveSession(user, authState.tokens, authState.company)
        setAuthState((prev) => ({
          ...prev,
          user,
          isAuthenticated: true,
        }))
      } else {
        authStorage?.clearSession()
        setAuthState({
          ...defaultAuthState,
          isLoading: false,
          mounted: true,
        })
      }
    },
    [authState.tokens, authState.company]
  )

  const refreshTokens = useCallback(async (): Promise<void> => {
    const storedSession = authStorage?.getStoredSession()
    if (!storedSession?.tokens?.refreshToken) {
      throw new Error('No refresh token available')
    }
    const { tokens: storedTokens } = storedSession

    try {
      const newTokens = await AuthService?.refreshTokens(storedTokens.refreshToken)
      authStorage?.updateTokens(newTokens)

      setAuthState((prev) => ({ ...prev, tokens: newTokens }))

      broadcastAuthEvent('TOKEN_REFRESH', { tokens: newTokens })
    } catch (error) {
      await logout()
      throw error
    }
  }, [logout, broadcastAuthEvent])

  const validateTokens = useCallback(async (tokens: AuthTokens): Promise<boolean> => {
    return AuthService?.validateTokens(tokens)
  }, [])

  const refreshAuth = useCallback(async (): Promise<void> => {
    const storedSession = authStorage?.getStoredSession()
    if (!storedSession) return

    const { user, tokens, company } = storedSession

    if (user && tokens) {
      setAuthState((prev) => ({
        ...prev,
        user,
        tokens,
        company: company || null,
        isAuthenticated: true,
        requiresCompanySelection: !company,
      }))
    }
  }, [])

  // ===========================================
  // VALEUR DU CONTEXTE - OPTIMISÉE
  // ===========================================

  const contextValue: AuthContextType = useMemo(
    () => ({
      // État
      ...authState,
      mounted: isHydrated && authState.mounted,

      // Actions d'authentification
      login,
      logout,

      // Actions MFA
      verifyMFA,
      resetMFA,

      // Actions utilisateur
      setUser,
      refreshTokens,

      // Actions société
      selectCompany,

      // Utilitaires
      refreshAuth,
      validateTokens,
    }),
    [
      authState,
      isHydrated,
      login,
      logout,
      verifyMFA,
      resetMFA,
      setUser,
      refreshTokens,
      selectCompany,
      refreshAuth,
      validateTokens,
    ]
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
