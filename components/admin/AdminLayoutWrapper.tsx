'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutWrapperProps {
  userName?: string
  children: React.ReactNode
}

export function AdminLayoutWrapper({ userName, children }: AdminLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} userName={userName} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </>
  )
}
