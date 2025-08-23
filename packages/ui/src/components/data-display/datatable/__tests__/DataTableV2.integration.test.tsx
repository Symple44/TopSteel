import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DataTable } from '../DataTableV2'
import type { ColumnConfig } from '../types'

describe('DataTable Integration Tests', () => {
  const sampleData = [
    { id: 1, name: 'John Doe', role: 'Developer', department: 'Engineering', salary: 75000, active: true },
    { id: 2, name: 'Alice Smith', role: 'Designer', department: 'Design', salary: 65000, active: true },
    { id: 3, name: 'Bob Johnson', role: 'Manager', department: 'Engineering', salary: 85000, active: false },
    { id: 4, name: 'Diana Prince', role: 'Developer', department: 'Engineering', salary: 70000, active: true },
    { id: 5, name: 'Eve Wilson', role: 'Analyst', department: 'Analytics', salary: 60000, active: true },
  ]

  const columns: ColumnConfig<typeof sampleData[0]>[] = [
    { key: 'id', header: 'ID', sortable: true, width: 60 },
    { key: 'name', header: 'Name', sortable: true, searchable: true },
    { key: 'role', header: 'Role', sortable: true, filterable: true },
    { key: 'department', header: 'Department', sortable: true, filterable: true },
    { key: 'salary', header: 'Salary', sortable: true, 
      render: (row) => `$${row.salary.toLocaleString()}` 
    },
    { key: 'active', header: 'Status', 
      render: (row) => (
        <span className={row.active ? 'text-green-600' : 'text-red-600'}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
      )
    },
  ]

  describe('Rendering', () => {
    it('should render table with data', () => {
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
        />
      )

      // Check headers
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Role')).toBeInTheDocument()

      // Check data
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
      expect(screen.getByText('$75,000')).toBeInTheDocument()
    })

    it('should show empty state when no data', () => {
      render(
        <DataTable
          data={[]}
          columns={columns}
          keyField="id"
          emptyMessage="No employees found"
        />
      )

      expect(screen.getByText('No employees found')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          loading={true}
        />
      )

      expect(screen.getByTestId('datatable-loading')).toBeInTheDocument()
    })

    it('should show error state', () => {
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          error="Failed to load data"
        />
      )

      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort data when clicking column header', async () => {
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          sortable={true}
        />
      )

      const nameHeader = screen.getByText('Name')
      
      // Get initial order
      const rows = screen.getAllByRole('row')
      expect(rows[1]).toHaveTextContent('John Doe')

      // Click to sort ascending
      fireEvent.click(nameHeader)
      await waitFor(() => {
        const sortedRows = screen.getAllByRole('row')
        expect(sortedRows[1]).toHaveTextContent('Alice Smith')
      })

      // Click again to sort descending
      fireEvent.click(nameHeader)
      await waitFor(() => {
        const sortedRows = screen.getAllByRole('row')
        expect(sortedRows[1]).toHaveTextContent('John Doe')
      })
    })

    it('should handle multi-column sorting with shift key', async () => {
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          sortable={true}
        />
      )

      const departmentHeader = screen.getByText('Department')
      const salaryHeader = screen.getByText('Salary')

      // Sort by department first
      fireEvent.click(departmentHeader)
      
      // Then sort by salary with shift key
      fireEvent.click(salaryHeader, { shiftKey: true })

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        // Should be sorted by department then salary
        expect(rows[1]).toHaveTextContent('Analytics')
        expect(rows[1]).toHaveTextContent('$60,000')
      })
    })
  })

  describe('Selection', () => {
    it('should select individual rows', async () => {
      const onSelectionChange = vi.fn()
      
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          selectable={true}
          onSelectionChange={onSelectionChange}
        />
      )

      const checkboxes = screen.getAllByRole('checkbox')
      // First checkbox is select all, skip it
      const firstRowCheckbox = checkboxes[1]
      
      fireEvent.click(firstRowCheckbox)

      expect(onSelectionChange).toHaveBeenCalledWith({
        selectedRows: new Set([1]),
        selectAll: false
      })
    })

    it('should select all rows', async () => {
      const onSelectionChange = vi.fn()
      
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          selectable={true}
          onSelectionChange={onSelectionChange}
        />
      )

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      fireEvent.click(selectAllCheckbox)

      expect(onSelectionChange).toHaveBeenCalledWith({
        selectedRows: new Set([1, 2, 3, 4, 5]),
        selectAll: true
      })
    })
  })

  describe('Search', () => {
    it('should filter data based on search term', async () => {
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          searchable={true}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search/i)
      
      await userEvent.type(searchInput, 'Alice')

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument()
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })

    it('should search across multiple columns', async () => {
      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          searchable={true}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search/i)
      
      await userEvent.type(searchInput, 'Engineering')

      await waitFor(() => {
        // Should find all engineering department members
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
        expect(screen.getByText('Diana Prince')).toBeInTheDocument()
        expect(screen.queryByText('Alice Smith')).not.toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should paginate data', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        role: 'Developer',
        department: 'Engineering',
        salary: 70000,
        active: true,
      }))

      render(
        <DataTable
          data={largeData}
          columns={columns}
          keyField="id"
          pagination={{ pageSize: 10 }}
        />
      )

      // Should show first 10 items
      expect(screen.getByText('Employee 1')).toBeInTheDocument()
      expect(screen.getByText('Employee 10')).toBeInTheDocument()
      expect(screen.queryByText('Employee 11')).not.toBeInTheDocument()

      // Should show pagination controls
      expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
    })

    it('should navigate between pages', async () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        role: 'Developer',
        department: 'Engineering',
        salary: 70000,
        active: true,
      }))

      render(
        <DataTable
          data={largeData}
          columns={columns}
          keyField="id"
          pagination={{ pageSize: 10 }}
        />
      )

      const nextButton = screen.getByLabelText(/next page/i)
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.queryByText('Employee 1')).not.toBeInTheDocument()
        expect(screen.getByText('Employee 11')).toBeInTheDocument()
        expect(screen.getByText('Employee 20')).toBeInTheDocument()
      })
    })
  })

  describe('Actions', () => {
    it('should render row actions', () => {
      const actions = [
        { label: 'Edit', onClick: vi.fn() },
        { label: 'Delete', onClick: vi.fn(), variant: 'destructive' as const },
      ]

      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          actions={actions}
        />
      )

      // Should render action buttons for each row
      const editButtons = screen.getAllByText('Edit')
      const deleteButtons = screen.getAllByText('Delete')
      
      expect(editButtons).toHaveLength(5)
      expect(deleteButtons).toHaveLength(5)
    })

    it('should call action handlers with correct row data', () => {
      const handleEdit = vi.fn()
      const actions = [
        { label: 'Edit', onClick: handleEdit },
      ]

      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          actions={actions}
        />
      )

      const firstEditButton = screen.getAllByText('Edit')[0]
      fireEvent.click(firstEditButton)

      expect(handleEdit).toHaveBeenCalledWith(sampleData[0])
    })
  })

  describe('Row interactions', () => {
    it('should handle row click', () => {
      const onRowClick = vi.fn()

      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          onRowClick={onRowClick}
        />
      )

      const firstRow = screen.getByText('John Doe').closest('tr')
      fireEvent.click(firstRow!)

      expect(onRowClick).toHaveBeenCalledWith(sampleData[0], 0)
    })

    it('should handle row double click', () => {
      const onRowDoubleClick = vi.fn()

      render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          onRowDoubleClick={onRowDoubleClick}
        />
      )

      const firstRow = screen.getByText('John Doe').closest('tr')
      fireEvent.doubleClick(firstRow!)

      expect(onRowDoubleClick).toHaveBeenCalledWith(sampleData[0], 0)
    })
  })

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          className="custom-table-class"
        />
      )

      expect(container.querySelector('.custom-table-class')).toBeInTheDocument()
    })

    it('should apply striped rows', () => {
      const { container } = render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          striped={true}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      expect(rows[1]).toHaveClass('bg-muted/50')
    })

    it('should apply hover effect', () => {
      const { container } = render(
        <DataTable
          data={sampleData}
          columns={columns}
          keyField="id"
          hoverable={true}
        />
      )

      const rows = container.querySelectorAll('tbody tr')
      expect(rows[0]).toHaveClass('hover:bg-muted/50')
    })
  })
})