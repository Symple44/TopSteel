'use client'

import { useCallback, useState } from 'react'
import type { SafeObject } from '../../../../types/common'
import type { ColumnConfig } from '../types'

export interface ExportFormat {
  format: 'csv' | 'excel' | 'json' | 'pdf'
  label: string
  icon?: React.ReactNode
  available?: boolean
}

export interface ExportOptions {
  filename?: string
  includeHeaders?: boolean
  visibleColumnsOnly?: boolean
  selectedRowsOnly?: boolean
  includeStyles?: boolean
  dateFormat?: string
  numberFormat?: string
  encoding?: 'utf-8' | 'utf-16' | 'latin-1'
}

export interface UseDataExportProps<T> {
  data: T[]
  columns: ColumnConfig<T>[]
  selectedRows?: Set<string | number>
  keyField?: string | number
  exportable?: boolean
  onExport?: (format: ExportFormat['format'], options: ExportOptions) => void
}

export interface UseDataExportReturn {
  exportData: (format: ExportFormat['format'], options?: ExportOptions) => Promise<void>
  isExporting: boolean
  exportFormats: ExportFormat[]
  canExport: boolean
  prepareExportData: (options?: ExportOptions) => SafeObject[]
  downloadFile: (content: string | Blob, filename: string, mimeType: string) => void
}

/**
 * Hook pour gérer l'export des données d'une DataTable
 */
