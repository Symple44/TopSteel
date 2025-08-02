'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Vérifie si c'est l'erreur params readonly
    if (error.message.includes('Cannot assign to read only property \'params\'')) {
      console.warn('Erreur params readonly interceptée:', error.message)
      // Force un refresh pour résoudre le problème
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.location.reload()
        }, 100)
      }
    }
    
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.state.error?.message.includes('Cannot assign to read only property \'params\'')) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement en cours...</p>
            </div>
          </div>
        )
      }
      
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Une erreur s'est produite</h2>
            <p className="text-muted-foreground mb-4">Veuillez rafraîchir la page</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Rafraîchir
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}