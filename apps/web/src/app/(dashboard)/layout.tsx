'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastContainer } from '@/components/ui/toast-container'
import { useHydrationSafe } from '@/hooks/use-store-ssr'
import { useSidebar } from '@/stores'
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // ✅ Utilisation sécurisée du store
  const sidebarState = useHydrationSafe(
    () => useSidebar(),
    { collapsed: false, toggle: () => {}, setCollapsed: () => {} }
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <Header 
        onToggleSidebar={sidebarState.toggle}
        isSidebarCollapsed={sidebarState.collapsed}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          isCollapsed={sidebarState.collapsed} 
          onToggle={sidebarState.toggle} 
        />
        
        <main className="flex-1 overflow-auto relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
          <div className="relative z-10">{children}</div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/30 to-transparent pointer-events-none"></div>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}