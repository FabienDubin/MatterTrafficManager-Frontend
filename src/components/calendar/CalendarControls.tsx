import { SidebarTrigger } from '@/components/filters/FilterSidebarFull';
import { SyncIndicator } from '@/components/shared/SyncIndicator';
import { PeriodDisplay } from '@/components/calendar/PeriodDisplay';
import { ViewSwitcher, CalendarViewType } from '@/components/calendar/ViewSwitcher';
import { DateNavigator } from '@/components/calendar/DateNavigator';

interface CalendarControlsProps {
  // Sync indicator props
  tasksCount: number;
  isLoadingBackground: boolean;
  hasPendingLocalUpdates: boolean;
  lastRefresh: Date | null;
  nextRefresh: Date | null;
  loadedRangesCount: number;
  onRefresh: () => void;

  // View controls props
  currentDate: Date;
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
}

/**
 * CalendarControls - Barre de contrôle avec sidebar toggle, sync, navigation
 */
export function CalendarControls({
  tasksCount,
  isLoadingBackground,
  hasPendingLocalUpdates,
  lastRefresh,
  nextRefresh,
  loadedRangesCount,
  onRefresh,
  currentDate,
  currentView,
  onViewChange,
  onNavigate,
}: CalendarControlsProps) {
  return (
    <div className='mb-4 flex items-start justify-between'>
      {/* Left side: Sidebar toggle + Sync indicator */}
      <div className='flex items-start gap-3'>
        <SidebarTrigger className='' />
        <SyncIndicator
          showDetails
          tasksCount={tasksCount}
          isLoadingBackground={isLoadingBackground}
          hasPendingLocalUpdates={hasPendingLocalUpdates}
          lastRefresh={lastRefresh}
          nextRefresh={nextRefresh}
          loadedRangesCount={loadedRangesCount}
          onRefresh={onRefresh}
        />
      </div>

      {/* Right side: Period display, view switcher and date navigator */}
      <div className='flex flex-col items-end gap-2'>
        {/* Top row: Period display + View switcher */}
        <div className='flex items-center gap-4'>
          <PeriodDisplay currentDate={currentDate} currentView={currentView} />
          <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />
        </div>

        {/* Bottom row: Date navigator aligned under view switcher */}
        <DateNavigator onNavigate={onNavigate} />
      </div>
    </div>
  );
}
