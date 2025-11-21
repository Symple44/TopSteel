import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataTable } from '../use-datatable'
import type { ColumnConfig, SelectionState } from '@erp/ui'

// Mock usePersistedTableSettings
vi.mock('@erp/ui', () => ({
  usePersistedTableSettings: vi.fn(() => ({
    settings: {
      columnOrder: [],
      columnVisibility: {},
      columnWidths: {},
      sorting: [],
      filters: [],
      pageSize: 10,
    },
    setSettings: vi.fn(),
    resetSettings: vi.fn(),
    exportSettings: vi.fn(),
    importSettings: vi.fn(),
  })),
}))

// Test data types
interface TestRow {
  id: number
  name: string
  email: string
  status: string
  age: number
}

// Mock data
const mockColumns: ColumnConfig<TestRow>[] = [
  { key: 'id', header: 'ID', type: 'number' },
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'email', header: 'Email', type: 'text' },
  { key: 'status', header: 'Status', type: 'text' },
  { key: 'age', header: 'Age', type: 'number' },
]

const mockData: TestRow[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active', age: 30 },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'active', age: 25 },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive', age: 35 },
  { id: 4, name: 'Alice Williams', email: 'alice@example.com', status: 'active', age: 28 },
]

describe('useDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.data).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.selection).toEqual({
        selectedRows: new Set(),
        selectAll: false,
      })
      expect(result.current.selectedData).toEqual([])
    })

    it('should initialize with provided data', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.data).toEqual(mockData)
      expect(result.current.data).toHaveLength(4)
    })

    it('should initialize with table ID and user ID', () => {
      const { result } = renderHook(() =>
        useDataTable({
          tableId: 'test-table',
          userId: 'user-123',
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.tableConfig.tableId).toBe('test-table')
      expect(result.current.tableConfig.userId).toBe('user-123')
    })

    it('should initialize with custom key field', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'email',
        })
      )

      expect(result.current.tableConfig.keyField).toBe('email')
    })
  })

  describe('data management', () => {
    it('should update data using setData', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.setData(mockData)
      })

      expect(result.current.data).toEqual(mockData)
      expect(result.current.data).toHaveLength(4)
    })

    it('should handle empty data', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.setData([])
      })

      expect(result.current.data).toEqual([])
      expect(result.current.selectedData).toEqual([])
    })

    it('should update loading state', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.loading).toBe(false)

      act(() => {
        result.current.setLoading(true)
      })

      expect(result.current.loading).toBe(true)

      act(() => {
        result.current.setLoading(false)
      })

      expect(result.current.loading).toBe(false)
    })
  })

  describe('cell editing', () => {
    it('should update cell value on edit', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const rowToEdit = mockData[0]
      const columnToEdit = mockColumns[1] // name column

      act(() => {
        result.current.handleCellEdit('John Updated', rowToEdit, columnToEdit)
      })

      expect(result.current.data[0].name).toBe('John Updated')
      expect(result.current.data[1].name).toBe('Jane Smith') // Other rows unchanged
    })

    it('should handle cell edit for different columns', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.handleCellEdit('inactive', mockData[0], mockColumns[3]) // status
      })

      expect(result.current.data[0].status).toBe('inactive')
    })

    it('should handle cell edit with numeric values', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.handleCellEdit(35, mockData[0], mockColumns[4]) // age
      })

      expect(result.current.data[0].age).toBe(35)
    })

    it('should not affect other rows when editing', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const originalData = [...result.current.data]

      act(() => {
        result.current.handleCellEdit('Updated Name', mockData[0], mockColumns[1])
      })

      expect(result.current.data[1]).toEqual(originalData[1])
      expect(result.current.data[2]).toEqual(originalData[2])
      expect(result.current.data[3]).toEqual(originalData[3])
    })
  })

  describe('row operations', () => {
    it('should add a new row', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const newRow: TestRow = {
        id: 5,
        name: 'New User',
        email: 'new@example.com',
        status: 'active',
        age: 40,
      }

      act(() => {
        result.current.handleRowAdd(newRow)
      })

      expect(result.current.data).toHaveLength(5)
      expect(result.current.data[4]).toEqual(newRow)
    })

    it('should delete multiple rows', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const rowsToDelete = [mockData[0], mockData[2]]

      act(() => {
        result.current.handleRowsDelete(rowsToDelete)
      })

      expect(result.current.data).toHaveLength(2)
      expect(result.current.data.find(r => r.id === 1)).toBeUndefined()
      expect(result.current.data.find(r => r.id === 3)).toBeUndefined()
      expect(result.current.data.find(r => r.id === 2)).toBeDefined()
      expect(result.current.data.find(r => r.id === 4)).toBeDefined()
    })

    it('should clear selection after deleting rows', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      // Select some rows first
      act(() => {
        result.current.toggleRowSelection(1)
        result.current.toggleRowSelection(2)
      })

      expect(result.current.selection.selectedRows.size).toBe(2)

      // Delete rows
      act(() => {
        result.current.handleRowsDelete([mockData[0]])
      })

      expect(result.current.selection.selectedRows.size).toBe(0)
      expect(result.current.selection.selectAll).toBe(false)
    })

    it('should update an existing row', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const updatedRow: TestRow = {
        ...mockData[0],
        name: 'John Updated',
        email: 'john.updated@example.com',
      }

      act(() => {
        result.current.handleRowUpdate(updatedRow)
      })

      expect(result.current.data[0]).toEqual(updatedRow)
      expect(result.current.data[0].name).toBe('John Updated')
      expect(result.current.data[0].email).toBe('john.updated@example.com')
    })

    it('should not update other rows when updating one row', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const originalData = [...result.current.data]
      const updatedRow = { ...mockData[1], name: 'Updated' }

      act(() => {
        result.current.handleRowUpdate(updatedRow)
      })

      expect(result.current.data[0]).toEqual(originalData[0])
      expect(result.current.data[2]).toEqual(originalData[2])
      expect(result.current.data[3]).toEqual(originalData[3])
    })
  })

  describe('bulk operations', () => {
    it('should update multiple selected rows', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      // Select rows 1 and 2
      act(() => {
        result.current.toggleRowSelection(1)
        result.current.toggleRowSelection(2)
      })

      // Bulk update
      act(() => {
        result.current.handleBulkUpdate({ status: 'pending' })
      })

      expect(result.current.data[0].status).toBe('pending')
      expect(result.current.data[1].status).toBe('pending')
      expect(result.current.data[2].status).toBe('inactive') // Not selected
      expect(result.current.data[3].status).toBe('active') // Not selected
    })

    it('should handle bulk update with multiple fields', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.selectAll()
      })

      act(() => {
        result.current.handleBulkUpdate({ status: 'archived', age: 99 })
      })

      result.current.data.forEach(row => {
        expect(row.status).toBe('archived')
        expect(row.age).toBe(99)
      })
    })

    it('should handle bulk update with no selection', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const originalData = [...result.current.data]

      act(() => {
        result.current.handleBulkUpdate({ status: 'updated' })
      })

      // No rows should be updated if none are selected
      expect(result.current.data).toEqual(originalData)
    })
  })

  describe('selection management', () => {
    it('should toggle row selection on', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.toggleRowSelection(1)
      })

      expect(result.current.selection.selectedRows.has(1)).toBe(true)
      expect(result.current.selection.selectedRows.size).toBe(1)
    })

    it('should toggle row selection off', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.toggleRowSelection(1)
      })

      expect(result.current.selection.selectedRows.has(1)).toBe(true)

      act(() => {
        result.current.toggleRowSelection(1)
      })

      expect(result.current.selection.selectedRows.has(1)).toBe(false)
      expect(result.current.selection.selectedRows.size).toBe(0)
    })

    it('should select multiple rows', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.toggleRowSelection(1)
        result.current.toggleRowSelection(2)
        result.current.toggleRowSelection(3)
      })

      expect(result.current.selection.selectedRows.size).toBe(3)
      expect(result.current.selection.selectedRows.has(1)).toBe(true)
      expect(result.current.selection.selectedRows.has(2)).toBe(true)
      expect(result.current.selection.selectedRows.has(3)).toBe(true)
    })

    it('should select all rows', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.selection.selectedRows.size).toBe(4)
      expect(result.current.selection.selectAll).toBe(true)
      expect(result.current.selectedData).toEqual(mockData)
    })

    it('should clear all selection', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.selection.selectedRows.size).toBe(4)

      act(() => {
        result.current.clearSelection()
      })

      expect(result.current.selection.selectedRows.size).toBe(0)
      expect(result.current.selection.selectAll).toBe(false)
      expect(result.current.selectedData).toEqual([])
    })

    it('should set selectAll to true when all rows are selected manually', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.toggleRowSelection(1)
        result.current.toggleRowSelection(2)
        result.current.toggleRowSelection(3)
      })

      expect(result.current.selection.selectAll).toBe(false)

      act(() => {
        result.current.toggleRowSelection(4)
      })

      expect(result.current.selection.selectAll).toBe(true)
    })

    it('should return selected data correctly', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.toggleRowSelection(1)
        result.current.toggleRowSelection(3)
      })

      expect(result.current.selectedData).toHaveLength(2)
      expect(result.current.selectedData).toContainEqual(mockData[0])
      expect(result.current.selectedData).toContainEqual(mockData[2])
    })
  })

  describe('table configuration', () => {
    it('should provide complete table config', () => {
      const { result } = renderHook(() =>
        useDataTable({
          tableId: 'test-table',
          userId: 'user-123',
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.tableConfig).toBeDefined()
      expect(result.current.tableConfig.data).toEqual(mockData)
      expect(result.current.tableConfig.columns).toEqual(mockColumns)
      expect(result.current.tableConfig.keyField).toBe('id')
      expect(result.current.tableConfig.tableId).toBe('test-table')
      expect(result.current.tableConfig.userId).toBe('user-123')
      expect(result.current.tableConfig.editable).toBe(true)
      expect(result.current.tableConfig.sortable).toBe(true)
      expect(result.current.tableConfig.selectable).toBe(true)
    })

    it('should have default actions configured', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.tableConfig.actions).toBeDefined()
      expect(typeof result.current.tableConfig.actions?.create).toBe('function')
      expect(typeof result.current.tableConfig.actions?.edit).toBe('function')
      expect(typeof result.current.tableConfig.actions?.delete).toBe('function')
    })

    it('should have event handlers configured', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(typeof result.current.tableConfig.onCellEdit).toBe('function')
      expect(typeof result.current.tableConfig.onSelectionChange).toBe('function')
    })
  })

  describe('edge cases', () => {
    it('should handle empty initial data', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: [],
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.data).toEqual([])
      expect(result.current.selectedData).toEqual([])
    })

    it('should handle selection with empty data', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: [],
          columns: mockColumns,
          keyField: 'id',
        })
      )

      act(() => {
        result.current.selectAll()
      })

      expect(result.current.selection.selectedRows.size).toBe(0)
      expect(result.current.selectedData).toEqual([])
    })

    it('should handle row deletion with non-existent IDs', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const nonExistentRow = { id: 999, name: 'Ghost', email: 'ghost@example.com', status: 'active', age: 0 }

      act(() => {
        result.current.handleRowsDelete([nonExistentRow])
      })

      expect(result.current.data).toEqual(mockData)
    })

    it('should handle cell edit for non-existent row', () => {
      const { result } = renderHook(() =>
        useDataTable({
          initialData: mockData,
          columns: mockColumns,
          keyField: 'id',
        })
      )

      const nonExistentRow = { id: 999, name: 'Ghost', email: 'ghost@example.com', status: 'active', age: 0 }

      act(() => {
        result.current.handleCellEdit('New Value', nonExistentRow, mockColumns[1])
      })

      expect(result.current.data).toEqual(mockData)
    })

    it('should handle string key field', () => {
      const dataWithStringKeys = [
        { email: 'a@test.com', name: 'A' },
        { email: 'b@test.com', name: 'B' },
      ]
      const columns: ColumnConfig<{ email: string; name: string }>[] = [
        { key: 'email', header: 'Email', type: 'text' },
        { key: 'name', header: 'Name', type: 'text' },
      ]

      const { result } = renderHook(() =>
        useDataTable({
          initialData: dataWithStringKeys,
          columns: columns,
          keyField: 'email',
        })
      )

      act(() => {
        result.current.toggleRowSelection('a@test.com')
      })

      expect(result.current.selection.selectedRows.has('a@test.com')).toBe(true)
    })

    it('should handle autoSave option', () => {
      const { result: resultWithAutoSave } = renderHook(() =>
        useDataTable({
          tableId: 'test-table',
          columns: mockColumns,
          keyField: 'id',
          autoSave: true,
        })
      )

      const { result: resultWithoutAutoSave } = renderHook(() =>
        useDataTable({
          tableId: 'test-table',
          columns: mockColumns,
          keyField: 'id',
          autoSave: false,
        })
      )

      expect(resultWithAutoSave.current.tableConfig).toBeDefined()
      expect(resultWithoutAutoSave.current.tableConfig).toBeDefined()
    })

    it('should handle missing tableId', () => {
      const { result } = renderHook(() =>
        useDataTable({
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.tableConfig.tableId).toBeUndefined()
    })
  })

  describe('persisted settings', () => {
    it('should provide settings from usePersistedTableSettings', () => {
      const { result } = renderHook(() =>
        useDataTable({
          tableId: 'test-table',
          userId: 'user-123',
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(result.current.settings).toBeDefined()
      expect(result.current.resetSettings).toBeDefined()
      expect(result.current.exportSettings).toBeDefined()
      expect(result.current.importSettings).toBeDefined()
    })

    it('should handle settings operations', () => {
      const { result } = renderHook(() =>
        useDataTable({
          tableId: 'test-table',
          userId: 'user-123',
          columns: mockColumns,
          keyField: 'id',
        })
      )

      expect(typeof result.current.resetSettings).toBe('function')
      expect(typeof result.current.exportSettings).toBe('function')
      expect(typeof result.current.importSettings).toBe('function')
    })
  })
})
