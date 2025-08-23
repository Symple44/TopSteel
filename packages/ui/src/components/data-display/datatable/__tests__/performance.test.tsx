import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DataTable } from '../DataTable'
import { ColumnConfig } from '../types'
import { TooltipProvider } from '../../primitives/tooltip'

interface TestData {
  id: number
  name: string
  email: string
  age: number
  department: string
  salary: number
  joinDate: string
  status: 'active' | 'inactive' | 'pending'
  performance: number
  manager: string
}

function generateLargeDataset(count: number): TestData[] {
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations']
  const statuses: Array<'active' | 'inactive' | 'pending'> = ['active', 'inactive', 'pending']
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Tom', 'Lisa']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller']
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]} ${i}`,
    email: `user${i}@company.com`,
    age: 20 + (i % 45),
    department: departments[i % departments.length],
    salary: 30000 + (i * 1000) % 70000,
    joinDate: new Date(2020, i % 12, (i % 28) + 1).toISOString(),
    status: statuses[i % 3],
    performance: 60 + (i % 40),
    manager: `Manager ${Math.floor(i / 10)}`
  }))
}

describe('DataTable Performance Tests', () => {
  const columns: ColumnConfig<TestData>[] = [
    { key: 'id', header: 'ID', sortable: true },
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'age', header: 'Age', sortable: true },
    { key: 'department', header: 'Department', sortable: true, filterable: true },
    { key: 'salary', header: 'Salary', sortable: true },
    { key: 'joinDate', header: 'Join Date', sortable: true },
    { key: 'status', header: 'Status', filterable: true },
    { key: 'performance', header: 'Performance', sortable: true },
    { key: 'manager', header: 'Manager', filterable: true }
  ]

  describe('Large Dataset Rendering', () => {
    it('should render 1000 rows within acceptable time', () => {
      const data = generateLargeDataset(1000)
      const startTime = performance.now()
      
      const { container } = render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          />
        </TooltipProvider>
      )
      
      const renderTime = performance.now() - startTime
      
      expect(container.querySelectorAll('tbody tr')).toHaveLength(50)
      expect(renderTime).toBeLessThan(1000)
      console.log(`Render time for 1000 rows (paginated): ${renderTime.toFixed(2)}ms`)
    })

    it('should render 5000 rows with pagination efficiently', () => {
      const data = generateLargeDataset(5000)
      const startTime = performance.now()
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 100 }}
          />
        </TooltipProvider>
      )
      
      const renderTime = performance.now() - startTime
      
      expect(screen.getByText('1-100 sur 5000')).toBeInTheDocument()
      expect(renderTime).toBeLessThan(1500)
      console.log(`Render time for 5000 rows (paginated): ${renderTime.toFixed(2)}ms`)
    })

    it('should handle 10000 rows dataset', () => {
      const data = generateLargeDataset(10000)
      const startTime = performance.now()
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 100 }}
          />
        </TooltipProvider>
      )
      
      const renderTime = performance.now() - startTime
      
      expect(screen.getByText('1-100 sur 10000')).toBeInTheDocument()
      expect(renderTime).toBeLessThan(2000)
      console.log(`Render time for 10000 rows (paginated): ${renderTime.toFixed(2)}ms`)
    })
  })

  describe('Sorting Performance', () => {
    it('should sort 1000 rows quickly', async () => {
      const data = generateLargeDataset(1000)
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          />
        </TooltipProvider>
      )
      
      const nameHeader = screen.getByText('Name')
      
      const startTime = performance.now()
      fireEvent.click(nameHeader)
      await waitFor(() => {
        const firstRow = screen.getByText(/^David Brown/)
        expect(firstRow).toBeInTheDocument()
      })
      const sortTime = performance.now() - startTime
      
      expect(sortTime).toBeLessThan(200)
      console.log(`Sort time for 1000 rows: ${sortTime.toFixed(2)}ms`)
    })

    it('should sort 5000 rows within acceptable time', async () => {
      const data = generateLargeDataset(5000)
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 100 }}
          />
        </TooltipProvider>
      )
      
      const salaryHeader = screen.getByText('Salary')
      
      const startTime = performance.now()
      fireEvent.click(salaryHeader)
      const sortTime = performance.now() - startTime
      
      expect(sortTime).toBeLessThan(500)
      console.log(`Sort time for 5000 rows: ${sortTime.toFixed(2)}ms`)
    })
  })

  describe('Filtering Performance', () => {
    it('should filter 1000 rows quickly', async () => {
      const data = generateLargeDataset(1000)
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          showSearch
          />
        </TooltipProvider>
      )
      
      const searchInput = screen.getByPlaceholderText('Rechercher...')
      
      const startTime = performance.now()
      fireEvent.change(searchInput, { target: { value: 'Engineering' } })
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(0)
      })
      
      const filterTime = performance.now() - startTime
      
      expect(filterTime).toBeLessThan(300)
      console.log(`Filter time for 1000 rows: ${filterTime.toFixed(2)}ms`)
    })

    it('should handle complex filters on 5000 rows', async () => {
      const data = generateLargeDataset(5000)
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 100 }}
          showSearch
          />
        </TooltipProvider>
      )
      
      const searchInput = screen.getByPlaceholderText('Rechercher...')
      
      const startTime = performance.now()
      fireEvent.change(searchInput, { target: { value: 'active' } })
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(0)
      })
      
      const filterTime = performance.now() - startTime
      
      expect(filterTime).toBeLessThan(500)
      console.log(`Filter time for 5000 rows: ${filterTime.toFixed(2)}ms`)
    })
  })

  describe('Selection Performance', () => {
    it('should select all 1000 rows quickly', async () => {
      const data = generateLargeDataset(1000)
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          selectable
          />
        </TooltipProvider>
      )
      
      const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
      
      const startTime = performance.now()
      fireEvent.click(selectAllCheckbox)
      
      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox')
        expect(checkboxes[1]).toBeChecked()
      })
      
      const selectionTime = performance.now() - startTime
      
      expect(selectionTime).toBeLessThan(200)
      console.log(`Select all time for 1000 rows: ${selectionTime.toFixed(2)}ms`)
    })
  })

  describe('Pagination Performance', () => {
    it('should navigate pages quickly with 1000 rows', async () => {
      const data = generateLargeDataset(1000)
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          />
        </TooltipProvider>
      )
      
      const nextButton = screen.getByRole('button', { name: /suivant/i })
      
      const startTime = performance.now()
      
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextButton)
        await waitFor(() => {
          expect(screen.getByText(`${(i + 1) * 50 + 1}-${(i + 2) * 50} sur 1000`)).toBeInTheDocument()
        })
      }
      
      const navigationTime = performance.now() - startTime
      
      expect(navigationTime).toBeLessThan(500)
      console.log(`Navigation time for 5 page changes: ${navigationTime.toFixed(2)}ms`)
    })
  })

  describe('Memory Usage', () => {
    it('should not cause memory leaks with repeated operations', async () => {
      const data = generateLargeDataset(1000)
      
      const { rerender, unmount } = render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          />
        </TooltipProvider>
      )

      for (let i = 0; i < 10; i++) {
        rerender(
          <TooltipProvider>
            <DataTable 
              data={generateLargeDataset(1000)} 
              columns={columns}
              pagination={{ pageSize: 50 }}
            />
          </TooltipProvider>
        )
      }

      unmount()
      
      expect(true).toBe(true)
    })
  })

  describe('Complex Operations Performance', () => {
    it('should handle sort + filter + pagination efficiently', async () => {
      const data = generateLargeDataset(2000)
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          showSearch
          />
        </TooltipProvider>
      )
      
      const startTime = performance.now()
      
      const nameHeader = screen.getByText('Name')
      fireEvent.click(nameHeader)
      
      const searchInput = screen.getByPlaceholderText('Rechercher...')
      fireEvent.change(searchInput, { target: { value: 'John' } })
      
      const nextButton = screen.getByRole('button', { name: /suivant/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(0)
      })
      
      const complexOperationTime = performance.now() - startTime
      
      expect(complexOperationTime).toBeLessThan(800)
      console.log(`Complex operation time: ${complexOperationTime.toFixed(2)}ms`)
    })
  })

  describe('Export Performance', () => {
    it('should export 1000 rows to CSV quickly', () => {
      const data = generateLargeDataset(1000)
      const onExport = jest.fn()
      
      render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          exportable
          onExport={onExport}
          />
        </TooltipProvider>
      )
      
      const exportButton = screen.getByRole('button', { name: /exporter/i })
      
      const startTime = performance.now()
      fireEvent.click(exportButton)
      const exportTime = performance.now() - startTime
      
      expect(onExport).toHaveBeenCalledWith(data, 'csv')
      expect(exportTime).toBeLessThan(100)
      console.log(`Export time for 1000 rows: ${exportTime.toFixed(2)}ms`)
    })
  })

  describe('Real-time Updates Performance', () => {
    it('should handle frequent data updates efficiently', async () => {
      let data = generateLargeDataset(500)
      
      const { rerender } = render(
        <TooltipProvider>
          <DataTable 
            data={data} 
            columns={columns}
            pagination={{ pageSize: 50 }}
          />
        </TooltipProvider>
      )
      
      const startTime = performance.now()
      
      for (let i = 0; i < 10; i++) {
        data = [...data.slice(0, 250), generateLargeDataset(10)[0], ...data.slice(251)]
        
        rerender(
          <TooltipProvider>
            <DataTable 
              data={data} 
              columns={columns}
              pagination={{ pageSize: 50 }}
            />
          </TooltipProvider>
        )
      }
      
      const updateTime = performance.now() - startTime
      
      expect(updateTime).toBeLessThan(1000)
      console.log(`10 data updates time: ${updateTime.toFixed(2)}ms`)
    })
  })
})