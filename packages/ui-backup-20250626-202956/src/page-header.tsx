import * as React from "react"

interface PageHeaderProps {
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
