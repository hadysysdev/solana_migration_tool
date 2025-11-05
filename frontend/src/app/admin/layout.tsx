import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminHeader } from '@/components/admin/admin-header';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add actual admin authentication check
  // For now, we'll allow access to test the interface
  
  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Sidebar - Fixed */}
      <div className="fixed left-0 top-0 h-screen z-30">
        <AdminSidebar />
      </div>
      
      {/* Main Content - With left margin for sidebar */}
      <div className="flex-1 flex flex-col ml-64 min-w-0 overflow-x-hidden">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}