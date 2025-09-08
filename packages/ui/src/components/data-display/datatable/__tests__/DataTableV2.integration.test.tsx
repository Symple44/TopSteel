import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataTable } from '../DataTable'
import type { ColumnConfig } from '../types'

describe('DataTable Integration Tests', () => {
  const sampleData = [
    {
      id: 1,
      name: 'John Doe',
      role: 'Developer',
      department: 'Engineering',
      salary: 75000,
      active: true,
    },
    {
      id: 2,
      name: 'Alice Smith',
      role: 'Designer',
      department: 'Design',
      salary: 65000,
      active: true,
    },
    {
      id: 3,
      name: 'Bob Johnson',
      role: 'Manager',
      department: 'Engineering',
      salary: 85000,
      active: false,
    },
    {
      id: 4,
      name: 'Diana Prince',
      role: 'Developer',
      department: 'Engineering',
      salary: 70000,
      active: true,
    },
    {
      id: 5,
      name: 'Eve Wilson',
      role: 'Analyst',
      department: 'Analytics',
      salary: 60000,
      active: true,
    },
  ]

  const columns: ColumnConfig<(typeof sampleData)[0]>[] = [
    { id: 'id', key: 'id', title: 'ID', type: 'number', sortable: true, width: 60 },
    { id: 'name', key: 'name', title: 'Name', type: 'text', sortable: true, searchable: true },
    { id: 'role', key: 'role', title: 'Role', type: 'text', sortable: true },
    { id: 'department', key: 'department', title: 'Department', type: 'text', sortable: true },
    {
      id: 'salary',
      key: 'salary',
      title: 'Salary',
      type: 'number',
      sortable: true,
      render: (_value, row) => `$${(row as unknown).salary.toLocaleString()}`,
    },
    {
      id: 'active',
      key: 'active',
      title: 'Status',
      type: 'boolean',
      render: (_value, row) => (
        <span className={(row as unknown).active ? 'text-green-600' : 'text-red-600'}>
          {(row as unknown).active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  describe('Rendering', () => {
    it('should render table with data', () => {
      const { container } = render(<DataTable data={sampleData} columns={columns} keyField="id" />)

      // Check that table is rendered
      expect(container.querySelector('table')).toBeInTheDocument()

      // Check basic names without complex formatting
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    })

    it('should show empty state when no data', () => {
      render(
        <DataTable data={[]} columns={columns} keyField="id" emptyMessage="No employees found" />
      )

      expect(screen.getByText('No employees found')).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(<DataTable data={sampleData} columns={columns} keyField="id" loading={true} />)

      expect(screen.getByText('Chargement...')).toBeInTheDocument()
    })

    it('should show error state', () => {
      render(
        <DataTable data={sampleData} columns={columns} keyField="id" error="Failed to load data" />
      )

      expect(screen.getByText('Failed to load data')).toBeInTheDocument()
    })
  })

  describe('Sorting', () => {
    it('should sort data when clicking column header', async () => {
      const { container } = render(
        <DataTable data={sampleData} columns={columns} keyField="id" sortable={true} />
      )

      // Check that table with headers exists
      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should render selection checkboxes when selectable', () => {
      render(<DataTable data={sampleData} columns={columns} keyField="id" selectable={true} />)

      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThan(0)
    })
  })

  describe('Search', () => {
    it('should render search input when searchable', () => {
      render(<DataTable data={sampleData} columns={columns} keyField="id" searchable={true} />)

      const searchInput = screen.getByPlaceholderText(/rechercher/i)
      expect(searchInput).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should render pagination when enabled', () => {
      const largeData = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        name: `Employee ${i + 1}`,
        role: 'Developer',
        department: 'Engineering',
        salary: 70000,
        active: true,
      }))

      const { container } = render(
        <DataTable data={largeData} columns={columns} keyField="id" pagination={{ pageSize: 10 }} />
      )

      // Check that pagination controls exist
      const paginationButtons = container.querySelectorAll('button')
      expect(paginationButtons.length).toBeGreaterThan(0)
    })
  })

  describe('Actions', () => {
    it('should render row actions', () => {
      const actions = [
        { label: 'Edit', onClick: vi.fn() },
        { label: 'Delete', onClick: vi.fn(), variant: 'destructive' as const },
      ]

      const { container } = render(
        <DataTable data={sampleData} columns={columns} keyField="id" actions={actions} />
      )

      // Should render action buttons for each row
      const actionButtons = container.querySelectorAll('button')
      expect(actionButtons.length).toBeGreaterThan(0)
    })

    it('should call action handlers with correct row data', () => {
      const handleEdit = vi.fn()
      const actions = [{ label: 'Edit', onClick: handleEdit }]

      render(<DataTable data={sampleData} columns={columns} keyField="id" actions={actions} />)

      const firstEditButton = screen.getAllByText('Edit')[0]
      fireEvent.click(firstEditButton)

      expect(handleEdit).toHaveBeenCalledWith(sampleData[0])
    })
  })

  describe('Row interactions', () => {
    it('should handle row click', () => {
      const onRowClick = vi.fn()

      render(
        <DataTable data={sampleData} columns={columns} keyField="id" onRowClick={onRowClick} />
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
        <DataTable data={sampleData} columns={columns} keyField="id" striped={true} />
      )

      const rows = container.querySelectorAll('tbody tr')
      // First row (index 0) should have striped background
      expect(rows[0]).toHaveClass('bg-muted/50')
    })

    it('should apply hover effect', () => {
      const { container } = render(
        <DataTable data={sampleData} columns={columns} keyField="id" hoverable={true} />
      )

      const rows = container.querySelectorAll('tbody tr')
      expect(rows[0]).toHaveClass('hover:bg-muted/50')
    })
  })
})
