import { useEffect, useMemo, useCallback, useRef } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { DayView } from '@/components/calendar/DayView';
import { ViewSwitcher, CalendarViewType } from '@/components/calendar/ViewSwitcher';
import { DateNavigator } from '@/components/calendar/DateNavigator';
import { PeriodDisplay } from '@/components/calendar/PeriodDisplay';
import { TaskEditSheet } from '@/components/calendar/TaskEditSheet';
import { ThemeToggle } from '@/components/shared/feedback/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useCalendarStore } from '@/store/calendar.store';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Settings } from 'lucide-react';
import { EventInput } from '@fullcalendar/core';
import { useProgressiveCalendarTasks } from '@/hooks/useProgressiveCalendarTasks';
import { useOptimisticTaskUpdate } from '@/hooks/useOptimisticTaskUpdate';
import { SyncIndicator } from '@/components/shared/SyncIndicator';
import { toast } from 'sonner';
import { tasksToCalendarEvents } from '@/utils/taskMapper';
import { addDays, startOfWeek, startOfMonth } from 'date-fns';
import { tasksService } from '@/services/api/tasks.service';
import { Task } from '@/types/task.types';
import { Member } from '@/types/calendar.types';
import FullCalendar from '@fullcalendar/react';
import { useState } from 'react';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const calendarRef = useRef<FullCalendar>(null);

  // Use calendar store instead of local state
  const { currentView, currentDate, setCurrentView, setCurrentDate } = useCalendarStore();

  // État pour le sheet d'édition
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
    // Exposed for optimistic updates
    tasksMapRef,
    setTasks,
  } = useProgressiveCalendarTasks({
    enablePolling: true,
    pollingInterval: 2 * 60 * 1000, // 2 minutes when active
  });

  // Initialize optimistic update hook WITHOUT automatic refresh
  // The polling handles syncing with Notion every 2 minutes
  const taskUpdate = useOptimisticTaskUpdate(tasks, setTasks, {
    tasksMapRef,
    // NO onMutationSuccess - we don't want to refresh everything after each update
  });

  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Mark initial load as complete after first data arrives
    if (tasks.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [tasks.length, isInitialLoad]);

  // Sync FullCalendar with store on mount and when view/date changes
  useEffect(() => {
    if (calendarRef.current && currentView !== 'day') {
      const api = calendarRef.current.getApi();
      
      // Update view
      const fcView = currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth';
      if (api.view.type !== fcView) {
        api.changeView(fcView);
      }
      
      // Update date
      api.gotoDate(currentDate);
    }
  }, [currentView, currentDate]);

  // Convert tasks to calendar events
  const events = useMemo(() => {
    if (tasks && tasks.length > 0) {
      return tasksToCalendarEvents(tasks);
    }
    return [];
  }, [tasks]);

  // Extract members from tasks for DayView
  const members: Member[] = useMemo(() => {
    const memberMap = new Map<string, Member>();
    const allTeamsMap = new Map<string, string>();

    // Collect all teams from tasks
    tasks.forEach(task => {
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

    // Create members with resolved team names
    tasks.forEach(task => {
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
  }, [tasks]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur', {
        description: 'Impossible de se déconnecter',
      });
    }
  };

  const handleDateClick = (arg: any) => {
    toast.info('Date sélectionnée', {
      description: `Vous avez cliqué sur ${arg.dateStr}`,
    });
  };

  const handleEventClick = (arg: any) => {
    const task: Task = {
      id: arg.event.id,
      title: arg.event.title,
      status: arg.event.extendedProps.status,
      description: arg.event.extendedProps.description,
      notes: arg.event.extendedProps.notes,
      assignedMembers: arg.event.extendedProps.assignedMembers,
      assignedMembersData: arg.event.extendedProps.assignedMembersData,
      projectId: arg.event.extendedProps.projectId,
      projectData: arg.event.extendedProps.projectData,
      clientId: arg.event.extendedProps.clientId,
      clientData: arg.event.extendedProps.clientData,
      teams: arg.event.extendedProps.teams,
      teamsData: arg.event.extendedProps.teamsData,
      involvedTeamIds: arg.event.extendedProps.involvedTeamIds,
      involvedTeamsData: arg.event.extendedProps.involvedTeamsData,
      workPeriod: {
        startDate: arg.event.startStr,
        endDate: arg.event.endStr,
      },
    };

    // Ouvrir le sheet d'édition avec la tâche sélectionnée
    setSelectedTask(task);
    setSheetOpen(true);
  };

  // Gérer le changement de période visible dans le calendrier
  // Handlers pour le sheet d'édition - Use optimistic updates
  const handleTaskUpdate = async (id: string, data: Partial<Task>) => {
    // Use optimistic update for INSTANT UI feedback
    // No need to await - the update is immediate in the UI
    taskUpdate.mutate({
      id,
      updates: data,
    });
    // That's it! No refresh needed - polling handles sync every 2 min
  };

  const handleTaskDelete = async (id: string) => {
    try {
      // For delete, we still call the service directly
      // TODO: Create optimistic delete hook if needed
      await tasksService.deleteTask(id);

      // Remove from local state immediately for better UX
      tasksMapRef.current.delete(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));

      // No full refresh - let polling handle any other changes
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  };

  // Handle view change
  const handleViewChange = (view: CalendarViewType) => {
    setCurrentView(view);

    // Update FullCalendar view if needed
    if (view !== 'day' && calendarRef.current) {
      const fcView = view === 'week' ? 'timeGridWeek' : 'dayGridMonth';
      calendarRef.current.getApi().changeView(fcView);
    }
  };

  // Handle date navigation
  const handleDateNavigate = (direction: 'prev' | 'next' | 'today') => {
    let newDate = currentDate;

    if (direction === 'today') {
      newDate = new Date();
    } else {
      const increment = direction === 'next' ? 1 : -1;

      switch (currentView) {
        case 'day':
          newDate = addDays(currentDate, increment);
          break;
        case 'week':
          newDate = addDays(currentDate, increment * 7);
          break;
        case 'month':
          newDate = addDays(currentDate, increment * 30);
          break;
      }
    }

    setCurrentDate(newDate);

    // Update FullCalendar if not in day view
    if (currentView !== 'day' && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(newDate);
    }
  };

  const handleDatesChange = useCallback(
    (start: Date, end: Date) => {
      setVisiblePeriod({ start, end });

      // Check if we're getting close to the edge of loaded data
      // We want to preload before user reaches the edge for smooth experience
      const marginDays = 7; // Preload when within 7 days of edge

      // Check if any loaded range covers the visible period
      const isCurrentlyCovered = loadedRanges.some(
        range => start >= range.start && end <= range.end
      );

      if (!isCurrentlyCovered) {
        // Need to load data for current view
        const extendedStart = addDays(start, -marginDays);
        const extendedEnd = addDays(end, marginDays);
        fetchAdditionalRange(extendedStart, extendedEnd);
        return;
      }

      // Check if we're approaching the edges
      const earliestLoaded = loadedRanges.reduce(
        (min, range) => (!min || range.start < min ? range.start : min),
        null as Date | null
      );

      const latestLoaded = loadedRanges.reduce(
        (max, range) => (!max || range.end > max ? range.end : max),
        null as Date | null
      );

      if (earliestLoaded && start < addDays(earliestLoaded, marginDays)) {
        // Approaching the beginning, load more past data
        const newStart = addDays(earliestLoaded, -30); // Load 30 more days before
        const newEnd = earliestLoaded;
        fetchAdditionalRange(newStart, newEnd);
      }

      if (latestLoaded && end > addDays(latestLoaded, -marginDays)) {
        // Approaching the end, load more future data
        const newStart = latestLoaded;
        const newEnd = addDays(latestLoaded, 30); // Load 30 more days after
        fetchAdditionalRange(newStart, newEnd);
      }
    },
    [loadedRanges, fetchAdditionalRange]
  );

  return (
    <div className='flex flex-col h-screen bg-background'>
      {/* Header */}
      <header className='border-b'>
        <div className='flex items-center justify-between px-6 py-4'>
          <div className='flex items-center gap-3'>
            <Calendar className='h-6 w-6 text-primary' />
            <h1 className='text-2xl font-semibold text-foreground'>MatterTraffic Calendar</h1>
          </div>

          <div className='flex items-center gap-4'>
            {user && <span className='text-sm text-muted-foreground'>{user.email}</span>}
            <ThemeToggle />

            {/* Admin button - only visible for admin users */}
            {user?.role === 'admin' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => navigate('/admin')}
                className='gap-2'
              >
                <Settings className='h-4 w-4' />
                <span>Administration</span>
              </Button>
            )}

            <Button variant='outline' size='sm' onClick={handleLogout} className='gap-2'>
              <LogOut className='h-4 w-4 text-foreground' />
              <span className='text-foreground'>Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Calendar Container */}
      <main className='flex-1 p-6 overflow-auto'>
        <div className='h-full max-w-[1600px] mx-auto'>
          {isInitialLoad && tasks.length === 0 ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
                <p className='mt-4 text-muted-foreground'>Chargement du calendrier...</p>
              </div>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center h-full'>
              <div className='text-center'>
                <p className='text-destructive'>Erreur lors du chargement des tâches</p>
                <p className='text-sm text-muted-foreground mt-2'>
                  Affichage des données de démonstration
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Calendar controls */}
              <div className='mb-4 flex items-start justify-between'>
                {/* Left side: Sync indicator */}
                <SyncIndicator
                  showDetails
                  tasksCount={tasks.length}
                  isLoadingBackground={isLoadingBackground}
                  hasPendingLocalUpdates={taskUpdate.hasPendingUpdates}
                  lastRefresh={lastRefresh}
                  nextRefresh={nextRefresh}
                  loadedRangesCount={loadedRanges.length}
                  onRefresh={() => {
                    clearCache();
                    // Reload initial range
                    const now = new Date();
                    fetchAdditionalRange(addDays(now, -30), addDays(now, 30));
                  }}
                />
                
                {/* Right side: Period display, view switcher and date navigator */}
                <div className='flex flex-col items-end gap-2'>
                  {/* Top row: Period display + View switcher */}
                  <div className='flex items-center gap-4'>
                    <PeriodDisplay currentDate={currentDate} currentView={currentView} />
                    <ViewSwitcher currentView={currentView} onViewChange={handleViewChange} />
                  </div>
                  
                  {/* Bottom row: Date navigator aligned under view switcher */}
                  <DateNavigator onNavigate={handleDateNavigate} />
                </div>
              </div>

              {/* Calendrier ou message si aucune tâche */}
              {tasks.length === 0 ? (
                <div className='flex items-center justify-center h-full'>
                  <div className='text-center'>
                    <Calendar className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-lg font-medium'>Aucune tâche pour cette période</p>
                    <p className='text-sm text-muted-foreground mt-2'>
                      Les tâches apparaîtront ici une fois synchronisées avec Notion
                    </p>
                  </div>
                </div>
              ) : currentView === 'day' ? (
                <DayView
                  date={currentDate}
                  tasks={tasks}
                  members={members}
                  onTaskClick={task => {
                    setSelectedTask(task);
                    setSheetOpen(true);
                  }}
                  onTimeSlotClick={(member, date, hour) => {
                    toast.info('Créneau sélectionné', {
                      description: `${member ? member.name : 'Non assigné'} - ${hour}:00`,
                    });
                  }}
                  onTaskDrop={(task, newMemberId, newDate) => {
                    toast.info('Drag & Drop', {
                      description: 'Fonctionnalité à venir',
                    });
                  }}
                />
              ) : (
                <CalendarView
                  ref={calendarRef}
                  events={events}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                  onDatesChange={handleDatesChange}
                  currentView={currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Sheet d'édition de tâche */}
      <TaskEditSheet
        task={selectedTask}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setSelectedTask(null);
        }}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </div>
  );
}
