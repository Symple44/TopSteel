"use client"
import * as React from "react"
import { cn } from "../lib/utils"

export const Switch = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn("peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full", className)} {...props} />
  )
)
Switch.displayName = "Switch"
