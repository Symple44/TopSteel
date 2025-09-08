'use client'

import { useCallback, useEffect, useState } from 'react'
import { callClientApi } from '@/utils/backend-api'

export interface PageItem {
  id: string
  title: string
  href: string
  description?: string
  icon?: string
  category: string
  subcategory?: string
  tags?: string[]
  permissions?: string[]
  roles?: string[]
  moduleId?: string
  isEnabled: boolean
  isVisible: boolean
}

export interface PageCategory {
  id: string
  title: string
  description?: string
  icon?: string
  pages: PageItem[]
  subcategories?: PageSubcategory[]
}

export interface PageSubcategory {
  id: string
  title: string
  description?: string
  icon?: string
  pages: PageItem[]
}

// Les pages sont maintenant chargées dynamiquement depuis l'API

export function useAvailablePages() {
  const [categories, setCategories] = useState<PageCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAvailablePages = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Appel API pour récupérer les pages disponibles
      const response = await callClientApi('user/menu-preferences/available-pages')

      if (!response?.ok) {
        throw new Error(`HTTP ${response?.status}: ${response?.statusText}`)
      }

      const data = await response?.json()

      if (data?.success) {
        setCategories(data?.data)
      } else {
        throw new Error(data?.error || 'Erreur lors du chargement des pages')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  const getAllPages = useCallback((): PageItem[] => {
    return categories?.flatMap((category) => category?.pages)
  }, [categories])

  const getPagesByCategory = useCallback(
    (categoryId: string): PageItem[] => {
      const category = categories?.find((cat) => cat.id === categoryId)
      return category?.pages || []
    },
    [categories]
  )

  const searchPages = useCallback(
    (query: string): PageItem[] => {
      const lowerQuery = query?.toLowerCase()
      return getAllPages().filter(
        (page) =>
          page?.title?.toLowerCase().includes(lowerQuery) ||
          page.description?.toLowerCase().includes(lowerQuery) ||
          page.tags?.some((tag) => tag?.toLowerCase().includes(lowerQuery))
      )
    },
    [getAllPages]
  )

  const getPageById = useCallback(
    (pageId: string): PageItem | undefined => {
      return getAllPages().find((page) => page.id === pageId)
    },
    [getAllPages]
  )

  useEffect(() => {
    loadAvailablePages()
  }, [loadAvailablePages])

  return {
    categories,
    loading,
    error,
    getAllPages,
    getPagesByCategory,
    searchPages,
    getPageById,
    refreshPages: loadAvailablePages,
  }
}
