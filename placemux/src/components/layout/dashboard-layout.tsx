import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { TopNav } from './topnav'

interface DashboardLayoutProps {
  role: 'student' | 'company' | 'college' | 'admin'
}

export function DashboardLayout({ role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen">
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        role={role}
      />
      <div
        className="flex flex-1 flex-col transition-all duration-300"
        style={{ marginLeft: sidebarOpen ? 260 : 72 }}
      >
        <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
