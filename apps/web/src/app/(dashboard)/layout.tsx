'use client'

import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { useState, type ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Header moderne */}
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar moderne */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={toggleSidebar} 
        />
        
        {/* Contenu principal avec effets modernes */}
        <main className="flex-1 overflow-auto relative">
          {/* Effet de grille subtil */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>
          
          {/* Contenu */}
          <div className="relative z-10">
            {children}
          </div>
          
          {/* Overlay gradient en bas pour l'effet moderne */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white/30 to-transparent pointer-events-none"></div>
        </main>
      </div>
    </div>
  )
}
