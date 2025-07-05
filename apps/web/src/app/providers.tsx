/**
 * 🌐 PROVIDERS PRINCIPAUX - TOPSTEEL ERP WEB APP
 * Providers principaux de l'application avec gestion d'erreurs
 * 
 * Ordre d'encapsulation optimal:
 * 1. Error Boundary (capture les erreurs)
 * 2. Query Provider (cache et requêtes)
 * 3. Theme Provider (thème et apparence)
 * 4. Auth Provider (authentification)
 * 5. UI Provider (tooltips, etc.)
 * 6. Notifications Provider (notifications temps réel)
 * 7. Toast Provider (toasts et notifications visuelles)
 */
'use client'

import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

// =============================================
// CONFIGURATION QUERY CLIENT
// =============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (remplace cacheTime)
      retry: (failureCount, error: any) => {
        // Ne pas retry pour les erreurs 404, 401, 403
        if (error?.status === 404 || error?.status === 401 || error?.status === 403) {
          return false
        }
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: 'always'
    },
    mutations: {
      retry: 1,
      retryDelay: 1000
    }
  }
})

// =============================================
// ERROR BOUNDARY
// =============================================

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ProvidersErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Provider Error Boundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
    
    // En production, envoyer vers le service de monitoring
    if (process.env.NODE_ENV === 'production') {
      // Exemple: Sentry.captureException(error, { extra: errorInfo })
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow-lg text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-4">
              Erreur de l'application
            </h1>
            <p className="text-gray-600 mb-6">
              Une erreur inattendue s'est produite. L'équipe technique a été notifiée.
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Recharger la page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Détails de l'erreur (dev)
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.stack}
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

// =============================================
// QUERY PROVIDER WRAPPER
// =============================================

function QueryProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}

// =============================================
// AUTH PROVIDER PLACEHOLDER
// =============================================

function AuthProvider({ children }: { children: ReactNode }) {
  // TODO: Implémenter le provider d'authentification
  return <>{children}</>
}

function AuthLoader({ children }: { children: ReactNode }) {
  // TODO: Implémenter le loader d'authentification
  return <>{children}</>
}

// =============================================
// UI PROVIDER PLACEHOLDER
// =============================================

function UIProvider({ children }: { children: ReactNode }) {
  // TODO: Implémenter le provider UI (tooltips, modales, etc.)
  return <>{children}</>
}

// =============================================
// NOTIFICATIONS PROVIDER PLACEHOLDER
// =============================================

function NotificationsProvider({ children }: { children: ReactNode }) {
  // TODO: Implémenter le provider de notifications temps réel
  return <>{children}</>
}

// =============================================
// TOAST PROVIDER WRAPPER
// =============================================

function ToastProviderWrapper({ children }: { children: ReactNode }) {
  // TODO: Implémenter le wrapper pour les toasts
  return <>{children}</>
}

// =============================================
// PROVIDER PRINCIPAL
// =============================================

/**
 * Provider principal qui encapsule tous les autres providers
 * dans l'ordre optimal pour éviter les conflits et optimiser les performances
 * 
 * Ordre d'encapsulation:
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
          enableSystem={true}
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

// =============================================
// HOOKS UTILITAIRES
// =============================================

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
          <div>API: {process.env.NEXT_PUBLIC_API_URL || 'localhost'}</div>
          <div>Theme: Available</div>
        </div>
      </div>
    </>
  )
}

// =============================================
// UTILITIES
// =============================================

/**
 * Utilitaire pour vérifier la santé des providers
 */
export function checkProvidersHealth() {
  const health = {
    queryClient: !!queryClient,
    theme: typeof window !== 'undefined' && !!document.documentElement.classList.contains('dark') || !!document.documentElement.classList.contains('light'),
    storage: typeof window !== 'undefined' && !!localStorage,
    timestamp: new Date().toISOString()
  }
  
  console.log('Providers Health Check:', health)
  return health
}

/**
 * Export du query client pour usage externe si nécessaire
 */
export { queryClient };

/**
 * Export par défaut
 */
export default Providers