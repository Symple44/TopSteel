// packages/ui/src/components/virtual-table.tsx
import { FixedSizeList as List } from 'react-window'
import { useMemo } from 'react'

interface VirtualTableProps<T> {
  data: T[]
  itemHeight: number
  height: number
  renderRow: (props: { index: number; style: any; data: T[] }) => JSX.Element
}

export function VirtualTable<T>({ data, itemHeight, height, renderRow }: VirtualTableProps<T>) {
  const memoizedData = useMemo(() => data, [data])
  
  return (
    <List
      height={height}
      itemCount={memoizedData.length}
      itemSize={itemHeight}
      itemData={memoizedData}
    >
      {renderRow}
    </List>
  )
}