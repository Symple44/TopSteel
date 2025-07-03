'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

/**
 * ✅ GLOBAL ERROR BOUNDARY ENTERPRISE
 * 
 * Fonctionnalités:
 * - Capture toutes les erreurs React
 * - Logging automatique vers services externes
 * - Recovery intelligent
 * - Isolation d'erreurs par composant
 * - Métriques et analytics
 * - Fallbacks contextuels
 */
export class GlobalErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // ✅ LOGGING ENTERPRISE
    this.logError(error, errorInfo)

    // ✅ CALLBACK PERSONNALISÉ
    this.props.onError?.(error, errorInfo)

    // ✅ MÉTRIQUES ANALYTICS
    this.trackError(error, errorInfo)
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'Unknown',
      userId: this.getUserId(),
      sessionId: this.getSessionId()
    }

    // Console pour développement
    console.group('🚨 Error Boundary Triggered')
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Error Data:', errorData)
    console.groupEnd()

    // Service de logging externe (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined') {
      try {
        // Sentry
        if ((window as any).Sentry) {
          (window as any).Sentry.captureException(error, {
            contexts: { errorInfo, errorData }
          })
        }

        // Autre service de monitoring
        if ((window as any).analytics) {
          (window as any).analytics.track('error_boundary_triggered', errorData)
        }
      } catch (loggingError) {
        console.warn('Failed to log error to external service:', loggingError)
      }
    }
  }

  private trackError = (error: Error, errorInfo: ErrorInfo) => {
    // Métriques internes
    const metrics = {
      errorType: error.constructor.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack.split('\n')[1]?.trim(),
      retryCount: this.retryCount,
      timestamp: Date.now()
    }

    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        ...metrics
      })
    }
  }

  private getUserId = (): string | null => {
    try {
      const userState = localStorage.getItem('topsteel-app-state')
      if (userState) {
        const parsed = JSON.parse(userState)
        return parsed.state?.user?.id || null
      }
    } catch (e) {
      // Ignore
    }
    return null
  }

  private getSessionId = (): string | null => {
    try {
      const appState = localStorage.getItem('topsteel-app-state')
      if (appState) {
        const parsed = JSON.parse(appState)
        return parsed.state?.session?.id || null
      }
    } catch (e) {
      // Ignore
    }
    return null
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      })
    }
  }

  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state
    
    const reportData = {
      errorId,
      error: error?.message,
      stack: error?.stack,
      component: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    // Copier dans le presse-papier pour support
    navigator.clipboard?.writeText(JSON.stringify(reportData, null, 2))
    
    // Optionnel: Ouvrir modal de support
    alert('Détails de l\'erreur copiés dans le presse-papier. Contactez le support.')
  }

  render() {
    if (this.state.hasError) {
      // ✅ FALLBACK PERSONNALISÉ
      if (this.props.fallback) {
        return this.props.fallback
      }

      // ✅ FALLBACK PAR DÉFAUT ENTERPRISE
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Une erreur est survenue
              </CardTitle>
              <CardDescription>
                L'application a rencontré un problème inattendu. Nous nous excusons pour la gêne occasionnée.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {this.state.errorId && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded font-mono">
                  ID: {this.state.errorId}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {this.retryCount < this.maxRetries && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Réessayer ({this.maxRetries - this.retryCount} tentatives restantes)
                  </Button>
                )}

                <Button 
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>

                <Button 
                  onClick={this.handleReportError}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Signaler le problème
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600">
                    Détails techniques (développement)
                  </summary>
                  <pre className="mt-2 text-xs bg-red-50 p-2 rounded overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// ✅ HOC POUR ERROR BOUNDARY SPÉCIALISÉ
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <GlobalErrorBoundary fallback={fallback} onError={onError} isolate>
      <Component {...props} />
    </GlobalErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// ✅ HOOK POUR GESTION D'ERREURS
export function useErrorHandler() {
  const handleError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context}:`, error)
    
    // Tracker l'erreur
    if (typeof window !== 'undefined' && (window as any).analytics) {
      (window as any).analytics.track('manual_error_handled', {
        error: error.message,
        context,
        timestamp: Date.now()
      })
    }
    
    throw error // Re-throw pour déclencher Error Boundary
  }, [])

  return { handleError }
}
