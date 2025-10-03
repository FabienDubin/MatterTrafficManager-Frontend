import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from './FilterSidebarFull';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TeamToggles } from './TeamToggles';
import { MemberMultiSelect } from './MemberMultiSelect';
import { ClientMultiSelect } from './ClientMultiSelect';
import { ProjectMultiSelect } from './ProjectMultiSelect';

/**
 * FilterPanel - Left sidebar with calendar filtering controls
 *
 * Features:
 * - Collapsible sidebar (no overlay, just shadow)
 * - Smooth slide animation
 * - State persisted in localStorage via Zustand store
 * - Two main sections: Main controls (top) and Tabs (bottom)
 * - Custom width: 24rem (384px)
 * - Custom icon: Filter instead of PanelLeft
 */
export function FilterPanel() {
  return (
    <Sidebar className='border-r bg-white'>
      {/* Header */}

      {/* Scrollable content */}
      <SidebarContent className='bg-white'>
        <ScrollArea className='flex-1'>
          <div className='p-4 space-y-6'>
            {/* Section: Main Controls */}
            <div className='space-y-4'>
              {/* Team filter */}
              <TeamToggles />

              <Separator />

              {/* Member filter */}
              <MemberMultiSelect />

              <Separator />

              {/* Client filter */}
              <ClientMultiSelect />

              <Separator />

              {/* Project filter */}
              <ProjectMultiSelect />
            </div>

            <Separator />

            {/* Section: Tabs (bottom) - Task 6 */}
            <div>
              <p className='text-sm text-muted-foreground'>
                Tabs (Filtres avancés / Tâches non planifiées) - À implémenter (Task 6)
              </p>
            </div>
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
