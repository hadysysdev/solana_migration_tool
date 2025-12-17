import { AdminSidebar } from '@/components/w3swap/AdminSidebar';
import { AdminHeader } from '@/components/w3swap/AdminHeader';
import { RequireAdmin } from '@/components/w3swap/RequireAdmin';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin 
      showDebug={true}
      fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-slate-400">You must be an admin to access this section.</p>
          <p className="text-sm text-slate-500 mt-2">Check the debug panel in the bottom right for details.</p>
        </div>
      </div>
    }>
      <div className="flex bg-black overflow-x-hidden min-h-screen">
        {/* Sidebar - Fixed */}
        <div className="fixed left-0 top-0 h-screen z-30">
          <AdminSidebar />
        </div>
        
        {/* Main Content - With left margin for sidebar */}
        <div className="flex-1 flex flex-col ml-72 min-w-0 overflow-x-hidden bg-black">
          <AdminHeader />
          <main className="p-6 overflow-x-hidden bg-black">
            <div className="mx-auto max-w-7xl w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </RequireAdmin>
  );
}
