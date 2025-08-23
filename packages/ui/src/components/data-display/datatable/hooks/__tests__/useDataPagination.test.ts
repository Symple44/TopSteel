import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useDataPagination } from '../useDataPagination'

describe('useDataPagination', () => {
  const generateData = (count: number) => 
    Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }))

  it('should paginate data with default page size', () => {
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    expect(result.current.paginatedData).toHaveLength(10)
    expect(result.current.paginatedData[0].id).toBe(1)
    expect(result.current.paginatedData[9].id).toBe(10)
    expect(result.current.pagination.currentPage).toBe(1)
    expect(result.current.pagination.totalPages).toBe(3)
    expect(result.current.pagination.totalItems).toBe(25)
  })

  it('should navigate to next page', () => {
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.pagination.currentPage).toBe(2)
    expect(result.current.paginatedData[0].id).toBe(11)
    expect(result.current.paginatedData[9].id).toBe(20)
  })

  it('should navigate to previous page', () => {
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10, currentPage: 2 })
    )

    act(() => {
      result.current.prevPage()
    })

    expect(result.current.pagination.currentPage).toBe(1)
    expect(result.current.paginatedData[0].id).toBe(1)
  })

  it('should go to specific page', () => {
    const data = generateData(50)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    act(() => {
      result.current.goToPage(3)
    })

    expect(result.current.pagination.currentPage).toBe(3)
    expect(result.current.paginatedData[0].id).toBe(21)
    expect(result.current.paginatedData[9].id).toBe(30)
  })

  it('should not go beyond last page', () => {
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10, currentPage: 3 })
    )

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.pagination.currentPage).toBe(3)
  })

  it('should not go before first page', () => {
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10, currentPage: 1 })
    )

    act(() => {
      result.current.prevPage()
    })

    expect(result.current.pagination.currentPage).toBe(1)
  })

  it('should handle invalid page numbers', () => {
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    act(() => {
      result.current.goToPage(0)
    })
    expect(result.current.pagination.currentPage).toBe(1)

    act(() => {
      result.current.goToPage(10)
    })
    expect(result.current.pagination.currentPage).toBe(3)

    act(() => {
      result.current.goToPage(-1)
    })
    expect(result.current.pagination.currentPage).toBe(1)
  })

  it('should change page size', () => {
    const data = generateData(50)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    act(() => {
      result.current.setPageSize(20)
    })

    expect(result.current.pagination.pageSize).toBe(20)
    expect(result.current.pagination.totalPages).toBe(3)
    expect(result.current.paginatedData).toHaveLength(20)
    // Should reset to first page when changing page size
    expect(result.current.pagination.currentPage).toBe(1)
  })

  it('should handle empty data', () => {
    const { result } = renderHook(() => 
      useDataPagination([], { pageSize: 10 })
    )

    expect(result.current.paginatedData).toEqual([])
    expect(result.current.pagination.totalPages).toBe(0)
    expect(result.current.pagination.totalItems).toBe(0)
    expect(result.current.pagination.currentPage).toBe(1)
  })

  it('should handle data smaller than page size', () => {
    const data = generateData(5)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    expect(result.current.paginatedData).toHaveLength(5)
    expect(result.current.pagination.totalPages).toBe(1)
    expect(result.current.pagination.currentPage).toBe(1)
  })

  it('should show correct items on last page', () => {
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    act(() => {
      result.current.goToPage(3)
    })

    expect(result.current.paginatedData).toHaveLength(5)
    expect(result.current.paginatedData[0].id).toBe(21)
    expect(result.current.paginatedData[4].id).toBe(25)
  })

  it('should call onChange callback when pagination changes', () => {
    const onChange = vi.fn()
    const data = generateData(25)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 }, onChange)
    )

    act(() => {
      result.current.nextPage()
    })

    expect(onChange).toHaveBeenCalledWith({
      currentPage: 2,
      pageSize: 10,
      totalPages: 3,
      totalItems: 25,
    })

    act(() => {
      result.current.setPageSize(5)
    })

    expect(onChange).toHaveBeenCalledWith({
      currentPage: 1,
      pageSize: 5,
      totalPages: 5,
      totalItems: 25,
    })
  })

  it('should calculate page range correctly', () => {
    const data = generateData(100)
    const { result } = renderHook(() => 
      useDataPagination(data, { pageSize: 10 })
    )

    expect(result.current.pagination.totalPages).toBe(10)
    
    // Go to middle page
    act(() => {
      result.current.goToPage(5)
    })

    const pageInfo = result.current.getPageInfo()
    expect(pageInfo.from).toBe(41)
    expect(pageInfo.to).toBe(50)
    expect(pageInfo.total).toBe(100)
  })

  it('should handle data changes correctly', () => {
    let data = generateData(25)
    
    const { result, rerender } = renderHook(() => 
      useDataPagination(data, { pageSize: 10, currentPage: 3 })
    )

    expect(result.current.pagination.currentPage).toBe(3)
    expect(result.current.pagination.totalPages).toBe(3)

    // Reduce data
    data = generateData(15)
    rerender()

    // Should adjust current page if it's now out of bounds
    expect(result.current.pagination.currentPage).toBe(2)
    expect(result.current.pagination.totalPages).toBe(2)
  })
})