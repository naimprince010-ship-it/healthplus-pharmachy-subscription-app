'use client'

import { useState, useEffect, Suspense } from 'react'
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
      <Suspense fallback={<aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white md:relative" aria-hidden />}>
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </Suspense>
      
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} userName={userName} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </>
  )
}
