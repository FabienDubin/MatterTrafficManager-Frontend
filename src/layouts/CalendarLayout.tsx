import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { FilterPanel } from '@/components/filters/FilterPanel';

interface CalendarLayoutProps {
  controls: ReactNode;
  children: ReactNode;
}

/**
 * CalendarLayout - Layout avec sidebar pour le contenu calendrier uniquement
 *
 * Structure:
 * - Controls (SyncIndicator, navigation) EN DEHORS du SidebarProvider
 * - SidebarProvider wrappant UNIQUEMENT la zone calendrier (pas les controls)
 * - FilterPanel en sidebar
 * - Children = CalendarView ou DayView
 *
 * La sidebar fait la hauteur de la zone calendrier uniquement (après les controls)
 */
export function CalendarLayout({ controls, children }: CalendarLayoutProps) {
  return (
    <div className='h-full flex flex-col'>
      <SidebarProvider className='flex-1 min-h-0'>
        <FilterPanel />
        <SidebarInset className='h-full flex flex-col overflow-hidden'>
          {/* Controls */}
          {controls}

          {/* Calendar content */}
          <div className='flex-1 min-h-0 overflow-auto'>
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
