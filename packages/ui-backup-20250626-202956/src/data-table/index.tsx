"use client"

import * as React from "react"

export interface DataTableProps {
  children: React.ReactNode
  className?: string
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={ounded-md border }>
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  )
}
