import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { CalendarHeader } from '@/components/calendar/CalendarHeader';
import { CalendarControls } from '@/components/calendar/CalendarControls';
import { CalendarContent } from '@/components/calendar/CalendarContent';
import { CalendarLayout } from '@/layouts/CalendarLayout';
import { TaskEditSheet } from '@/components/calendar/TaskEditSheet';
import { useCalendarStore } from '@/store/calendar.store';
import { useCalendarConfigStore } from '@/store/calendar-config.store';
import { useClientColors, useTaskColors, useDisplayedTeams } from '@/store/config.store';
import { useFilterStore } from '@/store/filter.store';
import { useProgressiveCalendarTasks } from '@/hooks/useProgressiveCalendarTasks';
import { useOptimisticTaskUpdate } from '@/hooks/useOptimisticTaskUpdate';
import { useCalendarEvents } from '@/hooks/calendar/useCalendarEvents';
import { useCalendarNavigation } from '@/hooks/calendar/useCalendarNavigation';
import { useCalendarTaskManagement } from '@/hooks/calendar/useCalendarTaskManagement';
import { tasksToCalendarEvents } from '@/utils/taskMapper';
import { useFilteredTasks } from '@/hooks/useFilteredTasks';
import { useTasksWithColors } from '@/hooks/useTasksWithColors';
import { useMembers } from '@/hooks/api/useMembers';
import { useVisibleMembers } from '@/hooks/useVisibleMembers';
import { addDays } from 'date-fns';
import { Task } from '@/types/task.types';
import { Member } from '@/types/calendar.types';
import FullCalendar from '@fullcalendar/react';

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Initialize all colors early for reactivity with admin panel
  useClientColors();
  const { getColorForTask, allColorsLoaded } = useTaskColors();

  // Use calendar store instead of local state
  const { currentView, currentDate, setCurrentView, setCurrentDate } = useCalendarStore();

  // Get sidebar state, color mode and availability mode from filter store
  const { 
    isPanelOpen, 
    colorMode, 
    showAvailability, 
    showAvailabilityUserPreference,
    setShowAvailability 
  } = useFilterStore();

  // Get calendar configuration
  const { config: calendarConfig, fetchConfig } = useCalendarConfigStore();

  // Get teams configuration for availability view
  const { displayedTeams } = useDisplayedTeams();

  // Période actuellement visible dans le calendrier (pour debug seulement)
  const [, setVisiblePeriod] = useState<{ start: Date; end: Date } | null>(null);

  // Use progressive loading hook with polling
  const {
    tasks,
    isLoadingBackground,
    error,
    loadedRanges,
    fetchAdditionalRange,
    clearCache,
    lastRefresh,
    nextRefresh,
    tasksMapRef,
    setTasks,
    addToDeleteBlacklist,
    removeFromDeleteBlacklist,
  } = useProgressiveCalendarTasks({
    enablePolling: true,
    pollingInterval: 2 * 60 * 1000,
  });

  // Initialize optimistic update hook WITHOUT automatic refresh
  const taskUpdate = useOptimisticTaskUpdate(tasks, setTasks, { tasksMapRef });

  // Get all members from API
  const { data: allMembers = [] } = useMembers();

  // Apply filters to tasks
  const filteredTasks = useFilteredTasks(tasks);

  // Apply dynamic colors based on color mode
  const { tasks: tasksWithColors } = useTasksWithColors(filteredTasks);

  // Use calendar hooks with blacklist support for delete operations
  const { selectedTask, setSelectedTask, sheetOpen, setSheetOpen } = useCalendarTaskManagement(
    taskUpdate,
    tasksMapRef,
    setTasks,
    {
      addToDeleteBlacklist,
      removeFromDeleteBlacklist,
    }
  );

  // État pour la création de tâche
  const [createMode, setCreateMode] = useState<{
    initialDates: { start: Date; end: Date };
    initialMember?: string;
    initialMembers?: string[];
  } | null>(null);

  const { handleEventClick, handleEventDrop, handleEventResize } = useCalendarEvents(
    setSelectedTask,
    setSheetOpen,
    taskUpdate
  );

  const { handleViewChange, handleDateNavigate, handleDatesChange } = useCalendarNavigation(
    currentView,
    currentDate,
    setCurrentView,
    setCurrentDate,
    calendarRef,
    setVisiblePeriod,
    loadedRanges,
    fetchAdditionalRange
  );

  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mountTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (tasks.length > 0 && isInitialLoad) {
      const timeToDisplay = performance.now() - mountTimeRef.current;
      console.log(`📅 [Calendar] Calendar displayed with ${tasks.length} tasks in ${timeToDisplay.toFixed(0)}ms`);
      setIsInitialLoad(false);
    }
  }, [tasks.length, isInitialLoad]);

  // Load calendar configuration on mount
  useEffect(() => {
    if (!calendarConfig) {
      fetchConfig();
    }
  }, [calendarConfig, fetchConfig]);

  // Synchronization logic for showAvailability based on currentView
  useEffect(() => {
    if (currentView === 'week') {
      // Restaurer la préférence utilisateur quand on revient en vue semaine
      setShowAvailability(showAvailabilityUserPreference);
    } else {
      // Désactiver quand on quitte la vue semaine (mais garder la préférence)
      setShowAvailability(false);
    }
  }, [currentView, showAvailabilityUserPreference, setShowAvailability]);

  // Sync FullCalendar with store on mount and when view/date changes
  useEffect(() => {
    if (calendarRef.current && currentView !== 'day') {
      const api = calendarRef.current.getApi();
      const fcView = currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth';
      if (api.view.type !== fcView) {
        api.changeView(fcView, currentDate);
      } else {
        api.gotoDate(currentDate);
      }
    }
  }, [currentView, currentDate]);

  // Force FullCalendar to recalculate size when sidebar state changes
  // Following FullCalendar's recommendation to call updateSize() when parent container changes
  // No transition on sidebar = instant resize, no jumping
  useEffect(() => {
    if (!calendarRef.current || currentView === 'day') return;
    calendarRef.current.getApi().updateSize();
  }, [isPanelOpen, currentView]);

  // Convert tasks to calendar events with view configuration
  const events = useMemo(() => {
    if (tasksWithColors && tasksWithColors.length > 0) {
      let viewConfig = undefined;
      if (calendarConfig) {
        switch (currentView) {
          case 'week':
            viewConfig = calendarConfig.weekView;
            break;
          case 'month':
            viewConfig = calendarConfig.monthView;
            break;
          case 'day':
            viewConfig = calendarConfig.dayView;
            break;
        }
      }
      return tasksToCalendarEvents(tasksWithColors, viewConfig);
    }
    return [];
  }, [tasksWithColors, calendarConfig, currentView]);

  // Extract members from tasks for DayView
  const members: Member[] = useMemo(() => {
    const memberMap = new Map<string, Member>();
    const allTeamsMap = new Map<string, string>();

    tasksWithColors.forEach(task => {
      if (task.teamsData) {
        task.teamsData.forEach(team => {
          allTeamsMap.set(team.id, team.name);
        });
      }
      if (task.involvedTeamsData) {
        task.involvedTeamsData.forEach(team => {
          allTeamsMap.set(team.id, team.name);
        });
      }
    });

    tasksWithColors.forEach(task => {
      if (task.assignedMembersData) {
        task.assignedMembersData.forEach(memberData => {
          if (!memberMap.has(memberData.id)) {
            let resolvedTeams: string[] = [];
            if (memberData.teams && Array.isArray(memberData.teams)) {
              resolvedTeams = memberData.teams
                .map(teamId => allTeamsMap.get(teamId))
                .filter((name): name is string => !!name);
            }

            memberMap.set(memberData.id, {
              id: memberData.id,
              name: memberData.name,
              email: memberData.email,
              teams: resolvedTeams.length > 0 ? resolvedTeams : undefined,
            });
          }
        });
      }
    });

    return Array.from(memberMap.values());
  }, [tasksWithColors]);

  // Filter visible members for DayView based on active filters
  const visibleMembers = useVisibleMembers(members, allMembers);

  const handleDateClick = (arg: any) => {
    console.log('Date clicked:', arg.dateStr);
  };

  const handleSelect = useCallback(
    (selectInfo: any) => {
      // Get filtered members from filter store
      const { selectedMembers } = useFilterStore.getState();

      setCreateMode({
        initialDates: {
          start: selectInfo.start,
          end: selectInfo.end,
        },
        // Pass filtered members if any are active
        initialMembers: selectedMembers.length > 0 ? selectedMembers : undefined,
      });
      setSheetOpen(true);
      setSelectedTask(null);
    },
    [setSheetOpen, setSelectedTask]
  );

  const handleTimeSlotSelect = useCallback(
    (member: Member | null, startDate: Date, endDate: Date) => {
      // Get filtered members from filter store
      const { selectedMembers } = useFilterStore.getState();

      setCreateMode({
        initialDates: {
          start: startDate,
          end: endDate,
        },
        // PRIORITY LOGIC:
        // 1. If member filter active → use filtered members
        // 2. Else, if column member provided → use that member
        initialMembers: selectedMembers.length > 0 ? selectedMembers : undefined,
        initialMember: selectedMembers.length === 0 && member?.id ? member.id : undefined,
      });
      setSheetOpen(true);
      setSelectedTask(null);
    },
    [setSheetOpen, setSelectedTask]
  );

  // handleTaskCreate is now handled directly by TaskEditSheet via useOptimisticTaskCreate

  // Handler for DayView task drop with member management
  const handleTaskDrop = useCallback(
    (task: Task, newMemberId: string | null, newDate: Date, sourceMemberId?: string) => {
      if (!task.workPeriod) return;

      const originalStart = new Date(task.workPeriod.startDate);
      const originalEnd = new Date(task.workPeriod.endDate);
      const duration = originalEnd.getTime() - originalStart.getTime();
      const newEndDate = new Date(newDate.getTime() + duration);

      const updates: any = {
        workPeriod: {
          startDate: newDate.toISOString(),
          endDate: newEndDate.toISOString(),
        },
      };

      const currentMembers = task.assignedMembers || [];

      if (newMemberId === null) {
        updates.assignedMembers = [];
        updates.assignedMembersData = [];
      } else if (newMemberId) {
        let updatedMembers = [...currentMembers];

        if (sourceMemberId && sourceMemberId !== '' && sourceMemberId !== newMemberId) {
          updatedMembers = updatedMembers.filter(id => id !== sourceMemberId);
        }

        if (!updatedMembers.includes(newMemberId)) {
          updatedMembers.push(newMemberId);
        }

        if (
          updatedMembers.length !== currentMembers.length ||
          !updatedMembers.every(id => currentMembers.includes(id))
        ) {
          updates.assignedMembers = updatedMembers;
          updates.assignedMembersData = updatedMembers
            .map(memberId => members.find(m => m.id === memberId))
            .filter(Boolean)
            .map(member => ({
              id: member!.id,
              name: member!.name,
              email: member!.email || '',
              teams: Array.isArray(member!.teams) ? member!.teams : [],
            }));
        }
      }

      taskUpdate.mutate({
        id: task.id,
        updates,
      });
    },
    [taskUpdate, members]
  );

  const handleTaskResize = useCallback(
    (task: Task, newStartDate: Date, newEndDate: Date) => {
      taskUpdate.mutate({
        id: task.id,
        updates: {
          workPeriod: {
            startDate: newStartDate.toISOString(),
            endDate: newEndDate.toISOString(),
          },
        },
      });
    },
    [taskUpdate]
  );

  return (
    <div className='flex flex-col h-screen'>
      {/* Header */}
      <CalendarHeader />

      {/* Main content with CalendarLayout */}
      <main className='flex-1 p-6 pt-4 overflow-hidden'>
        <div className='h-full max-w-[1600px] mx-auto'>
          <CalendarLayout
            controls={
              <CalendarControls
                tasksCount={tasksWithColors.length}
                isLoadingBackground={isLoadingBackground}
                hasPendingLocalUpdates={taskUpdate.hasPendingUpdates}
                lastRefresh={lastRefresh}
                nextRefresh={nextRefresh}
                loadedRangesCount={loadedRanges.length}
                onRefresh={() => {
                  clearCache();
                  const now = new Date();
                  fetchAdditionalRange(addDays(now, -30), addDays(now, 30));
                }}
                currentDate={currentDate}
                currentView={currentView}
                onViewChange={handleViewChange}
                onNavigate={handleDateNavigate}
              />
            }
          >
            <div ref={calendarContainerRef} className='h-full'>
              <CalendarContent
                isInitialLoad={isInitialLoad}
                tasks={tasksWithColors}
                error={error}
                currentView={currentView}
                currentDate={currentDate}
                calendarRef={calendarRef}
                showWeekends={calendarConfig?.showWeekends ?? true}
                viewConfig={
                  currentView === 'day'
                    ? calendarConfig?.dayView
                    : currentView === 'week'
                      ? calendarConfig?.weekView
                      : calendarConfig?.monthView
                }
                events={events}
                members={currentView === 'day' ? visibleMembers : members}
                showAvailability={showAvailability}
                teams={displayedTeams}
                onDateClick={handleDateClick}
                onEventClick={handleEventClick}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
                onSelect={handleSelect}
                onDatesChange={handleDatesChange}
                onNavLinkDayClick={date => {
                  setCurrentView('day');
                  setCurrentDate(date);
                }}
                onTaskClick={task => {
                  setSelectedTask(task);
                  setSheetOpen(true);
                }}
                onTimeSlotClick={(member, date, hour) => {
                  console.log('Time slot clicked:', { member, date, hour });
                }}
                onTimeSlotSelect={handleTimeSlotSelect}
                onTaskDrop={handleTaskDrop}
                onTaskResize={handleTaskResize}
              />
            </div>
          </CalendarLayout>
        </div>
      </main>

      {/* Sheet d'édition/création de tâche */}
      <TaskEditSheet
        task={selectedTask}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedTask(null);
          setCreateMode(null);
        }}
        tasks={tasksWithColors}
        setTasks={setTasks}
        initialDates={createMode?.initialDates}
        initialMember={createMode?.initialMember}
        initialMembers={createMode?.initialMembers}
      />
    </div>
  );
}
