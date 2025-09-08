/**
 * Utility functions for DataTable compatibility
 */

// import type { DataTableColumn } from '@erp/ui'

// Type temporaire jusqu'à ce que DataTableColumn soit disponible
interface DataTableColumn {
  key: string
  header: string
  sortable?: boolean
  searchable?: boolean
  width?: number | string
  render?: (value: unknown, row: any) => React.ReactNode
}

export interface LegacyColumn {
  key: string
  label: string
  sortable?: boolean
  searchable?: boolean
  width?: number
  render?: (value: unknown, row: any) => React.ReactNode
}

/**
 * Convert legacy column format to new DataTable format
 */
export function convertColumns(legacyColumns: LegacyColumn[]): DataTableColumn[] {
  return legacyColumns?.map((col) => ({
    key: col.key,
    accessorKey: col.key,
    header: col.label,
    sortable: col.sortable,
    cell: col.render,
  }))
}

/**
 * Simple DataTable wrapper for legacy code
 */
export interface SimpleDataTableProps {
  columns: LegacyColumn[]
  data: unknown[]
  loading?: boolean
  actions?: unknown[]
  searchable?: boolean
  selectable?: boolean
  exportable?: boolean
  pageSize?: number
}

// Export default utilities object
export const datatableUtils = {
  convertColumns,
}
