/**
 * 🔒 CLIENT-ONLY COMPONENT ENHANCED - TopSteel ERP
 * Composants et utilitaires pour éviter les erreurs SSR/hydratation
 * Fichier: apps/web/src/components/client-only.tsx
 */

'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

// ===== TYPES =====
interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
  /**
   * Délai avant d'afficher le fallback (évite les flashs)
   */
  fallbackDelay?: number
  /**
   * Classe CSS pour le conteneur
   */
  className?: string
  /**
   * Callback appelé quand le composant est monté côté client
   */
  onMount?: () => void
}

interface WithClientOnlyOptions {
  fallback?: ComponentType
  displayName?: string
}

// ===== COMPOSANT CLIENT-ONLY PRINCIPAL =====

/**
 * Composant qui rend ses enfants uniquement côté client
 * Évite les erreurs d'hydratation pour les composants utilisant des APIs browser
 */
export function ClientOnly({ 
  children, 
  fallback = null, 
  fallbackDelay = 0,
  className,
  onMount
}: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [showFallback, setShowFallback] = useState(fallbackDelay > 0)

  useEffect(() => {
    // Gérer le délai du fallback
    if (fallbackDelay > 0) {
      const timer = setTimeout(() => {
        setShowFallback(false)
      }, fallbackDelay)
      
      return () => clearTimeout(timer)
    }
    // Retourner undefined explicitement pour satisfaire TypeScript
    return undefined
  }, [fallbackDelay])

  useEffect(() => {
    setHasMounted(true)
    onMount?.()
  }, [onMount])

  // Pendant le SSR ou avant le mounting
  if (!hasMounted || showFallback) {
    return (
      <div className={className} data-client-only="loading">
        {fallback}
      </div>
    )
  }

  return (
    <div className={className} data-client-only="mounted">
      {children}
    </div>
  )
}

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour détecter si on est côté client
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook pour accéder à window de manière sécurisée
 */
export function useWindow(): Window | null {
  const [windowObj, setWindowObj] = useState<Window | null>(null)

  useEffect(() => {
    setWindowObj(window)
  }, [])

  return windowObj
}

/**
 * Hook pour détecter si l'hydratation est terminée
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}

/**
 * Hook pour accéder au navigator de manière sécurisée
 */
export function useNavigator(): Navigator | null {
  const [nav, setNav] = useState<Navigator | null>(null)

  useEffect(() => {
    setNav(navigator)
  }, [])

  return nav
}

/**
 * Hook pour accéder au localStorage de manière sécurisée
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, boolean] {
  const [isClient, setIsClient] = useState(false)
  const [storedValue, setStoredValue] = useState<T>(defaultValue)

  useEffect(() => {
    setIsClient(true)
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStoredValue(JSON.parse(item))
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
    }
  }, [key])

  const setValue = (value: T) => {
    try {
      setStoredValue(value)
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }

  return [storedValue, setValue, isClient]
}

/**
 * Hook pour les media queries côté client
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const isClient = useIsClient()

  useEffect(() => {
    if (!isClient) return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query, isClient])

  return matches
}

// ===== HIGHER-ORDER COMPONENT =====

/**
 * HOC pour wraper automatiquement un composant avec ClientOnly
 */
export function withClientOnly<P extends object>(
  Component: ComponentType<P>,
  options: WithClientOnlyOptions = {}
): ComponentType<P> {
  const { fallback: FallbackComponent, displayName } = options

  const ClientOnlyComponent = (props: P) => (
    <ClientOnly 
      fallback={FallbackComponent ? <FallbackComponent /> : null}
    >
      <Component {...props} />
    </ClientOnly>
  )

  ClientOnlyComponent.displayName = displayName || `withClientOnly(${Component.displayName || Component.name})`

  return ClientOnlyComponent
}

// ===== UTILITAIRES D'ENVIRONNEMENT =====

/**
 * Vérifie si on est côté serveur
 */
export const isServer = typeof window === 'undefined'

/**
 * Vérifie si on est côté client
 */
export const isClient = !isServer

/**
 * Exécute du code uniquement côté client
 */
export function clientOnly<T>(clientCode: () => T, fallback?: T): T | undefined {
  if (isClient) {
    try {
      return clientCode()
    } catch (error) {
      console.warn('Error in clientOnly code:', error)
      return fallback
    }
  }
  return fallback
}

/**
 * Exécute du code uniquement côté serveur
 */
export function serverOnly<T>(serverCode: () => T, fallback?: T): T | undefined {
  if (isServer) {
    try {
      return serverCode()
    } catch (error) {
      console.warn('Error in serverOnly code:', error)
      return fallback
    }
  }
  return fallback
}

// ===== COMPOSANTS DE FALLBACK PRÊTS À L'EMPLOI =====

/**
 * Skeleton loader simple
 */
export function SkeletonLoader({ 
  height = '20px', 
  width = '100%',
  className = ''
}: {
  height?: string
  width?: string
  className?: string
}) {
  return (
    <div 
      className={`animate-pulse bg-muted rounded ${className}`}
      style={{ height, width }}
      aria-label="Chargement..."
    />
  )
}

/**
 * Spinner de chargement
 */
export function LoadingSpinner({ 
  size = 24,
  className = ''
}: {
  size?: number
  className?: string
}) {
  return (
    <div 
      className={`animate-spin rounded-full border-2 border-muted border-t-primary ${className}`}
      style={{ width: size, height: size }}
      aria-label="Chargement..."
    />
  )
}

/**
 * Message de chargement avec spinner
 */
export function LoadingMessage({ 
  message = 'Chargement...',
  showSpinner = true
}: {
  message?: string
  showSpinner?: boolean
}) {
  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      {showSpinner && <LoadingSpinner />}
      <span className="text-muted-foreground">{message}</span>
    </div>
  )
}

/**
 * Fallback pour les graphiques
 */
export function ChartFallback({ height = '300px' }: { height?: string }) {
  return (
    <div 
      className="flex items-center justify-center border border-dashed border-muted rounded-lg"
      style={{ height }}
    >
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-2 rounded bg-muted animate-pulse" />
        <p className="text-sm text-muted-foreground">Chargement du graphique...</p>
      </div>
    </div>
  )
}

/**
 * Fallback pour les tableaux
 */
export function TableFallback({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex space-x-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonLoader key={i} height="20px" width="120px" />
        ))}
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          {[...Array(4)].map((_, j) => (
            <SkeletonLoader key={j} height="40px" width="120px" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ===== EXPORTS =====
export default ClientOnly

// Types pour la documentation
export type {
    ClientOnlyProps,
    WithClientOnlyOptions
}
