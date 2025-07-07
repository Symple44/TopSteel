/**
 * 🔧 PROVIDERS PRINCIPAUX SSR-SAFE - TopSteel ERP  
 * Configuration des providers avec protection SSR
 * Fichier: apps/web/src/app/providers.tsx
 */

'use client'

import { ClientOnly } from '@/components/client-only'
import MonitoringInitializer from '@/components/monitoring-initializer'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Component, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react'

// ===== TYPES =====
interface ProvidersProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
  retryCount: number
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ComponentType<ErrorBoundaryState>
}

// ===== ERROR BOUNDARY SSR-SAFE =====
class TopSteelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null
  private maxRetries = 3
  private retryDelay = 1000

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const errorId = `topsteel-error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId,
      retryCount: 0
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId || 'unknown'
    
    // Log structuré pour monitoring (SSR-safe)
    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      retryCount: this.state.retryCount
    }

    console.error('🚨 TopSteel Error Boundary:', errorData)

    // Sauvegarder l'erreur dans l'état
    this.setState({ errorInfo })

    // Analytics/monitoring (SSR-safe)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          custom_map: { error_id: errorId }
        })
      } catch (analyticsError) {
        console.warn('Failed to send error to analytics:', analyticsError)
      }
    }
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId)
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.retryTimeoutId = setTimeout(() => {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: this.state.retryCount + 1
        })
      }, this.retryDelay * Math.pow(2, this.state.retryCount))
    }
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

      // Fallback par défaut SSR-safe
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
                  Une erreur est survenue
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {this.state.errorId}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {this.state.error?.message || 'Erreur inconnue'}
              </p>
            </div>
            
            <div className="flex gap-3">
              {this.state.retryCount < this.maxRetries && (
                <button
                  onClick={this.handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Réessayer ({this.maxRetries - this.state.retryCount})
                </button>
              )}
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// ===== QUERY CLIENT FACTORY =====
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: (failureCount, error) => {
          // Ne pas retry sur les erreurs 4xx
          if ((error as any)?.status >= 400 && (error as any)?.status < 500) {
            return false
          }
          return failureCount < 3
        },
      },
    },
  })
}

// ===== PROVIDER PRINCIPAL =====
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => createQueryClient())

  return (
    <TopSteelErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="topsteel-theme"
          enableSystem
          enableTransitions
          enableMetrics
          enableSync
        >
          {/* Initialisation du monitoring côté client uniquement */}
          <ClientOnly>
            <MonitoringInitializer
              enableAnalytics={process.env.NODE_ENV === 'production'}
              enablePerformanceTracking
              enableErrorTracking
            />
          </ClientOnly>
          
          {children}
          
          {/* DevTools uniquement en développement et côté client */}
          <ClientOnly>
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </ClientOnly>
        </ThemeProvider>
      </QueryClientProvider>
    </TopSteelErrorBoundary>
  )
}

export default Providers