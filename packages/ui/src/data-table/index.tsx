"use client"

import * as React from "react"
import { cn } from "../lib/utils"

export interface DataTableProps {
  children: React.ReactNode
  className?: string
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div className={cn("rounded-md border", className)}>
      <table className="w-full caption-bottom text-sm">
        {children}
      </table>
    </div>
  )
}
