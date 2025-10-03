import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className='flex h-screen w-full'>
        <AdminSidebar />
        <SidebarInset className='flex-1'>
          <header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='mx-2 h-4' />
            <div className='flex items-center gap-2'>
              <span className='text-sm font-medium'>Administration</span>
            </div>
          </header>
          <main className='flex-1 overflow-y-auto p-6'>
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
