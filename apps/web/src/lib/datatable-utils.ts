/**
 * Utility functions for DataTable compatibility
 */

import type { DataTableColumn } from '@erp/ui'

export interface LegacyColumn {
  key: string
  label: string
  sortable?: boolean
  searchable?: boolean
  width?: number
  render?: (value: any, row: any) => React.ReactNode
}

/**
 * Convert legacy column format to new DataTable format
 */
export function convertColumns(legacyColumns: LegacyColumn[]): DataTableColumn[] {
  return legacyColumns.map((col) => ({
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
  data: any[]
  loading?: boolean
  actions?: any[]
  searchable?: boolean
  selectable?: boolean
  exportable?: boolean
  pageSize?: number
}
