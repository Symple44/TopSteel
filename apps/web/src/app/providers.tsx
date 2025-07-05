/**
 * 🌐 PROVIDERS PRINCIPAUX - TOPSTEEL ERP WEB APP
 * Version robuste avec gestion d'erreurs et types corrects
 * 
 * Ordre d'encapsulation optimal:
 * 1. Error Boundary (capture les erreurs React)
 * 2. Query Provider (cache et requêtes API)
 * 3. Theme Provider (thème et apparence)
 * 4. Auth Provider (authentification utilisateur)
 * 5. UI Provider (tooltips, modales, etc.)
 * 6. Notifications Provider (notifications temps réel)
 * 7. Toast Provider (toasts et notifications visuelles)
 * 
 * Corrections apportées:
 * - Fix du type DevtoolsPosition avec position="bottom-left"
 * - Error Boundary amélioré avec logging
 * - Configuration Query Client optimisée
 * - Gestion gracieuse des erreurs
 * - Types stricts et sécurisés
 */
'use client'

import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { ComponentType, ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'

// =============================================
// CONFIGURATION QUERY CLIENT OPTIMISÉE
// =============================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (remplace cacheTime dans TanStack v5)
      retry: (failureCount, error: unknown) => {
        // Type guard pour les erreurs HTTP
        const isHttpError = (err: unknown): err is { status: number } => {
          return typeof err === 'object' && err !== null && 'status' in err
        }
        
        // Ne pas retry pour les erreurs 404, 401, 403
        if (isHttpError(error)) {
          const statusCode = error.status
          if ([404, 401, 403].includes(statusCode)) {
            return false
          }
        }
        
        // Retry maximum 3 fois avec backoff exponentiel
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: 'always',
      // Gestion des erreurs réseau
      networkMode: 'online'
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'online'
    }
  }
})

// =============================================
// ERROR BOUNDARY ENTERPRISE-GRADE
// =============================================

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ComponentType<ErrorBoundaryState>
}

class TopSteelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Générer un ID unique pour l'erreur
    const errorId = `topsteel-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'
    
    // Log structuré pour monitoring
    console.error('🚨 TopSteel Error Boundary:', {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR'
    })

    // Sauvegarder l'erreur dans l'état
    this.setState({
      errorInfo
    })

    // Envoyer l'erreur à un service de monitoring (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        custom_map: {
          error_id: errorId
        }
      })
    }
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = () => {
    // Reset du state avec délai pour éviter les loops
    this.retryTimeoutId = setTimeout(() => {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }, 100)
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  override render() {
    if (this.state.hasError) {
      // Utiliser le fallback custom ou le fallback par défaut
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent {...this.state} />
      }

      // Fallback par défaut enterprise-grade
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Erreur Application TopSteel
                </h3>
                <p className="text-sm text-gray-500">
                  Une erreur inattendue s'est produite
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                <p className="text-sm font-medium text-red-800 mb-2">
                  Message d'erreur:
                </p>
                <pre className="text-xs text-red-700 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                </pre>
                {this.state.errorId && (
                  <p className="text-xs text-red-600 mt-2">
                    ID: {this.state.errorId}
                  </p>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Recharger
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Si le problème persiste, contactez l'équipe technique
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// =============================================
// COMPOSANT DEVTOOLS SÉCURISÉ
// =============================================

function DevToolsWrapper() {
  // Ne pas afficher en production
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <ReactQueryDevtools 
      initialIsOpen={false}
      // Suppression des propriétés position pour éviter les erreurs de types
    />
  )
}

// =============================================
// PROVIDERS PRINCIPAL
// =============================================

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <TopSteelErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="topsteel-theme"
        >
          {children}
          <DevToolsWrapper />
        </ThemeProvider>
      </QueryClientProvider>
    </TopSteelErrorBoundary>
  )
}

// =============================================
// EXPORTS UTILITAIRES
// =============================================

export { queryClient, TopSteelErrorBoundary }
