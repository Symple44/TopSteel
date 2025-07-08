// packages/ui/src/components/data-table.tsx
import * as React from 'react'
import { cn } from '../lib/utils'

interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('w-full overflow-auto', className)} {...props}>
        <table className="w-full caption-bottom text-sm">{children}</table>
      </div>
    )
  }
)

DataTable.displayName = 'DataTable'

export { DataTable }
