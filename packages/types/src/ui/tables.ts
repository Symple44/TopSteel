import type { ReactNode } from 'react'
export interface TableColumn<T = any> {
  key: keyof T | string
  header: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (value: any, row: T) => ReactNode
}

export interface TableProps<T = any> {
  data: T[]
  columns: TableColumn<T>[]
  loading?: boolean
  pagination?: boolean
  searchable?: boolean
  exportable?: boolean
  selectable?: boolean
  onRowSelect?: (row: T) => void
  onMultiSelect?: (rows: T[]) => void
}