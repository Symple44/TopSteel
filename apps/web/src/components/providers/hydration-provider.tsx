// apps/web/src/components/providers/hydration-provider.tsx
'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useProjetStore } from '@/stores/projet.store'
import { useUIStore } from '@/stores/ui.store'
import { useEffect, useState } from 'react'

interface HydrationProviderProps {
  children: React.ReactNode
}

/**
 * Provider pour gérer l'hydratation des stores Zustand de manière SSR-safe
 * ✅ Évite les erreurs "getServerSnapshot should be cached"
 */
export function HydrationProvider({ children }: HydrationProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // ✅ Hydrater tous les stores avec persistance après le mount
    const hydrationPromises = [
      // Hydrater le store auth
      useAuthStore.persist?.rehydrate(),
      // Hydrater le store projets  
      useProjetStore.persist?.rehydrate(),
      // Hydrater le store UI
      useUIStore.persist?.rehydrate(),
    ].filter(Boolean)

    Promise.all(hydrationPromises)
      .then(() => {
        setIsHydrated(true)
      })
      .catch((error) => {
        console.warn('Erreur hydratation stores:', error)
        setIsHydrated(true) // Continue même en cas d'erreur
      })
  }, [])

  // ✅ Afficher un loader pendant l'hydratation pour éviter les flashes
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-gray-600">Initialisation...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// apps/web/src/app/layout.tsx - AJOUTER DANS LE LAYOUT PRINCIPAL
/*
import { HydrationProvider } from '@/components/providers/hydration-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        <HydrationProvider>
          {children}
        </HydrationProvider>
      </body>
    </html>
  )
}
*/