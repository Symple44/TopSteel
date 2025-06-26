import * as React from "react"

interface DataTableProps {
  children?: React.ReactNode
  className?: string
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
