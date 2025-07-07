/**
 * 🔒 CLIENT-ONLY COMPONENT - TopSteel ERP
 * Composant pour éviter les erreurs SSR/hydratation
 * Fichier: apps/web/src/components/client-only.tsx
 */

'use client'

import { useEffect, useState, type ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Composant qui rend ses enfants uniquement côté client
 * Évite les erreurs d'hydratation pour les composants utilisant des APIs browser
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * Hook pour détecter si on est côté client
 */
export function useIsClient() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

/**
 * Hook pour accéder à window de manière sécurisée
 */
export function useWindow() {
  const [windowObj, setWindowObj] = useState<Window | null>(null)

  useEffect(() => {
    setWindowObj(window)
  }, [])

  return windowObj
}

export default ClientOnly