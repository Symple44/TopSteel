'use client'

import type { ReactNode } from 'react'
import { QueryBuilderSidebar } from './query-builder-sidebar'

interface QueryBuilderLayoutProps {
  children: ReactNode
  sidebar: ReactNode
}

export default function QueryBuilderLayout({
  children,
  sidebar: _sidebar,
}: QueryBuilderLayoutProps) {
  return (
    <div className="flex h-full">
      <aside className="w-64 border-r border-border bg-muted/10">
        <QueryBuilderSidebar />
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
