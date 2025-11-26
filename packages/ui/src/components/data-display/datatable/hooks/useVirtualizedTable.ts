'use client'

import { useVirtualizer, type Virtualizer } from '@tanstack/react-virtual'
import { useCallback, useMemo, useRef } from 'react'

/**
 * Configuration pour la virtualisation des tables
 */
export interface UseVirtualizedTableOptions<T> {
  /** Donnees a virtualiser */
  data: T[]
  /** Hauteur estimee d'une ligne en pixels (defaut: 48) */
  estimatedRowHeight?: number
  /** Nombre de lignes a pre-rendre au-dessus/en-dessous de la zone visible (defaut: 5) */
  overscan?: number
  /** Seuil de lignes pour activer la virtualisation automatique (defaut: 100) */
  virtualizeThreshold?: number
  /** Forcer la virtualisation (ignore le seuil) */
  forceVirtualize?: boolean
  /** Activer le mode debug */
  debug?: boolean
}

/**
 * Retour du hook useVirtualizedTable
 */
export interface UseVirtualizedTableReturn<T> {
  /** Reference du conteneur scrollable */
  containerRef: React.RefObject<HTMLDivElement | null>
  /** Indique si la virtualisation est active */
  isVirtualized: boolean
  /** Lignes virtuelles a rendre */
  virtualRows: Array<{
    index: number
    start: number
    size: number
    data: T
  }>
  /** Hauteur totale du contenu virtuel */
  totalHeight: number
  /** Espace avant les lignes visibles */
  paddingTop: number
  /** Espace apres les lignes visibles */
  paddingBottom: number
  /** Nombre total de lignes */
  totalRows: number
  /** Fonction pour mesurer une ligne apres rendu */
  measureRow: (index: number, element: HTMLElement | null) => void
  /** Scroll vers un index specifique */
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' }) => void
  /** Instance du virtualizer pour controle avance */
  virtualizer: Virtualizer<HTMLDivElement, Element> | null
}

/**
 * Hook pour virtualiser une table avec @tanstack/react-virtual
 * Optimise pour les grandes tables (50k+ lignes)
 *
 * @example
 * ```tsx
 * const { containerRef, virtualRows, paddingTop, paddingBottom, isVirtualized } = useVirtualizedTable({
 *   data: myLargeDataset,
 *   estimatedRowHeight: 48,
 *   virtualizeThreshold: 100,
 * })
 *
 * return (
 *   <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
 *     <table>
 *       <tbody>
 *         {paddingTop > 0 && <tr style={{ height: paddingTop }} />}
 *         {virtualRows.map((row) => (
 *           <tr key={row.index}>...</tr>
 *         ))}
 *         {paddingBottom > 0 && <tr style={{ height: paddingBottom }} />}
 *       </tbody>
 *     </table>
 *   </div>
 * )
 * ```
 */
export function useVirtualizedTable<T>({
  data,
  estimatedRowHeight = 48,
  overscan = 5,
  virtualizeThreshold = 100,
  forceVirtualize = false,
  debug = false,
}: UseVirtualizedTableOptions<T>): UseVirtualizedTableReturn<T> {
  const containerRef = useRef<HTMLDivElement>(null)

  // Determiner si on doit virtualiser
  const shouldVirtualize = forceVirtualize || data.length >= virtualizeThreshold

  // Configuration du virtualizer
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
    // Mesure dynamique pour gerer les hauteurs variables
    measureElement:
      typeof window !== 'undefined'
        ? (element) => element?.getBoundingClientRect().height ?? estimatedRowHeight
        : undefined,
    debug,
  })

  // Lignes virtuelles avec donnees
  const virtualRows = useMemo(() => {
    if (!shouldVirtualize) {
      // Mode non-virtualise: retourner toutes les lignes
      return data.map((item, index) => ({
        index,
        start: index * estimatedRowHeight,
        size: estimatedRowHeight,
        data: item,
      }))
    }

    return virtualizer.getVirtualItems().map((virtualRow) => ({
      index: virtualRow.index,
      start: virtualRow.start,
      size: virtualRow.size,
      data: data[virtualRow.index],
    }))
  }, [shouldVirtualize, virtualizer, data, estimatedRowHeight])

  // Calcul des espacements pour le rendu virtuel
  const { paddingTop, paddingBottom } = useMemo(() => {
    if (!shouldVirtualize || virtualRows.length === 0) {
      return { paddingTop: 0, paddingBottom: 0 }
    }

    const items = virtualizer.getVirtualItems()
    if (items.length === 0) {
      return { paddingTop: 0, paddingBottom: 0 }
    }

    return {
      paddingTop: items[0]?.start ?? 0,
      paddingBottom: virtualizer.getTotalSize() - (items[items.length - 1]?.end ?? 0),
    }
  }, [shouldVirtualize, virtualRows, virtualizer])

  // Fonction pour mesurer une ligne
  const measureRow = useCallback(
    (_index: number, element: HTMLElement | null) => {
      if (shouldVirtualize && element) {
        virtualizer.measureElement(element)
      }
    },
    [shouldVirtualize, virtualizer]
  )

  // Fonction pour scroller vers un index
  const scrollToIndex = useCallback(
    (index: number, options?: { align?: 'start' | 'center' | 'end' }) => {
      if (shouldVirtualize) {
        virtualizer.scrollToIndex(index, options)
      } else {
        // Mode non-virtualise: scroll natif
        const container = containerRef.current
        if (container) {
          const rowPosition = index * estimatedRowHeight
          container.scrollTop = rowPosition
        }
      }
    },
    [shouldVirtualize, virtualizer, estimatedRowHeight]
  )

  return {
    containerRef,
    isVirtualized: shouldVirtualize,
    virtualRows,
    totalHeight: shouldVirtualize ? virtualizer.getTotalSize() : data.length * estimatedRowHeight,
    paddingTop,
    paddingBottom,
    totalRows: data.length,
    measureRow,
    scrollToIndex,
    virtualizer: shouldVirtualize ? virtualizer : null,
  }
}

/**
 * Constantes par defaut pour la virtualisation
 */
export const VIRTUAL_TABLE_DEFAULTS = {
  /** Hauteur de ligne par defaut */
  ROW_HEIGHT: 48,
  /** Nombre de lignes pour le overscan */
  OVERSCAN: 5,
  /** Seuil pour activer la virtualisation */
  THRESHOLD: 100,
  /** Hauteur minimale recommandee du conteneur */
  MIN_CONTAINER_HEIGHT: 400,
} as const
