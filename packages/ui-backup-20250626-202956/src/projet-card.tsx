import * as React from "react"

interface ProjetCardProps {
  children?: React.ReactNode
  className?: string
}

export function ProjetCard({ children, className }: ProjetCardProps) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}
