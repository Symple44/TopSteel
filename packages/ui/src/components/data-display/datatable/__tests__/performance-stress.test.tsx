import React, { useState, useEffect } from 'react'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { DataTable } from '../DataTable'
import { ColumnConfig } from '../types'
import { TooltipProvider } from '../../primitives/tooltip'

interface StressTestData {
  id: string
  timestamp: number
  value: number
  category: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  metadata: Record<string, any>
}

function generateStressData(count: number): StressTestData[] {
  const categories = ['A', 'B', 'C', 'D', 'E']
  const statuses: StressTestData['status'][] = ['pending', 'processing', 'completed', 'failed']
  
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    timestamp: Date.now() - i * 1000,
    value: Math.random() * 10000,
    category: categories[Math.floor(Math.random() * categories.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    metadata: {
      index: i,
      random: Math.random(),
      nested: {
        deep: {
          value: `deep-${i}`
        }
      }
    }
  }))
}

const RealTimeDataTable: React.FC<{ initialSize: number; updateInterval: number }> = ({ 
  initialSize, 
  updateInterval 
}) => {
  const [data, setData] = useState(() => generateStressData(initialSize))
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData]
        const updateSize = Math.floor(prevData.length * 0.1)
        
        for (let i = 0; i < updateSize; i++) {
          const index = Math.floor(Math.random() * newData.length)
          newData[index] = {
            ...newData[index],
            value: Math.random() * 10000,
            status: ['pending', 'processing', 'completed', 'failed'][
              Math.floor(Math.random() * 4)
            ] as StressTestData['status']
          }
        }
        
        return newData
      })
      setUpdateCount(c => c + 1)
    }, updateInterval)

    return () => clearInterval(interval)
  }, [updateInterval])

  const columns: ColumnConfig<StressTestData>[] = [
    { key: 'id', header: 'ID' },
    { key: 'value', header: 'Value', sortable: true },
    { key: 'category', header: 'Category', filterable: true },
    { key: 'status', header: 'Status', filterable: true }
  ]

  return (
    <TooltipProvider>
      <div>
        <div data-testid="update-count">Updates: {updateCount}</div>
        <DataTable data={data} columns={columns} pagination={{ pageSize: 50 }} />
      </div>
    </TooltipProvider>
  )
}