export function useDataExport<T extends SafeObject>({
  data,
  columns,
  selectedRows = new Set(),
  keyField = 'id',
  exportable = true,
  onExport,
}: UseDataExportProps<T>): UseDataExportReturn {
  const [isExporting, setIsExporting] = useState(false)

  // Formats d'export disponibles
  const exportFormats: ExportFormat[] = [
    { format: 'csv', label: 'CSV', available: true },
    { format: 'excel', label: 'Excel', available: true },
    { format: 'json', label: 'JSON', available: true },
    { format: 'pdf', label: 'PDF', available: false }, // Désactivé par défaut
  ]

  // Nettoyer les balises HTML
  const stripHtmlTags = useCallback((html: string): string => {
    if (typeof html !== 'string') return String(html)
    return html.replace(/<[^>]*>/g, '').trim()
  }, [])

  // Formater une valeur pour l'export
  const formatValue = useCallback(
    (value: unknown, column: ColumnConfig<T>): any => {
      if (value == null) return ''

      // Rich text - nettoyer le HTML
      if (column.type === 'richtext' && typeof value === 'string') {
        return stripHtmlTags(value)
      }

      // Date - formater
      if (column.type === 'date' || column.type === 'datetime') {
        if (value instanceof Date) {
          return column.type === 'datetime'
            ? value.toLocaleString('fr-FR')
            : value.toLocaleDateString('fr-FR')
        }
        return value
      }

      // Boolean - convertir en texte
      if (column.type === 'boolean') {
        return value ? 'Oui' : 'Non'
      }

      // Number - formater si nécessaire
      if (column.type === 'number' && column.format) {
        if (typeof value === 'number') {
          if (column.format.decimals !== undefined) {
            value = value.toFixed(column.format.decimals)
          }
          if (column.format.prefix) {
            value = column.format.prefix + value
          }
          if (column.format.suffix) {
            value = value + column.format.suffix
          }
        }
      }

      // Format personnalisé
      if (column.format?.transform) {
        return column.format.transform(value)
      }

      return value
    },
    [stripHtmlTags]
  )

  // Télécharger un fichier
  const downloadFile = useCallback((content: string | Blob, filename: string, mimeType: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
  }, [])

  // Préparer les données pour l'export
  const prepareExportData = useCallback(
    (options: ExportOptions = {}): unknown[] => {
      // Filtrer les colonnes
      const exportColumns = options.visibleColumnsOnly
        ? columns.filter((col) => col.visible !== false)
        : columns

      // Filtrer les lignes
      let exportRows = data
      if (options.selectedRowsOnly && selectedRows.size > 0) {
        exportRows = data.filter((row) => {
          const rowId = row[keyField]
          return typeof rowId === 'string' || typeof rowId === 'number'
            ? selectedRows.has(rowId)
            : false
        })
      }

      // Transformer les données
      return exportRows.map((row) => {
        const exportRow: Record<string, unknown> = {}

        exportColumns.forEach((column) => {
          const value = column.getValue ? column.getValue(row) : row[column.key]

          // Utiliser le titre de la colonne comme clé
          exportRow[column.title] = formatValue(value, column)
        })

        return exportRow
      })
    },
    [data, columns, selectedRows, keyField, formatValue]
  )

  // Exporter vers CSV
  const exportToCSV = useCallback(
    async (options: ExportOptions = {}) => {
      const exportData = prepareExportData(options)

      if (exportData.length === 0) {
        throw new Error('Aucune donnée à exporter')
      }

      // Obtenir les en-têtes
      const headers = Object.keys(exportData[0])

      // Créer le contenu CSV
      const csvContent: string[] = []

      // Ajouter les en-têtes si demandé
      if (options.includeHeaders !== false) {
        csvContent.push(headers.map((h) => `"${h}"`).join(','))
      }

      // Ajouter les données
      exportData.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header]
          // Échapper les guillemets et entourer de guillemets si nécessaire
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        })
        csvContent.push(values.join(','))
      })

      // Créer le fichier avec BOM UTF-8 pour Excel
      const BOM = '\uFEFF'
      const csv = BOM + csvContent.join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })

      const filename = options.filename || `export_${Date.now()}.csv`
      downloadFile(blob, filename, 'text/csv')
    },
    [prepareExportData, downloadFile]
  )

  // Exporter vers JSON
  const exportToJSON = useCallback(
    async (options: ExportOptions = {}) => {
      const exportData = prepareExportData(options)

      if (exportData.length === 0) {
        throw new Error('Aucune donnée à exporter')
      }

      const json = JSON.stringify(exportData, null, 2)
      const blob = new Blob([json], { type: 'application/json' })

      const filename = options.filename || `export_${Date.now()}.json`
      downloadFile(blob, filename, 'application/json')
    },
    [prepareExportData, downloadFile]
  )

  // Exporter vers Excel (utilise CSV pour simplifier)
  const exportToExcel = useCallback(
    async (options: ExportOptions = {}) => {
      // Pour une vraie implémentation Excel, utiliser une librairie comme SheetJS
      // Ici on utilise CSV qui s'ouvre dans Excel
      await exportToCSV({
        ...options,
        filename: options.filename || `export_${Date.now()}.xlsx`,
      })
    },
    [exportToCSV]
  )

  // Exporter vers PDF
  const exportToPDF = useCallback(async (_options: ExportOptions = {}) => {
    throw new Error('Export PDF non implémenté')
  }, [])

  // Fonction principale d'export
  const exportData = useCallback(
    async (format: ExportFormat['format'], options: ExportOptions = {}) => {
      if (!exportable) {
        throw new Error('Export désactivé')
      }

      setIsExporting(true)

      try {
        // Notifier le callback si fourni
        onExport?.(format, options)

        // Exécuter l'export selon le format
        switch (format) {
          case 'csv':
            await exportToCSV(options)
            break
          case 'excel':
            await exportToExcel(options)
            break
          case 'json':
            await exportToJSON(options)
            break
          case 'pdf':
            await exportToPDF(options)
            break
          default:
            throw new Error(`Format d'export non supporté: ${format}`)
        }
      } finally {
        setIsExporting(false)
      }
    },
    [exportable, onExport, exportToCSV, exportToExcel, exportToJSON, exportToPDF]
  )

  // Vérifier si l'export est possible
  const canExport = exportable && data.length > 0 && !isExporting

  return {
    exportData,
    isExporting,
    exportFormats,
    canExport,
    prepareExportData,
    downloadFile,
  }
}
