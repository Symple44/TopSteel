'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

/**
 * Hook pour persister des données dans localStorage avec support SSR
 * @param key - Clé de stockage dans localStorage
 * @param initialValue - Valeur initiale si aucune donnée n'existe
 * @returns [value, setValue, removeValue] - Tuple avec la valeur, setter et fonction de suppression
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Fonction pour lire la valeur du localStorage
  const readValue = useCallback((): T => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : initialValue
    } catch (error) {
      console.warn(`Erreur lecture localStorage pour "${key}":`, error)
      return initialValue
    }
  }, [key, initialValue])

  // État local
  const [storedValue, setStoredValue] = useState<T>(initialValue)

  // Synchroniser avec localStorage au montage (côté client uniquement)
  useEffect(() => {
    setStoredValue(readValue())
  }, [readValue])

  // Écouter les changements de localStorage (depuis d'autres onglets)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue) as T)
        } catch {
          // Ignorer les erreurs de parsing
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  // Setter qui persiste dans localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore))
          // Dispatch event pour synchroniser les autres composants dans d'autres onglets
          // Use setTimeout to defer the event dispatch outside React's render cycle
          // This prevents "Cannot update a component while rendering a different component" errors
          setTimeout(() => {
            window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(valueToStore) }))
          }, 0)
        }
      } catch (error) {
        console.warn(`Erreur écriture localStorage pour "${key}":`, error)
      }
    },
    [key, storedValue]
  )

  // Fonction pour supprimer la valeur
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Erreur suppression localStorage pour "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Version avec synchronisation externe (plus performante pour les mises à jour fréquentes)
 */
export function useLocalStorageSync<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const getSnapshot = () => {
    if (typeof window === 'undefined') return JSON.stringify(initialValue)
    return window.localStorage.getItem(key) ?? JSON.stringify(initialValue)
  }

  const getServerSnapshot = () => JSON.stringify(initialValue)

  const subscribe = (callback: () => void) => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) callback()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const value = JSON.parse(snapshot) as T

  const setValue = useCallback(
    (newValue: T) => {
      window.localStorage.setItem(key, JSON.stringify(newValue))
      window.dispatchEvent(new StorageEvent('storage', { key }))
    },
    [key]
  )

  return [value, setValue]
}

export default useLocalStorage
