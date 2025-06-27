"use client"

import * as React from "react"
import { cn } from "../lib/utils"

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  children?: React.ReactNode
}

export function PageHeader({ 
  title, 
  description, 
  children, 
  className, 
  ...props 
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)} {...props}>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center space-x-2">
          {children}
        </div>
      )}
    </div>
  )
}
