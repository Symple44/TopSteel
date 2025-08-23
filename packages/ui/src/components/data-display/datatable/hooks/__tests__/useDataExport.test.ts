import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDataExport } from '../useDataExport'
import type { ColumnConfig } from '../../types'

// Mock DOM APIs
const mockCreateElement = vi.fn()
const mockClick = vi.fn()
const mockRemove = vi.fn()
const mockAppendChild = vi.fn()

describe('useDataExport', () => {
  const sampleData = [
    { id: 1, name: 'John Doe', age: 30, email: 'john@example.com', active: true },
    { id: 2, name: 'Alice Smith', age: 25, email: 'alice@example.com', active: false },
    { id: 3, name: 'Bob Johnson', age: 35, email: 'bob@example.com', active: true },
  ]

  const columns: ColumnConfig<typeof sampleData[0]>[] = [
    { key: 'id', header: 'ID', exportable: true },
    { key: 'name', header: 'Name', exportable: true },
    { key: 'age', header: 'Age', exportable: true },
    { key: 'email', header: 'Email', exportable: false }, // Not exportable
    { key: 'active', header: 'Active', exportable: true },
  ]

  beforeEach(() => {
    // Mock document methods
    const mockElement = {
      click: mockClick,
      remove: mockRemove,
      setAttribute: vi.fn(),
      href: '',
      download: '',
      style: {}
    }
    
    mockCreateElement.mockReturnValue(mockElement)
    
    // Mock document.body if it doesn't exist
    if (!document.body) {
      document.body = document.createElement('body')
    }
    
    document.createElement = mockCreateElement
    document.body.appendChild = mockAppendChild
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('CSV Export', () => {
    it('should export data to CSV', async () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      await act(async () => {
        await result.current.exportToCSV('test-export.csv')
      })

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()
      expect(URL.createObjectURL).toHaveBeenCalled()
    })

    it('should only export exportable columns', async () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      const csvContent = result.current.generateCSV()
      
      // Should include headers for exportable columns only
      expect(csvContent).toContain('ID,Name,Age,Active')
      // Should not include email column
      expect(csvContent).not.toContain('Email')
      expect(csvContent).not.toContain('john@example.com')
    })

    it('should handle special characters in CSV', async () => {
      const dataWithSpecialChars = [
        { id: 1, name: 'John, Doe', description: 'Line 1\nLine 2' },
        { id: 2, name: '"Alice"', description: 'Test "quote"' },
      ]

      const specialColumns: ColumnConfig<typeof dataWithSpecialChars[0]>[] = [
        { key: 'name', header: 'Name', exportable: true },
        { key: 'description', header: 'Description', exportable: true },
      ]

      const { result } = renderHook(() => 
        useDataExport(dataWithSpecialChars, specialColumns)
      )

      const csvContent = result.current.generateCSV()
      
      // Values with commas and quotes should be escaped
      expect(csvContent).toContain('"John, Doe"')
      expect(csvContent).toContain('"""Alice"""')
      expect(csvContent).toContain('"Line 1\nLine 2"')
    })

    it('should use custom delimiter', async () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      const csvContent = result.current.generateCSV({ delimiter: ';' })
      
      expect(csvContent).toContain('ID;Name;Age;Active')
      expect(csvContent).toContain('1;John Doe;30;true')
    })
  })

  describe('JSON Export', () => {
    it('should export data to JSON', async () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      await act(async () => {
        await result.current.exportToJSON('test-export.json')
      })

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()
      expect(URL.createObjectURL).toHaveBeenCalled()
    })

    it('should generate valid JSON', () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      const jsonContent = result.current.generateJSON()
      const parsed = JSON.parse(jsonContent)
      
      expect(parsed).toHaveLength(3)
      expect(parsed[0]).toEqual({
        id: 1,
        name: 'John Doe',
        age: 30,
        active: true,
      })
      // Email should not be included (not exportable)
      expect(parsed[0].email).toBeUndefined()
    })

    it('should format JSON with indentation', () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      const jsonContent = result.current.generateJSON({ pretty: true })
      
      // Check for indentation
      expect(jsonContent).toContain('  ')
      expect(jsonContent).toMatch(/^\[[\s\S]*\]$/m)
    })
  })

  describe('Excel Export', () => {
    it('should export data to Excel', async () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      await act(async () => {
        await result.current.exportToExcel('test-export.xlsx')
      })

      expect(mockCreateElement).toHaveBeenCalledWith('a')
      expect(mockClick).toHaveBeenCalled()
    })

    it('should generate Excel-compatible HTML table', () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      const excelContent = result.current.generateExcelHTML()
      
      // Should contain table structure
      expect(excelContent).toContain('<table')
      expect(excelContent).toContain('<thead')
      expect(excelContent).toContain('<tbody')
      expect(excelContent).toContain('<tr')
      expect(excelContent).toContain('<th')
      expect(excelContent).toContain('<td')
      
      // Should contain headers
      expect(excelContent).toContain('ID')
      expect(excelContent).toContain('Name')
      expect(excelContent).toContain('Age')
      expect(excelContent).toContain('Active')
      
      // Should not contain non-exportable columns
      expect(excelContent).not.toContain('Email')
      expect(excelContent).not.toContain('john@example.com')
    })
  })

  describe('Selected rows export', () => {
    it('should export only selected rows', () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      const selectedIds = new Set([1, 3])
      const csvContent = result.current.generateCSV({ selectedOnly: true, selectedIds })
      
      // Should include headers and 2 data rows
      const lines = csvContent.trim().split('\n')
      expect(lines).toHaveLength(3) // header + 2 selected rows
      expect(csvContent).toContain('John Doe')
      expect(csvContent).toContain('Bob Johnson')
      expect(csvContent).not.toContain('Alice Smith')
    })

    it('should export all rows when no selection', () => {
      const { result } = renderHook(() => 
        useDataExport(sampleData, columns)
      )

      const csvContent = result.current.generateCSV({ selectedOnly: true })
      
      const lines = csvContent.trim().split('\n')
      expect(lines).toHaveLength(4) // header + 3 rows
    })
  })

  describe('Custom formatters', () => {
    it('should apply column formatters during export', () => {
      const columnsWithFormatters: ColumnConfig<typeof sampleData[0]>[] = [
        { 
          key: 'name', 
          header: 'Name', 
          exportable: true,
          exportFormatter: (value) => value.toUpperCase()
        },
        { 
          key: 'age', 
          header: 'Age', 
          exportable: true,
          exportFormatter: (value) => `${value} years`
        },
        { 
          key: 'active', 
          header: 'Status', 
          exportable: true,
          exportFormatter: (value) => value ? 'Active' : 'Inactive'
        },
      ]

      const { result } = renderHook(() => 
        useDataExport(sampleData, columnsWithFormatters)
      )

      const csvContent = result.current.generateCSV()
      
      expect(csvContent).toContain('JOHN DOE')
      expect(csvContent).toContain('30 years')
      expect(csvContent).toContain('Active')
      expect(csvContent).toContain('Inactive')
    })
  })

  describe('Empty data handling', () => {
    it('should handle empty data array', () => {
      const { result } = renderHook(() => 
        useDataExport([], columns)
      )

      const csvContent = result.current.generateCSV()
      
      // Should only contain headers
      expect(csvContent).toBe('ID,Name,Age,Active\n')
    })

    it('should handle no exportable columns', () => {
      const noExportColumns: ColumnConfig<typeof sampleData[0]>[] = [
        { key: 'id', header: 'ID', exportable: false },
        { key: 'name', header: 'Name', exportable: false },
      ]

      const { result } = renderHook(() => 
        useDataExport(sampleData, noExportColumns)
      )

      const csvContent = result.current.generateCSV()
      
      expect(csvContent).toBe('\n')
    })
  })
})