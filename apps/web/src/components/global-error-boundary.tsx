'use client'

/**
 * Global Error Boundary for the entire application
 * Catches unhandled errors at the root level
 */

import { Button } from '@erp/ui'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import type { ErrorInfo, ReactNode } from 'react'
import React, { Component } from 'react'
import { errorHandler } from '../lib/errors/error-handler'
import { logger } from '../lib/errors/logger'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId: string
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      hasError: false,
      errorId: this.generateErrorId(),
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

    // Log error with full context
    logger.error('Global error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      componentName: 'GlobalErrorBoundary',
    })

    // Handle error through centralized handler
    errorHandler.handle(error, {
      logError: true,
      reportToBackend: true,
    })
  }

  private generateErrorId(): string {
    return `global_err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <html lang="fr">
          <head>
            <title>Une erreur est survenue - TopSteel ERP</title>
            <meta name="viewport" content="width=device-width, initial-scale=1" />
          </head>
          <body className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl shadow-lg p-8">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Une erreur inattendue est survenue
              </h1>

              {/* Error Description */}
              <p className="text-gray-600 text-center mb-6">
                Nous sommes désolés, mais quelque chose s'est mal passé. Notre équipe a été notifiée
                et travaille à résoudre le problème.
              </p>

              {/* Error ID */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 text-center">
                  Code d'erreur :{' '}
                  <code className="font-mono font-semibold text-gray-900">
                    {this.state.errorId}
                  </code>
                </p>
              </div>

              {/* Technical Details (Development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <summary className="cursor-pointer font-semibold text-red-900 mb-2">
                    Détails techniques (développement uniquement)
                  </summary>
                  <div className="space-y-2 text-xs">
                    <div>
                      <strong className="text-red-900">Erreur :</strong>
                      <pre className="mt-1 p-2 bg-white rounded text-red-800 overflow-auto">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong className="text-red-900">Stack trace :</strong>
                        <pre className="mt-1 p-2 bg-white rounded text-red-800 overflow-auto max-h-48 text-xs">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong className="text-red-900">Component stack :</strong>
                        <pre className="mt-1 p-2 bg-white rounded text-red-800 overflow-auto max-h-32 text-xs">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={this.handleReload}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5" />
                  Recharger la page
                </Button>

                <Button
                  type="button"
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  <Home className="w-5 h-5" />
                  Retour à l'accueil
                </Button>
              </div>

              {/* Support Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Si le problème persiste, veuillez contacter le support avec le code d'erreur
                  ci-dessus.
                </p>
              </div>
            </div>
          </body>
        </html>
      )
    }

    return this.props.children
  }
}

/**
 * HOC to wrap components with global error boundary
 */
export function withGlobalErrorBoundary<T extends object>(
  Component: React.ComponentType<T>
): React.ComponentType<T> {
  const WrappedComponent = (props: T) => (
    <GlobalErrorBoundary>
      <Component {...props} />
    </GlobalErrorBoundary>
  )

  WrappedComponent.displayName = `withGlobalErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}
