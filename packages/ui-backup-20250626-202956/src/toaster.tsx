import * as React from "react"

interface ToasterProps {
  children?: React.ReactNode
  className?: string
}

export function Toaster({ children, className }: ToasterProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
