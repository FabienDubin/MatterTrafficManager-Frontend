import { SidebarTrigger } from '@/components/filters/FilterSidebarFull';
import { SyncIndicator } from '@/components/shared/SyncIndicator';
import { ActiveFiltersIndicator } from '@/components/shared/ActiveFiltersIndicator';
import { PeriodDisplay } from '@/components/calendar/PeriodDisplay';
import { ViewSwitcher, CalendarViewType } from '@/components/calendar/ViewSwitcher';
import { DateNavigator } from '@/components/calendar/DateNavigator';
import { useFilterStore } from '@/store/filter.store';
import { useGlobalSyncState, useOnlineStatus } from '@/hooks/useOptimisticUpdate';
import { useSyncStatus } from '@/hooks/useSyncStatus';

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
 * CalendarControls - Barre de contrôle avec sidebar toggle, sync, navigation et filtres actifs
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
  // Check if filters are active
  const { 
    selectedTeams, 
    selectedMembers, 
    selectedClients, 
    selectedProjects, 
    showAvailability, 
    colorMode 
  } = useFilterStore();
  const hasActiveFilters =
    selectedTeams.length > 0 ||
    selectedMembers.length > 0 ||
    selectedClients.length > 0 ||
    selectedProjects.length > 0 ||
    showAvailability ||
    colorMode === 'taskStatus';

  // Check if any alert badge is active (same logic as SyncIndicator line 65)
  const { isSyncing: localSyncing, hasErrors: localErrors } = useGlobalSyncState();
  const isOnline = useOnlineStatus();
  const { syncStatus, hasConflicts, hasErrors, isSyncing, isServerDown } = useSyncStatus();

  const actualSyncing = !isServerDown && (syncStatus ? isSyncing : localSyncing);
  const actualErrors = !isServerDown && (syncStatus ? hasErrors : localErrors);
  const hasActiveBadge =
    isServerDown ||
    !isOnline ||
    hasConflicts ||
    actualErrors ||
    actualSyncing ||
    hasPendingLocalUpdates;

  // Hide SyncIndicator if filters are active AND no alert badge is active
  const shouldShowSyncIndicator = !hasActiveFilters || hasActiveBadge;

  return (
    <div className='mb-4 flex items-start justify-between'>
      {/* Left column: Sidebar trigger, Sync indicator, Active filters */}
      <div className='flex gap-2 w-[45%]'>
        <SidebarTrigger className='' />
        {shouldShowSyncIndicator && (
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
        )}
        <div className='min-h-[24px] flex items-center'>
          <ActiveFiltersIndicator />
        </div>
      </div>

      {/* Right column: Period display, view switcher and date navigator */}
      <div className='flex flex-col items-end gap-2'>
        {/* Top row: Period display + View switcher */}
        <div className='flex items-center gap-4'>
          <PeriodDisplay currentDate={currentDate} currentView={currentView} />
          <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />
        </div>

        {/* Bottom row: Date navigator */}
        <DateNavigator onNavigate={onNavigate} />
      </div>
    </div>
  );
}
