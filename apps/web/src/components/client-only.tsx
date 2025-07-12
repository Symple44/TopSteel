/**
 * 🔒 CLIENT-ONLY COMPONENT ENHANCED - TopSteel ERP
 * Composants et utilitaires pour éviter les erreurs SSR/hydratation
 * Fichier: apps/web/src/components/client-only.tsx
 */

'use client'

import { type ComponentType, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

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
  /**
   * Callback appelé pendant l'hydratation
   */
  onHydrating?: () => void
  /**
   * Force le remontage si les enfants changent
   */
  remountOnChange?: boolean
}

interface WithClientOnlyOptions {
  fallback?: ComponentType
  displayName?: string
  forceRemount?: boolean
}

interface SafeComponentProps<T extends Record<string, unknown> = Record<string, unknown>> {
  isClient?: boolean
  isHydrated?: boolean
}

// ===== ÉTAT GLOBAL D'HYDRATATION =====

/**
 * État global pour éviter les re-calculs d'hydratation
 */
class HydrationManager {
  private static instance: HydrationManager
  private _isHydrated = false
  private _isClient = false
  private _hydrationPromise: Promise<void> | null = null
  private _listeners = new Set<() => void>()

  static getInstance(): HydrationManager {
    if (!HydrationManager.instance) {
      HydrationManager.instance = new HydrationManager()
    }

    return HydrationManager.instance
  }

  private constructor() {
    if (typeof window !== 'undefined') {
      this._isClient = true
      this._hydrationPromise = new Promise<void>((resolve) => {
        if (document.readyState === 'loading') {
          const onReady = () => {
            this._isHydrated = true
            this._notifyListeners()
            resolve()
            document.removeEventListener('DOMContentLoaded', onReady)
          }

          document.addEventListener('DOMContentLoaded', onReady)
        } else {
          // DOM déjà prêt
          setTimeout(() => {
            this._isHydrated = true
            this._notifyListeners()
            resolve()
          }, 0)
        }
      })
    } else {
      this._hydrationPromise = Promise.resolve()
    }
  }

  private _notifyListeners() {
    this._listeners.forEach((listener) => {
      try {
        listener()
      } catch (error) {
        console.error('Erreur dans listener hydratation:', error)
      }
    })
  }

  get isClient(): boolean {
    return this._isClient
  }

  get isHydrated(): boolean {
    return this._isHydrated
  }

  addListener(listener: () => void): () => void {
    this._listeners.add(listener)

    return () => this._listeners.delete(listener)
  }

  waitForHydration(): Promise<void> {
    return this._hydrationPromise || Promise.resolve()
  }
}

const hydrationManager = HydrationManager.getInstance()

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
  onMount,
  onHydrating,
  remountOnChange = false,
}: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [showFallback, setShowFallback] = useState(fallbackDelay > 0)
  const [isHydrating, setIsHydrating] = useState(false)
  const mountedRef = useRef(false)
  const childrenKeyRef = useRef<string>('')

  // Générer une clé pour les enfants si remountOnChange est activé
  const childrenKey = remountOnChange ? JSON.stringify(children) : ''

  const handleMount = useCallback(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    setIsHydrating(true)
    onHydrating?.()

    hydrationManager
      .waitForHydration()
      .then(() => {
        setHasMounted(true)
        setIsHydrating(false)
        onMount?.()
      })
      .catch((error) => {
        console.error("Erreur pendant l'hydratation:", error)
        setHasMounted(true)
        setIsHydrating(false)
      })
  }, [onMount, onHydrating])

  // Gérer le délai du fallback
  useEffect(() => {
    if (fallbackDelay > 0) {
      const timer = setTimeout(() => {
        setShowFallback(false)
      }, fallbackDelay)

      return () => clearTimeout(timer)
    }

    return undefined
  }, [fallbackDelay])

  // Déclencher le montage
  useEffect(() => {
    handleMount()
  }, [handleMount])

  // Gérer le remontage si les enfants changent
  useEffect(() => {
    if (remountOnChange && childrenKey !== childrenKeyRef.current) {
      childrenKeyRef.current = childrenKey
      if (mountedRef.current) {
        mountedRef.current = false
        setHasMounted(false)
        handleMount()
      }
    }
  }, [childrenKey, remountOnChange, handleMount])

  // Listener pour l'hydratation globale
  useEffect(() => {
    const removeListener = hydrationManager.addListener(() => {
      if (!hasMounted) {
        setHasMounted(true)
        setIsHydrating(false)
      }
    })

    return removeListener
  }, [hasMounted])

  // États de rendu
  const isClient = hydrationManager.isClient
  const shouldShowFallback = !isClient || !hasMounted || showFallback || isHydrating

  if (shouldShowFallback) {
    return (
      <div
        className={className}
        data-client-only="loading"
        data-hydrating={isHydrating}
        suppressHydrationWarning
      >
        {fallback}
      </div>
    )
  }

  return (
    <div
      className={className}
      data-client-only="mounted"
      data-hydrated="true"
      suppressHydrationWarning
    >
      {children}
    </div>
  )
}

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour détecter si on est côté client
 */
