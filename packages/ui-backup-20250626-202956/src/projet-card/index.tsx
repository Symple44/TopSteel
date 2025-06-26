"use client"

import * as React from "react"

export interface ProjetCardProps {
  title: string
  status: string
  children?: React.ReactNode
}

export function ProjetCard({ title, status, children }: ProjetCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{status}</p>
      {children}
    </div>
  )
}
