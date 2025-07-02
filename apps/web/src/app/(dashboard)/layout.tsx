'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { ToastContainer } from '@/components/ui/toast-container'
import { useState } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <Header 
        onToggleSidebar={toggleSidebar}
        isSidebarCollapsed={sidebarCollapsed}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggle={toggleSidebar} 
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