export function useIsClient(): boolean {
  const [isClient, setIsClient] = useState(hydrationManager.isClient)

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
  const isClient = useIsClient()

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      setWindowObj(window)
    }
  }, [isClient])

  return windowObj
}

/**
 * Hook pour détecter si l'hydratation est terminée
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(hydrationManager.isHydrated)

  useEffect(() => {
    if (hydrationManager.isHydrated) {
      setHydrated(true)

      return
    }

    const removeListener = hydrationManager.addListener(() => {
      setHydrated(true)
    })

    return removeListener
  }, [])

  return hydrated
}

/**
 * Hook pour détecter l'état d'hydratation complet
 */
export function useHydrationState(): {
  isClient: boolean
  isHydrated: boolean
  isHydrating: boolean
} {
  const [state, setState] = useState({
    isClient: hydrationManager.isClient,
    isHydrated: hydrationManager.isHydrated,
    isHydrating: hydrationManager.isClient && !hydrationManager.isHydrated,
  })

  useEffect(() => {
    if (hydrationManager.isHydrated) {
      setState({
        isClient: true,
        isHydrated: true,
        isHydrating: false,
      })

      return
    }

    setState((prev) => ({
      ...prev,
      isClient: true,
      isHydrating: true,
    }))

    const removeListener = hydrationManager.addListener(() => {
      setState({
        isClient: true,
        isHydrated: true,
        isHydrating: false,
      })
    })

    return removeListener
  }, [])

  return state
}

/**
 * Hook pour accéder aux APIs browser de manière sécurisée
 */
export function useBrowserAPI<T>(getter: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback)
  const isClient = useIsClient()

  useEffect(() => {
    if (isClient) {
      try {
        setValue(getter())
      } catch (error) {
        console.error('Erreur accès API browser:', error)
        setValue(fallback)
      }
    }
  }, [isClient, getter, fallback])

  return value
}

// ===== COMPOSANT SAFE =====

/**
 * Composant wrapper pour rendre n'importe quel composant safe côté client
 */
export function SafeComponent<T extends Record<string, unknown>>({
  component: Component,
  fallback,
  ...props
}: {
  component: ComponentType<T>
  fallback?: ReactNode
} & T) {
  return (
    <ClientOnly fallback={fallback}>
      <Component {...(props as unknown as T)} />
    </ClientOnly>
  )
}

// ===== HOC AVEC CLIENT-ONLY =====

/**
 * HOC pour wrapper automatiquement un composant avec ClientOnly
 */
export function withClientOnly<P extends Record<string, unknown>>(
  Component: ComponentType<P>,
  options: WithClientOnlyOptions = {}
): ComponentType<P & { clientOnlyFallback?: ReactNode }> {
  const { fallback: FallbackComponent, displayName, forceRemount } = options

  const WrappedComponent = (props: P & { clientOnlyFallback?: ReactNode }) => {
    const { clientOnlyFallback, ...componentProps } = props

    const fallbackElement = clientOnlyFallback || (FallbackComponent ? <FallbackComponent /> : null)

    return (
      <ClientOnly fallback={fallbackElement} remountOnChange={forceRemount}>
        <Component {...(componentProps as P)} />
      </ClientOnly>
    )
  }

  WrappedComponent.displayName =
    displayName || `withClientOnly(${Component.displayName || Component.name || 'Component'})`

  return WrappedComponent
}

// ===== COMPOSANT NO-SSR (ALIAS) =====

/**
 * Alias pour ClientOnly avec un nom plus explicite
 */
export const NoSSR = ClientOnly

/**
 * Composant pour empêcher le SSR sur une partie spécifique
 */
export function ServerSideRenderingBlocker({ children }: { children: ReactNode }) {
  return (
    <ClientOnly
      fallback={
        <div className="ssr-blocked" style={{ display: 'none' }} suppressHydrationWarning />
      }
    >
      {children}
    </ClientOnly>
  )
}

// ===== UTILITAIRES DE DEBUG =====

/**
 * Composant de debug pour visualiser l'état d'hydratation
 */
export function HydrationDebugger({ showInProduction = false }: { showInProduction?: boolean }) {
  const { isClient, isHydrated, isHydrating } = useHydrationState()

  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs font-mono z-50"
      style={{
        backgroundColor: isHydrated ? 'green' : isHydrating ? 'orange' : 'red',
        color: 'white',
      }}
    >
      <div>Client: {isClient ? '✓' : '✗'}</div>
      <div>Hydrated: {isHydrated ? '✓' : '✗'}</div>
      <div>Hydrating: {isHydrating ? '✓' : '✗'}</div>
    </div>
  )
}

// ===== EXPORTS =====

export { hydrationManager, HydrationManager }

export type { ClientOnlyProps, SafeComponentProps, WithClientOnlyOptions }
