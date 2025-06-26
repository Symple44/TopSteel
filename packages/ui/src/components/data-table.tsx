import * as React from "react"
import { cn } from "@/lib/utils"

interface Column<T = any> {
  key: string
  label: string
  render?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T = any> extends React.HTMLAttributes<HTMLDivElement> {
  data?: T[]
  columns?: Column<T>[]
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
}

const DataTable = React.forwardRef<HTMLDivElement, DataTableProps>(
  ({ 
    className, 
    data = [], 
    columns = [], 
    searchPlaceholder = "Rechercher...",
    onRowClick,
    loading = false,
    emptyMessage = "Aucune donnée disponible",
    ...props 
  }, ref) => {
    const [searchTerm, setSearchTerm] = React.useState("")

    const filteredData = React.useMemo(() => {
      if (!searchTerm) return data
      return data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }, [data, searchTerm])

    if (loading) {
      return (
        <div ref={ref} className={cn("space-y-4", className)} {...props}>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)} {...props}>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    style={{ width: column.width }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-24 px-4 text-center">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredData.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="p-4 align-middle">
                        {column.render 
                          ? column.render(row[column.key], row)
                          : String(row[column.key] || '')
                        }
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
)
DataTable.displayName = "DataTable"

export { DataTable }
