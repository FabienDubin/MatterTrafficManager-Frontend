import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TeamToggles } from './TeamToggles';

/**
 * FilterPanel - Left sidebar with calendar filtering controls
 *
 * Features:
 * - Collapsible sidebar (no overlay, just shadow)
 * - Smooth slide animation
 * - State persisted in localStorage via Zustand store
 * - Two main sections: Main controls (top) and Tabs (bottom)
 */
export function FilterPanel() {
  return (
    <Sidebar className="border-r">
      {/* Header */}
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="font-semibold">
              Filtres
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Scrollable content */}
      <SidebarContent>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Section: Main Controls */}
            <div className="space-y-4">
              {/* Team filter */}
              <TeamToggles />

              <Separator />

              {/* Placeholder: MemberMultiSelect - Task 4 */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Membres - À implémenter (Task 4)
                </p>
              </div>

              <Separator />

              {/* Placeholder: VisualizationToggles - Task 5 */}
              <div>
                <p className="text-sm text-muted-foreground">
                  Visualisation - À implémenter (Task 5)
                </p>
              </div>
            </div>

            <Separator />

            {/* Section: Tabs (bottom) - Task 6 */}
            <div>
              <p className="text-sm text-muted-foreground">
                Tabs (Filtres avancés / Tâches non planifiées) - À implémenter (Task 6)
              </p>
            </div>
          </div>
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
