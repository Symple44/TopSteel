import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useDataSorting } from '../useDataSorting.simple'
import type { SortConfig } from '../../types'

describe('useDataSorting', () => {
  const sampleData = [
    { id: 1, name: 'John', age: 30, city: 'Paris' },
    { id: 2, name: 'Alice', age: 25, city: 'London' },
    { id: 3, name: 'Bob', age: 35, city: 'New York' },
    { id: 4, name: 'Diana', age: 28, city: 'Berlin' },
  ]

  it('should sort data by single column ascending', () => {
    const { result } = renderHook(() => 
      useDataSorting(sampleData, [{ column: 'name', direction: 'asc' }])
    )

    expect(result.current[0].name).toBe('Alice')
    expect(result.current[1].name).toBe('Bob')
    expect(result.current[2].name).toBe('Diana')
    expect(result.current[3].name).toBe('John')
  })

  it('should sort data by single column descending', () => {
    const { result } = renderHook(() => 
      useDataSorting(sampleData, [{ column: 'age', direction: 'desc' }])
    )

    expect(result.current[0].age).toBe(35)
    expect(result.current[1].age).toBe(30)
    expect(result.current[2].age).toBe(28)
    expect(result.current[3].age).toBe(25)
  })

  it('should handle multi-column sorting', () => {
    const dataWithDuplicates = [
      { id: 1, category: 'A', priority: 2 },
      { id: 2, category: 'B', priority: 1 },
      { id: 3, category: 'A', priority: 1 },
      { id: 4, category: 'B', priority: 2 },
    ]

    const { result } = renderHook(() => 
      useDataSorting(dataWithDuplicates, [
        { column: 'category', direction: 'asc' },
        { column: 'priority', direction: 'asc' }
      ])
    )

    expect(result.current[0]).toEqual({ id: 3, category: 'A', priority: 1 })
    expect(result.current[1]).toEqual({ id: 1, category: 'A', priority: 2 })
    expect(result.current[2]).toEqual({ id: 2, category: 'B', priority: 1 })
    expect(result.current[3]).toEqual({ id: 4, category: 'B', priority: 2 })
  })

  it('should return original data when no sort config', () => {
    const { result } = renderHook(() => 
      useDataSorting(sampleData, [])
    )

    expect(result.current).toEqual(sampleData)
  })

  it('should handle null and undefined values', () => {
    const dataWithNulls = [
      { id: 1, value: 'A' },
      { id: 2, value: null },
      { id: 3, value: 'B' },
      { id: 4, value: undefined },
    ]

    const { result } = renderHook(() => 
      useDataSorting(dataWithNulls, [{ column: 'value', direction: 'asc' }])
    )

    // Les valeurs null/undefined doivent être à la fin
    expect(result.current[0].value).toBe('A')
    expect(result.current[1].value).toBe('B')
    expect(result.current[2].value).toBe(null)
    expect(result.current[3].value).toBe(undefined)
  })

  it('should update when sort config changes', () => {
    let sortConfig: SortConfig[] = [{ column: 'name', direction: 'asc' }]
    
    const { result, rerender } = renderHook(() => 
      useDataSorting(sampleData, sortConfig)
    )

    expect(result.current[0].name).toBe('Alice')

    // Change sort config
    sortConfig = [{ column: 'name', direction: 'desc' }]
    rerender()

    expect(result.current[0].name).toBe('John')
  })
})