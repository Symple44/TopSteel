'use client'

import { AlertTriangle, Bug, Home, RefreshCw } from 'lucide-react'
import type { ErrorInfo, ReactNode } from 'react'
import React, { Component } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  isolate?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId: string
  retryCount: number
}

interface ErrorMetrics {
  timestamp: number
  userAgent: string
  url: string
  userId?: string
  errorBoundary: string
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = []
  private maxRetries = 3
  private retryDelay = 1000

  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
      retryCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // ✅ LOGGING ENTERPRISE
    this.logError(error, errorInfo)

    // ✅ METRICS & MONITORING
    this.trackErrorMetrics(error, errorInfo)

    // ✅ CALLBACK PARENT
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // ✅ RETRY AUTOMATIQUE POUR CERTAINES ERREURS
    this.scheduleRetryIfApplicable(error)
  }

  override componentWillUnmount() {
    // Nettoyer les timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout))
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    }

    // Console pour développement
    console.group(`🚨 ErrorBoundary [${this.state.errorId}]`)
    console.error('Error:', error)
    console.error('Error Info:', errorInfo)
    console.error('Full Context:', errorData)
    console.groupEnd()

    // Service de logging en production
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToService(errorData)
    }
  }

  private trackErrorMetrics(error: Error, errorInfo: ErrorInfo) {
    const metrics: ErrorMetrics = {
      timestamp: Date.now(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      errorBoundary: this.constructor.name,
    }

    // Analytics/monitoring
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: true,
        custom_map: { error_id: this.state.errorId },
      })
    }
  }

  private async sendErrorToService(errorData: any) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      })
    } catch (logError) {
      console.error('Failed to send error to logging service:', logError)
    }
  }

  private scheduleRetryIfApplicable(error: Error) {
    // Retry pour certains types d'erreurs résolvables
    const retryableErrors = ['ChunkLoadError', 'Loading chunk', 'NetworkError', 'Failed to fetch']

    const isRetryable = retryableErrors.some(
      (pattern) => error.message.includes(pattern) || error.name.includes(pattern)
    )

    if (isRetryable && this.state.retryCount < this.maxRetries) {
      const timeout = setTimeout(
        () => {
          this.setState({
            hasError: false,
            retryCount: this.state.retryCount + 1,
            errorId: this.generateErrorId(),
          })
        },
        this.retryDelay * 2 ** this.state.retryCount
      ) // Backoff exponentiel

      this.retryTimeouts.push(timeout)
    }
  }

  private handleManualRetry = () => {
    this.setState({
      hasError: false,
      errorId: this.generateErrorId(),
      retryCount: 0,
    })
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private handleReportBug = () => {
    const subject = `Bug Report - Error ${this.state.errorId}`
    const body = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message || 'Unknown error'}
URL: ${typeof window !== 'undefined' ? window.location.href : 'SSR'}
Timestamp: ${new Date().toISOString()}

Stack trace:
${this.state.error?.stack || 'No stack trace available'}

Component stack:
${this.state.errorInfo?.componentStack || 'No component stack available'}
    `.trim()

    const mailtoUrl = `mailto:support@topsteel.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    if (typeof window !== 'undefined') {
      window.location.href = mailtoUrl
    }
  }

  override render() {
    if (this.state.hasError) {
      // Fallback personnalisé fourni par le parent
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Interface d'erreur par défaut
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full bg-card border border-border rounded-lg shadow-lg p-6 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Oups ! Une erreur s'est produite
              </h1>
              <p className="text-muted-foreground text-sm">
                Quelque chose s'est mal passé dans l'application.
              </p>
            </div>

            {/* Détails de l'erreur en mode développement */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-muted rounded-md text-left">
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-foreground mb-2">
                    Détails techniques
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Erreur :</strong>
                      <code className="block mt-1 p-2 bg-background rounded text-destructive text-xs">
                        {this.state.error.message}
                      </code>
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Composant :</strong>
                        <pre className="mt-1 p-2 bg-background rounded text-xs overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )}

            {/* ID d'erreur pour le support */}
            <div className="mb-6 text-xs text-muted-foreground">
              ID d'erreur : <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={this.handleManualRetry}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-3 py-2 rounded-md hover:bg-secondary/80 transition-colors text-sm"
                >
                  <Home className="w-4 h-4" />
                  Accueil
                </button>

                <button
                  onClick={this.handleReportBug}
                  className="flex items-center justify-center gap-2 bg-muted text-muted-foreground px-3 py-2 rounded-md hover:bg-muted/80 transition-colors text-sm"
                >
                  <Bug className="w-4 h-4" />
                  Signaler
                </button>
              </div>
            </div>

            {/* Information de retry automatique */}
            {this.state.retryCount > 0 && (
              <div className="mt-4 text-xs text-muted-foreground">
                Tentatives automatiques : {this.state.retryCount}/{this.maxRetries}
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC pour wrapper facilement les composants
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Hook pour déclencher des erreurs en développement
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Manual error triggered:', error, errorInfo)
    }
    throw error
  }
}

// Composant de test pour les erreurs (développement uniquement)
export function ErrorTrigger({ children }: { children?: ReactNode }) {
  const [shouldError, setShouldError] = React.useState(false)

  if (shouldError) {
    throw new Error('Test error triggered manually')
  }

  if (process.env.NODE_ENV !== 'development') {
    return <>{children}</>
  }

  return (
    <div>
      {children}
      <button
        onClick={() => setShouldError(true)}
        className="mt-4 px-3 py-1 bg-destructive text-destructive-foreground rounded text-xs"
      >
        🧨 Test Error
      </button>
    </div>
  )
}
