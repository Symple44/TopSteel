import React from "react"

interface TableProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
  value?: any
  onValueChange?: any
  asChild?: boolean
  variant?: string
  size?: string
}

export const Table = React.forwardRef<HTMLDivElement, TableProps>(
  ({ className = "", children, asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, { ...props, ref })
    }
    
    return (
      <div className={className} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)

Table.displayName = "Table"

// Export des sous-composants courants si nécessaire
export const TableContent = Table
export const TableTrigger = Table  
export const TableItem = Table
export const TableValue = Table
export const TableHeader = Table
export const TableTitle = Table
export const TableDescription = Table
export const TableFooter = Table
export const TableSeparator = Table
export const TableList = Table