describe('DataTable Stress Tests', () => {
  describe('Memory Leak Detection', () => {
    it('should not leak memory with repeated mount/unmount cycles', () => {
      const data = generateStressData(1000)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' },
        { key: 'value', header: 'Value', sortable: true }
      ]

      let memoryBefore: number | undefined
      if (typeof (global as any).gc === 'function') {
        (global as any).gc()
        memoryBefore = process.memoryUsage().heapUsed
      }

      for (let i = 0; i < 50; i++) {
        const { unmount } = render(
          <TooltipProvider>
            <DataTable data={data} columns={columns} />
          </TooltipProvider>
        )
        unmount()
      }

      if (typeof (global as any).gc === 'function' && memoryBefore) {
        (global as any).gc()
        const memoryAfter = process.memoryUsage().heapUsed
        const memoryIncrease = memoryAfter - memoryBefore
        const memoryIncreaseM = memoryIncrease / 1024 / 1024
        
        console.log(`Memory increase after 50 mount/unmount cycles: ${memoryIncreaseM.toFixed(2)} MB`)
        
        expect(memoryIncreaseM).toBeLessThan(50)
      }
    })
  })

  describe('Rapid User Interactions', () => {
    it('should handle rapid sorting clicks without errors', async () => {
      const data = generateStressData(500)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' },
        { key: 'value', header: 'Value', sortable: true },
        { key: 'category', header: 'Category', sortable: true }
      ]

      render(<TooltipProvider><DataTable data={data} columns={columns} pagination={{ pageSize: 50 }} /></TooltipProvider>)
      
      const valueHeader = screen.getByText('Value')
      const categoryHeader = screen.getByText('Category')

      for (let i = 0; i < 20; i++) {
        fireEvent.click(i % 2 === 0 ? valueHeader : categoryHeader)
      }

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    })

    it('should handle rapid filter changes', async () => {
      const data = generateStressData(500)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' },
        { key: 'category', header: 'Category', filterable: true }
      ]

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
      
      const searchTerms = ['A', 'AB', 'ABC', 'A', '', 'B', 'BC', 'BCD', 'B', '']
      
      for (const term of searchTerms) {
        fireEvent.change(searchInput, { target: { value: term } })
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    })

    it('should handle rapid pagination', async () => {
      const data = generateStressData(500)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' }
      ]

      render(<TooltipProvider><DataTable data={data} columns={columns} pagination={{ pageSize: 20 }} /></TooltipProvider>)
      
      const nextButton = screen.getByRole('button', { name: /suivant/i })
      const prevButton = screen.getByRole('button', { name: /précédent/i })

      for (let i = 0; i < 10; i++) {
        fireEvent.click(nextButton)
      }
      
      for (let i = 0; i < 10; i++) {
        fireEvent.click(prevButton)
      }

      await waitFor(() => {
        expect(screen.getByText('1-20 sur 500')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Data Updates', () => {
    it('should handle continuous data updates', async () => {
      render(<RealTimeDataTable initialSize={100} updateInterval={100} />)
      
      await waitFor(() => {
        const updateCount = screen.getByTestId('update-count')
        expect(updateCount).toHaveTextContent('Updates: 5')
      }, { timeout: 1000 })

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty data gracefully', () => {
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' }
      ]

      render(<TooltipProvider><DataTable data={[]} columns={columns} /></TooltipProvider>)
      
      expect(screen.getByText('Aucune donnée disponible')).toBeInTheDocument()
    })

    it('should handle single row', () => {
      const data = generateStressData(1)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' }
      ]

      render(<TooltipProvider><DataTable data={data} columns={columns} /></TooltipProvider>)
      
      expect(screen.getByText('item-0')).toBeInTheDocument()
    })

    it('should handle columns with no data', () => {
      const data = [{ id: '1' }] as any
      const columns: ColumnConfig<any>[] = [
        { key: 'id', header: 'ID' },
        { key: 'missing', header: 'Missing Field' }
      ]

      render(<TooltipProvider><DataTable data={data} columns={columns} /></TooltipProvider>)
      
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should handle very long text content', () => {
      const longText = 'A'.repeat(1000)
      const data = [
        { id: '1', content: longText }
      ]
      const columns: ColumnConfig<any>[] = [
        { key: 'id', header: 'ID' },
        { 
          key: 'content', 
          header: 'Content',
          render: (item) => (
            <div className="truncate max-w-xs" title={item.content}>
              {item.content}
            </div>
          )
        }
      ]

      render(<TooltipProvider><DataTable data={data} columns={columns} /></TooltipProvider>)
      
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle sort while filtering', async () => {
      const data = generateStressData(200)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' },
        { key: 'value', header: 'Value', sortable: true },
        { key: 'category', header: 'Category', filterable: true }
      ]

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
      fireEvent.change(searchInput, { target: { value: 'A' } })
      
      const valueHeader = screen.getByText('Value')
      fireEvent.click(valueHeader)
      
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(0)
      })
    })

    it('should handle selection while paginating', async () => {
      const data = generateStressData(100)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' }
      ]

      render(
        <TooltipProvider>
          <DataTable 
          data={data} 
          columns={columns} 
          pagination={{ pageSize: 20 }} 
          selectable 
          />
        </TooltipProvider>
      )
      
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[1])
      fireEvent.click(checkboxes[2])
      
      const nextButton = screen.getByRole('button', { name: /suivant/i })
      fireEvent.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByText('21-40 sur 100')).toBeInTheDocument()
      })
      
      const prevButton = screen.getByRole('button', { name: /précédent/i })
      fireEvent.click(prevButton)
      
      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox')
        expect(updatedCheckboxes[1]).toBeChecked()
        expect(updatedCheckboxes[2]).toBeChecked()
      })
    })
  })

  describe('Performance Degradation Detection', () => {
    it('should maintain performance with increasing operations', async () => {
      const data = generateStressData(500)
      const columns: ColumnConfig<StressTestData>[] = [
        { key: 'id', header: 'ID' },
        { key: 'value', header: 'Value', sortable: true }
      ]

      render(<TooltipProvider><DataTable data={data} columns={columns} pagination={{ pageSize: 50 }} /></TooltipProvider>)
      
      const times: number[] = []
      const valueHeader = screen.getByText('Value')
      
      for (let i = 0; i < 10; i++) {
        const start = performance.now()
        fireEvent.click(valueHeader)
        await waitFor(() => {
          const firstCell = screen.getAllByRole('cell')[0]
          expect(firstCell).toBeInTheDocument()
        })
        const end = performance.now()
        times.push(end - start)
      }
      
      const avgFirstHalf = times.slice(0, 5).reduce((a, b) => a + b, 0) / 5
      const avgSecondHalf = times.slice(5).reduce((a, b) => a + b, 0) / 5
      
      const degradation = (avgSecondHalf - avgFirstHalf) / avgFirstHalf
      
      console.log(`Performance degradation: ${(degradation * 100).toFixed(2)}%`)
      
      expect(Math.abs(degradation)).toBeLessThan(0.5)
    })
  })
})