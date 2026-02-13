import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { BottomNav } from '@/components/bottom-nav'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <div className="flex items-center gap-2 border-b p-4">
          <SidebarTrigger />
        </div>
        <div className="p-4 pb-20 md:p-6 md:pb-6">{children}</div>
      </main>
      <BottomNav />
    </SidebarProvider>
  )
}
