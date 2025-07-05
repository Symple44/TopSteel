'use client'

import { AuthLoader, AuthProvider } from '@/components/auth/AuthProvider'
import { NotificationsProvider } from '@/components/providers/notifications-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ReactNode } from 'react'
import { useState } from 'react'

/**
 * Configuration du client React Query
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Durée de mise en cache des données
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
        
        // Retry et refetch
        retry: (failureCount, error: any) => {
          // Ne pas retry pour les erreurs d'authentification
          if (error?.status === 401 || error?.status === 403) {
            return false
          }
          // Maximum 2 retries pour les autres erreurs
          return failureCount < 2
        },
        
        // Refetch automatique
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        
        // Network mode
        networkMode: 'online',
      },
      mutations: {
        // Retry mutations en cas d'échec réseau
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false // Erreurs client, ne pas retry
          }
          return failureCount < 1 // 1 retry pour les erreurs serveur
        },
        networkMode: 'online',
      },
    },
  })
}

/**
 * Provider pour React Query avec configuration optimisée
 */
function QueryProvider({ children }: { children: ReactNode }) {
  // Créer le client une seule fois pour éviter les re-créations
  const [queryClient] = useState(() => createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools uniquement en développement */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}

/**
 * Provider pour les toasts avec gestion d'erreurs
 */
function ToastProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  )
}

/**
 * Provider d'accessibilité et d'interface utilisateur
 */
function UIProvider({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={100}>
      {children}
    </TooltipProvider>
  )
}

/**
 * Error Boundary pour capturer les erreurs des providers
 */
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ProvidersErrorBoundary extends React.Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ProvidersErrorBoundary caught an error:', error, errorInfo)
    
    // Log l'erreur vers un service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      // Exemple: Sentry, LogRocket, etc.
      // logErrorToService(error, errorInfo)
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Erreur d'initialisation
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Une erreur inattendue s'est produite lors du chargement de l'application.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Recharger la page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-medium">
                  Détails de l'erreur (dev)
                </summary>
                <pre className="mt-2 overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Provider principal qui regroupe tous les autres providers
 * 
 * Architecture en couches :
 * 1. Error Boundary (capture les erreurs)
 * 2. Query Provider (cache et requêtes)
 * 3. Theme Provider (thème et apparence)
 * 4. Auth Provider (authentification)
 * 5. UI Provider (tooltips, etc.)
 * 6. Notifications Provider (notifications temps réel)
 * 7. Toast Provider (toasts et notifications visuelles)
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ProvidersErrorBoundary>
      <QueryProvider>
        <ThemeProvider
          defaultTheme="system"
          storageKey="topsteel-theme"
          enableSystemWatch={true}
          enableMetrics={process.env.NODE_ENV === 'development'}
          transitionDuration={200}
        >
          <AuthProvider>
            <AuthLoader>
              <UIProvider>
                <NotificationsProvider>
                  <ToastProviderWrapper>
                    {children}
                  </ToastProviderWrapper>
                </NotificationsProvider>
              </UIProvider>
            </AuthLoader>
          </AuthProvider>
        </ThemeProvider>
      </QueryProvider>
    </ProvidersErrorBoundary>
  )
}

/**
 * Hook pour accéder au contexte de monitoring (si disponible)
 */
export function useMonitoring() {
  return {
    logError: (error: Error, context?: Record<string, any>) => {
      console.error('Error logged:', error, context)
      
      // En production, envoyer vers le service de monitoring
      if (process.env.NODE_ENV === 'production') {
        // Exemple: Sentry.captureException(error, { extra: context })
      }
    },
    logEvent: (event: string, data?: Record<string, any>) => {
      console.log('Event logged:', event, data)
      
      // En production, envoyer vers l'analytics
      if (process.env.NODE_ENV === 'production') {
        // Exemple: analytics.track(event, data)
      }
    }
  }
}

/**
 * Provider de développement pour les outils de debugging
 */
export function DevProvider({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  return (
    <>
      {children}
      {/* Affichage des informations de debug en développement */}
      <div className="fixed bottom-2 left-2 z-[100] opacity-50 hover:opacity-100 transition-opacity">
        <div className="bg-black text-white text-xs px-2 py-1 rounded">
          <div>ENV: {process.env.NODE_ENV}</div>
          <div>API: {process.env.NEXT_PUBLIC_API_URL}</div>
        </div>
      </div>
    </>
  )
}

// Import de React pour l'Error Boundary
import React from 'react'
