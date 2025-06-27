"use client"

import * as React from "react"
import { cn } from "../lib/utils"

export interface ToasterProps {
  className?: string
}

export function Toaster({ className }: ToasterProps) {
  return (
    <div className={cn("fixed bottom-0 right-0 z-50 w-full md:max-w-[420px] p-4", className)} />
  )
}
