'use client'

import { ReactNode } from 'react'

interface QueryBuilderLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export default function QueryBuilderLayout({ children, sidebar }: QueryBuilderLayoutProps) {
  return (
    <div className="flex h-full">
      <aside className="w-64 border-r border-border bg-muted/10">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}