import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ColumnConfig } from '../../types'
import { useDataExport } from '../useDataExport'

describe('useDataExport', () => {
  const sampleData = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', active: true },
    { id: 2, name: 'Alice Smith', age: 25, email: 'alice@example.com', active: false },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com', active: true },
  ]

  const columns: ColumnConfig<(typeof sampleData)[0]>[] = [
    { id: 'id', key: 'id', title: 'ID', type: 'text', visible: true },
    { id: 'name', key: 'name', title: 'Name', type: 'text', visible: true },
    { id: 'age', key: 'age', title: 'Age', type: 'number', visible: true },
    { id: 'email', key: 'email', title: 'Email', type: 'text', visible: false }, // Not visible
    { id: 'active', key: 'active', title: 'Active', type: 'boolean', visible: true },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Export', () => {
    it('should prepare export data with visible columns only', () => {
      const { result } = renderHook(() =>
        useDataExport({
          data: sampleData,
          columns,
        })
      )

      const exportedData = result.current.prepareExportData({ visibleColumnsOnly: true })

      // Should include visible columns only
      expect(exportedData[0]).toHaveProperty('ID')
      expect(exportedData[0]).toHaveProperty('Name')
      expect(exportedData[0]).toHaveProperty('Age')
      expect(exportedData[0]).toHaveProperty('Active')
      // Should not include email column (visible: false)
      expect(exportedData[0]).not.toHaveProperty('Email')
    })

    it('should prepare export data with all columns when visibleColumnsOnly is false', () => {
      const { result } = renderHook(() =>
        useDataExport({
          data: sampleData,
          columns,
        })
      )

      const exportedData = result.current.prepareExportData({ visibleColumnsOnly: false })

      // Should include all columns
      expect(exportedData[0]).toHaveProperty('ID')
      expect(exportedData[0]).toHaveProperty('Name')
      expect(exportedData[0]).toHaveProperty('Age')
      expect(exportedData[0]).toHaveProperty('Active')
      expect(exportedData[0]).toHaveProperty('Email')
    })
  })

  describe('Selected rows export', () => {
    it('should export only selected rows', () => {
      const selectedRows = new Set([1, 3])
      const { result } = renderHook(() =>
        useDataExport({
          data: sampleData,
          columns,
          selectedRows,
        })
      )

      const exportedData = result.current.prepareExportData({ selectedRowsOnly: true })

      // Should include only 2 selected rows
      expect(exportedData).toHaveLength(2)
      expect(exportedData[0].ID).toBe(1)
      expect(exportedData[1].ID).toBe(3)
    })

    it('should export all rows when no selection', () => {
      const { result } = renderHook(() =>
        useDataExport({
          data: sampleData,
          columns,
        })
      )

      const exportedData = result.current.prepareExportData({ selectedRowsOnly: true })

      expect(exportedData).toHaveLength(3) // All rows since no selection
    })
  })

  describe('Empty data handling', () => {
    it('should handle empty data array', () => {
      const { result } = renderHook(() =>
        useDataExport({
          data: [],
          columns,
        })
      )

      const exportedData = result.current.prepareExportData()

      expect(exportedData).toEqual([])
    })

    it('should handle no visible columns', () => {
      const noVisibleColumns: ColumnConfig<(typeof sampleData)[0]>[] = [
        { id: 'id', key: 'id', title: 'ID', type: 'text', visible: false },
        { id: 'name', key: 'name', title: 'Name', type: 'text', visible: false },
      ]

      const { result } = renderHook(() =>
        useDataExport({
          data: sampleData,
          columns: noVisibleColumns,
        })
      )

      const exportedData = result.current.prepareExportData({ visibleColumnsOnly: true })

      expect(exportedData).toHaveLength(3) // Same number of rows
      expect(Object.keys(exportedData[0])).toHaveLength(0) // But no properties
    })
  })

  describe('Export state', () => {
    it('should track export state', () => {
      const { result } = renderHook(() =>
        useDataExport({
          data: sampleData,
          columns,
        })
      )

      expect(result.current.isExporting).toBe(false)
      expect(result.current.canExport).toBe(true)
      expect(result.current.exportFormats).toBeDefined()
      expect(result.current.exportFormats.length).toBeGreaterThan(0)
    })
  })
})
