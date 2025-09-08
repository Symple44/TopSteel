import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDataSelection } from '../useDataSelection'

describe('useDataSelection', () => {
  const sampleData = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Alice' },
    { id: 3, name: 'Bob' },
    { id: 4, name: 'Diana' },
  ]

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    expect(result.current.selection.selectedRows.size).toBe(0)
    expect(result.current.selection.selectAll).toBe(false)
  })

  it('should toggle single row selection', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    act(() => {
      result.current.toggleRow(1)
    })

    expect(result.current.selection.selectedRows.has(1)).toBe(true)
    expect(result.current.selection.selectedRows.size).toBe(1)

    act(() => {
      result.current.toggleRow(1)
    })

    expect(result.current.selection.selectedRows.has(1)).toBe(false)
    expect(result.current.selection.selectedRows.size).toBe(0)
  })

  it('should select multiple rows', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    act(() => {
      result.current.toggleRow(1)
      result.current.toggleRow(2)
      result.current.toggleRow(3)
    })

    expect(result.current.selection.selectedRows.size).toBe(3)
    expect(result.current.selection.selectedRows.has(1)).toBe(true)
    expect(result.current.selection.selectedRows.has(2)).toBe(true)
    expect(result.current.selection.selectedRows.has(3)).toBe(true)
  })

  it('should toggle all rows', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    act(() => {
      result.current.toggleAll()
    })

    expect(result.current.selection.selectAll).toBe(true)
    expect(result.current.selection.selectedRows.size).toBe(4)

    sampleData.forEach((item) => {
      expect(result.current.selection.selectedRows.has(item.id)).toBe(true)
    })

    act(() => {
      result.current.toggleAll()
    })

    expect(result.current.selection.selectAll).toBe(false)
    expect(result.current.selection.selectedRows.size).toBe(0)
  })

  it('should clear selection', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    act(() => {
      result.current.toggleRow(1)
      result.current.toggleRow(2)
    })

    expect(result.current.selection.selectedRows.size).toBe(2)

    act(() => {
      result.current.deselectAll()
    })

    expect(result.current.selection.selectedRows.size).toBe(0)
    expect(result.current.selection.selectAll).toBe(false)
  })

  it('should select specific rows', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    act(() => {
      result.current.selectRow(1)
      result.current.selectRow(3)
    })

    expect(result.current.selection.selectedRows.size).toBe(2)
    expect(result.current.selection.selectedRows.has(1)).toBe(true)
    expect(result.current.selection.selectedRows.has(3)).toBe(true)
    expect(result.current.selection.selectedRows.has(2)).toBe(false)
  })

  it('should check if row is selected', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    act(() => {
      result.current.toggleRow(2)
    })

    expect(result.current.isSelected(2)).toBe(true)
    expect(result.current.isSelected(1)).toBe(false)
  })

  it('should get selected data', () => {
    const { result } = renderHook(() => useDataSelection({ data: sampleData, keyField: 'id' }))

    act(() => {
      result.current.selectRow(1)
      result.current.selectRow(3)
    })

    const selectedData = result.current.selectedData
    expect(selectedData).toHaveLength(2)
    expect(selectedData[0].name).toBe('John')
    expect(selectedData[1].name).toBe('Bob')
  })

  it('should call onChange callback when selection changes', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useDataSelection({
        data: sampleData,
        keyField: 'id',
        onSelectionChange: onChange,
      })
    )

    act(() => {
      result.current.toggleRow(1)
    })

    expect(onChange).toHaveBeenCalledWith({
      selectedRows: new Set([1]),
      selectAll: false,
    })

    act(() => {
      result.current.toggleAll()
    })

    expect(onChange).toHaveBeenCalledWith({
      selectedRows: new Set([1, 2, 3, 4]),
      selectAll: true,
    })
  })

  it('should handle custom key field', () => {
    const customData = [
      { customId: 'a', name: 'John' },
      { customId: 'b', name: 'Alice' },
    ]

    const { result } = renderHook(() =>
      useDataSelection({ data: customData, keyField: 'customId' })
    )

    act(() => {
      result.current.toggleRow('a')
    })

    expect(result.current.selection.selectedRows.has('a')).toBe(true)
    expect(result.current.selectedData[0].name).toBe('John')
  })

  it('should handle data changes', () => {
    let data = sampleData.slice(0, 2)

    const { result, rerender } = renderHook(
      ({ data }) => useDataSelection({ data, keyField: 'id' }),
      { initialProps: { data } }
    )

    act(() => {
      result.current.toggleAll()
    })

    expect(result.current.selection.selectedRows.size).toBe(2)

    // Change data
    data = sampleData
    rerender({ data })

    // Selection should be preserved for existing items
    expect(result.current.selection.selectedRows.has(1)).toBe(true)
    expect(result.current.selection.selectedRows.has(2)).toBe(true)
    expect(result.current.selection.selectedRows.has(3)).toBe(false)
  })
})
