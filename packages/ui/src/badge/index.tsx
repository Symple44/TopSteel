"use client"

import * as React from "react"
import { cn } from "../lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-medium", className)} {...props} />
  )
}
