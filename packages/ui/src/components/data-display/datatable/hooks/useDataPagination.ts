'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PaginationConfig } from '../types'

export interface UseDataPaginationProps<T> {
  data: T[]
  pagination?: boolean | PaginationConfig
  onPaginationChange?: (config: PaginationConfig) => void
  defaultPageSize?: number
  defaultPage?: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  pageSize: number
  totalItems: number
  startIndex: number
  endIndex: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface UseDataPaginationReturn<T> {
  paginatedData: T[]
  paginationInfo: PaginationInfo | null
  currentPage: number
  pageSize: number
  totalPages: number
  setCurrentPage: (page: number) => void
  setPageSize: (size: number) => void
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  firstPage: () => void
  lastPage: () => void
  canGoNext: boolean
  canGoPrev: boolean
  isFirstPage: boolean
  isLastPage: boolean
  getPageNumbers: (maxVisible?: number) => number[]
}

/**
 * Hook pour gérer la pagination des données d'une DataTable
 */
export function useDataPagination<T>({
  data,
  pagination = false,
  onPaginationChange,
  defaultPageSize = 10,
  defaultPage = 1,
}: UseDataPaginationProps<T>): UseDataPaginationReturn<T> {
  // Déterminer si la pagination est activée et obtenir la config
  const isPaginationEnabled = pagination !== false
  const paginationConfig = typeof pagination === 'object' ? pagination : null

  // État de la pagination
  const [internalCurrentPage, setInternalCurrentPage] = useState(
    paginationConfig?.page || defaultPage
  )
  const [internalPageSize, setInternalPageSize] = useState(
    paginationConfig?.pageSize || defaultPageSize
  )

  // Utiliser les props si disponibles, sinon l'état interne
  const currentPage = paginationConfig?.page || internalCurrentPage
  const pageSize = paginationConfig?.pageSize || internalPageSize

  // Calculer le nombre total de pages
  const totalPages = useMemo(() => {
    if (!isPaginationEnabled || data.length === 0) return 1
    return Math.ceil(data.length / pageSize)
  }, [isPaginationEnabled, data.length, pageSize])

  // Fonction pour changer de page
  const handlePageChange = useCallback(
    (page: number) => {
      const validPage = Math.max(1, Math.min(page, totalPages))

      if (paginationConfig?.page !== undefined && onPaginationChange) {
        // Si contrôlé par le parent, notifier le parent
        onPaginationChange({
          page: validPage,
          pageSize,
          total: data.length,
        })
      } else {
        // Sinon utiliser l'état interne
        setInternalCurrentPage(validPage)
      }
    },
    [paginationConfig?.page, onPaginationChange, pageSize, data.length, totalPages]
  )

  // Fonction pour changer la taille de page
  const handlePageSizeChange = useCallback(
    (size: number) => {
      const validSize = Math.max(1, size)

      // Calculer la nouvelle page pour maintenir la position approximative
      const currentStartIndex = (currentPage - 1) * pageSize
      const newPage = Math.floor(currentStartIndex / validSize) + 1

      if (paginationConfig && onPaginationChange) {
        onPaginationChange({
          page: newPage,
          pageSize: validSize,
          total: data.length,
        })
      } else {
        setInternalPageSize(validSize)
        setInternalCurrentPage(newPage)
      }
    },
    [currentPage, pageSize, paginationConfig, onPaginationChange, data.length]
  )

  // Navigation
  const goToPage = handlePageChange
  const setCurrentPage = handlePageChange
  const setPageSize = handlePageSizeChange

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const firstPage = useCallback(() => {
    goToPage(1)
  }, [goToPage])

  const lastPage = useCallback(() => {
    goToPage(totalPages)
  }, [totalPages, goToPage])

  // États de navigation
  const canGoNext = currentPage < totalPages
  const canGoPrev = currentPage > 1
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  // Synchroniser l'état interne avec les props quand elles changent
  useEffect(() => {
    if (paginationConfig?.page !== undefined) {
      setInternalCurrentPage(paginationConfig.page)
    }
    if (paginationConfig?.pageSize !== undefined) {
      setInternalPageSize(paginationConfig.pageSize)
    }
  }, [paginationConfig?.page, paginationConfig?.pageSize])

  // Réinitialiser la page si elle dépasse le nombre total de pages
  useEffect(() => {
    if (isPaginationEnabled && currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [isPaginationEnabled, currentPage, totalPages, setCurrentPage])

  // Calculer les données paginées
  const paginatedData = useMemo(() => {
    if (!isPaginationEnabled) return data

    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    return data.slice(startIndex, endIndex)
  }, [data, isPaginationEnabled, currentPage, pageSize])

  // Calculer les informations de pagination
  const paginationInfo = useMemo((): PaginationInfo | null => {
    if (!isPaginationEnabled) return null

    const totalItems = data.length
    const startIndex = Math.min((currentPage - 1) * pageSize, totalItems)
    const endIndex = Math.min(currentPage * pageSize, totalItems)

    return {
      currentPage,
      totalPages,
      pageSize,
      totalItems,
      startIndex: startIndex + 1, // Pour affichage (base 1)
      endIndex,
      hasNextPage: canGoNext,
      hasPrevPage: canGoPrev,
    }
  }, [isPaginationEnabled, data.length, currentPage, totalPages, pageSize, canGoNext, canGoPrev])

  // Générer les numéros de page pour l'affichage
  const getPageNumbers = useCallback(
    (maxVisible: number = 7): number[] => {
      if (totalPages <= maxVisible) {
        // Si toutes les pages peuvent être affichées
        return Array.from({ length: totalPages }, (_, i) => i + 1)
      }

      const pages: number[] = []
      const halfVisible = Math.floor(maxVisible / 2)

      // Toujours inclure la première page
      pages.push(1)

      // Calculer la plage autour de la page courante
      let start = Math.max(2, currentPage - halfVisible)
      let end = Math.min(totalPages - 1, currentPage + halfVisible)

      // Ajuster si on est près du début ou de la fin
      if (currentPage <= halfVisible + 1) {
        end = Math.min(maxVisible - 1, totalPages - 1)
      } else if (currentPage >= totalPages - halfVisible) {
        start = Math.max(2, totalPages - maxVisible + 2)
      }

      // Ajouter les ellipses et les pages
      if (start > 2) {
        pages.push(-1) // -1 représente les ellipses
      }

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (end < totalPages - 1) {
        pages.push(-1) // -1 représente les ellipses
      }

      // Toujours inclure la dernière page
      if (totalPages > 1) {
        pages.push(totalPages)
      }

      return pages
    },
    [currentPage, totalPages]
  )

  return {
    paginatedData,
    paginationInfo,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    canGoNext,
    canGoPrev,
    isFirstPage,
    isLastPage,
    getPageNumbers,
  }
}
