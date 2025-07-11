import * as React from 'react'
import { cn } from '../../../lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table'

export interface DataTableColumn {
  header?: string
  accessorKey: string
  cell?: (value: any, row: any) => React.ReactNode
  sortable?: boolean
}

export interface DataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: any[]
  columns?: DataTableColumn[]
  loading?: boolean
  emptyMessage?: string
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  (
    {
      data = [],
      columns = [],
      loading,
      emptyMessage = 'Aucune donnée disponible',
      className,
      ...props
    },
    ref
  ) => {
    const [sortColumn, setSortColumn] = React.useState<string | null>(null)
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc')

    const handleSort = (columnKey: string) => {
      if (sortColumn === columnKey) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      } else {
        setSortColumn(columnKey)
        setSortDirection('asc')
      }
    }

    const sortedData = React.useMemo(() => {
      if (!sortColumn) return data

      return [...data].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }, [data, sortColumn, sortDirection])

    if (loading) {
      return (
        <div ref={ref} className={cn('space-y-4', className)} {...props}>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column, index) => (
                  <TableHead key={index}>
                    <div className="h-4 bg-muted animate-pulse rounded"></div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {columns.map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <div className="h-4 bg-muted animate-pulse rounded"></div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead
                  key={index}
                  className={column.sortable ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => column.sortable && handleSort(column.accessorKey)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header || column.accessorKey}</span>
                    {column.sortable && sortColumn === column.accessorKey && (
                      <span className="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {column.cell
                        ? column.cell(row[column.accessorKey], row)
                        : row[column.accessorKey] || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }
)

DataTable.displayName = 'DataTable'

export { DataTable }
