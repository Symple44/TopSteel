import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FilterConfig } from '../../types'
import { useDataFiltering } from '../useDataFiltering.simple'

describe('useDataFiltering', () => {
  const sampleData = [
    { id: 1, name: 'John Doe', age: 30, city: 'Paris', active: true },
    { id: 2, name: 'Alice Smith', age: 25, city: 'London', active: false },
    { id: 3, name: 'Bob Johnson', age: 35, city: 'New York', active: true },
    { id: 4, name: 'Diana Prince', age: 28, city: 'Berlin', active: true },
  ]

  it('should filter by search term', () => {
    const { result } = renderHook(() => useDataFiltering(sampleData, [], 'Alice'))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Alice Smith')
  })

  it('should search case-insensitively', () => {
    const { result } = renderHook(() => useDataFiltering(sampleData, [], 'JOHN'))

    expect(result.current).toHaveLength(2)
    expect(result.current[0].name).toBe('John Doe')
    expect(result.current[1].name).toBe('Bob Johnson')
  })

  it('should filter by exact match', () => {
    const filters: FilterConfig[] = [{ column: 'city', operator: 'equals', value: 'Paris' }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].city).toBe('Paris')
  })

  it('should filter by contains', () => {
    const filters: FilterConfig[] = [{ column: 'name', operator: 'contains', value: 'Smith' }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Alice Smith')
  })

  it('should filter by greater than', () => {
    const filters: FilterConfig[] = [{ column: 'age', operator: 'gt', value: 28 }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(2)
    expect(result.current[0].age).toBe(30)
    expect(result.current[1].age).toBe(35)
  })

  it('should filter by less than', () => {
    const filters: FilterConfig[] = [{ column: 'age', operator: 'lt', value: 30 }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(2)
    expect(result.current[0].age).toBe(25)
    expect(result.current[1].age).toBe(28)
  })

  it('should filter by between', () => {
    const filters: FilterConfig[] = [{ column: 'age', operator: 'between', value: [26, 30] }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(2)
    expect(result.current[0].age).toBe(30)
    expect(result.current[1].age).toBe(28)
  })

  it('should filter by boolean values', () => {
    const filters: FilterConfig[] = [{ column: 'active', operator: 'equals', value: true }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(3)
    expect(result.current.every((item) => item.active)).toBe(true)
  })

  it('should combine multiple filters with AND logic', () => {
    const filters: FilterConfig[] = [
      { column: 'active', operator: 'equals', value: true },
      { column: 'age', operator: 'gt', value: 28 },
    ]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(2)
    expect(result.current[0].name).toBe('John Doe')
    expect(result.current[1].name).toBe('Bob Johnson')
  })

  it('should combine search with filters', () => {
    const filters: FilterConfig[] = [{ column: 'active', operator: 'equals', value: true }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, 'John'))

    expect(result.current).toHaveLength(2)
    expect(result.current[0].name).toBe('John Doe')
    expect(result.current[1].name).toBe('Bob Johnson')
  })

  it('should return empty array when no matches', () => {
    const filters: FilterConfig[] = [{ column: 'age', operator: 'gt', value: 100 }]

    const { result } = renderHook(() => useDataFiltering(sampleData, filters, ''))

    expect(result.current).toHaveLength(0)
  })

  it('should handle empty data', () => {
    const { result } = renderHook(() => useDataFiltering([], [], 'search'))

    expect(result.current).toEqual([])
  })

  it('should handle null/undefined values in data', () => {
    const dataWithNulls = [
      { id: 1, name: 'John', value: null },
      { id: 2, name: 'Alice', value: undefined },
      { id: 3, name: 'Bob', value: 'test' },
    ]

    const filters: FilterConfig[] = [{ column: 'value', operator: 'contains', value: 'test' }]

    const { result } = renderHook(() => useDataFiltering(dataWithNulls, filters, ''))

    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('Bob')
  })
})
