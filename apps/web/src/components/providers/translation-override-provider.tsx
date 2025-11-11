'use client'

import { useEffect, useState } from 'react'
import { translator } from '../../lib/i18n/translator'

interface TranslationOverrideProviderProps {
  children: React.ReactNode
}

/**
 * Provider qui charge les overrides de traduction au démarrage de l'application
 * Doit être placé au plus haut niveau de l'application, après le I18nProvider
 */
export function TranslationOverrideProvider({ children }: TranslationOverrideProviderProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadOverrides = async () => {
      try {
        // Loading translation overrides
        await translator?.loadOverrides()

        if (mounted) {
          // Translation overrides loaded
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load translations')
          setIsLoading(false)
        }
      }
    }

    loadOverrides()

    // Écouter les événements de mise à jour des traductions
    const handleTranslationUpdate = () => {
      // Translation update received
      translator?.refreshOverrides().catch(() => {
        // Translation refresh error (silenced)
      })
    }

    window.addEventListener('translation-updated', handleTranslationUpdate)

    return () => {
      mounted = false
      window.removeEventListener('translation-updated', handleTranslationUpdate)
    }
  }, [])

  // Afficher un loader discret pendant le chargement initial
  if (isLoading) {
    return (
      <>
        {children}
        {/* Indicateur de chargement discret en bas à droite */}
        <div className="fixed bottom-4 right-4 z-50 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
          Chargement des traductions...
        </div>
      </>
    )
  }

  // En cas d'erreur, afficher l'app normalement (utiliser les traductions de base)
  if (error) {
  }

  return <>{children}</>
}

/**
 * Hook pour déclencher un rechargement des traductions
 */
export function useRefreshTranslations() {
  const refresh = async () => {
    await translator?.refreshOverrides()
    // Déclencher un événement pour notifier d'autres composants
    window.dispatchEvent(new Event('translation-updated'))
  }

  return refresh
}
