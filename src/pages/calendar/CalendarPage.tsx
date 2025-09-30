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
import { useCalendarConfigStore } from '@/store/calendar-config.store';
import { useClientColors } from '@/store/config.store';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, Settings } from 'lucide-react';
import { EventInput } from '@fullcalendar/core';
import { useProgressiveCalendarTasks } from '@/hooks/useProgressiveCalendarTasks';
import { useOptimisticTaskUpdate } from '@/hooks/useOptimisticTaskUpdate';
import { useCalendarEvents } from '@/hooks/calendar/useCalendarEvents';
import { useCalendarNavigation } from '@/hooks/calendar/useCalendarNavigation';
import { useCalendarTaskManagement } from '@/hooks/calendar/useCalendarTaskManagement';
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

  // Initialize client colors early for reactivity with admin panel
  useClientColors();

  // Use calendar store instead of local state
  const { currentView, currentDate, setCurrentView, setCurrentDate } = useCalendarStore();
  
  // Get calendar configuration
  const { config: calendarConfig, fetchConfig } = useCalendarConfigStore();


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

  // Use calendar hooks
  const {
    selectedTask,
    setSelectedTask,
    sheetOpen,
    setSheetOpen,
    handleTaskUpdate,
    handleTaskDelete,
  } = useCalendarTaskManagement(taskUpdate, tasksMapRef, setTasks);

  const {
    handleEventClick,
    handleEventDrop,
    handleEventResize,
  } = useCalendarEvents(setSelectedTask, setSheetOpen, taskUpdate);

  const {
    handleViewChange,
    handleDateNavigate,
    handleDatesChange,
  } = useCalendarNavigation(
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

  useEffect(() => {
    // Mark initial load as complete after first data arrives
    if (tasks.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [tasks.length, isInitialLoad]);

  // Load calendar configuration on mount
  useEffect(() => {
    if (!calendarConfig) {
      fetchConfig();
    }
  }, [calendarConfig, fetchConfig]);

  // Sync FullCalendar with store on mount and when view/date changes
  useEffect(() => {
    if (calendarRef.current && currentView !== 'day') {
      const api = calendarRef.current.getApi();
      
      // Update view and date atomically
      const fcView = currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth';
      if (api.view.type !== fcView) {
        // changeView with date parameter changes both view and date
        api.changeView(fcView, currentDate);
      } else {
        // If view is already correct, just update the date
        api.gotoDate(currentDate);
      }
    }
  }, [currentView, currentDate]);

  // Convert tasks to calendar events with view configuration
  const events = useMemo(() => {
    if (tasks && tasks.length > 0) {
      // Get the appropriate view config based on current view
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
      return tasksToCalendarEvents(tasks, viewConfig);
    }
    return [];
  }, [tasks, calendarConfig, currentView]);

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
                  viewConfig={calendarConfig?.dayView}
                  onTaskClick={task => {
                    setSelectedTask(task);
                    setSheetOpen(true);
                  }}
                  onTimeSlotClick={(member, date, hour) => {
                    toast.info('Créneau sélectionné', {
                      description: `${member ? member.name : 'Non assigné'} - ${hour}:00`,
                    });
                  }}
                  onTaskDrop={(task, newMemberId, newDate, sourceMemberId) => {
                    if (!task.workPeriod) return;
                    
                    // Calculer la durée originale de la tâche en millisecondes
                    const originalStart = new Date(task.workPeriod.startDate);
                    const originalEnd = new Date(task.workPeriod.endDate);
                    const duration = originalEnd.getTime() - originalStart.getTime();
                    
                    // Calculer la nouvelle heure de fin en ajoutant la durée à la nouvelle heure de début
                    const newEndDate = new Date(newDate.getTime() + duration);
                    
                    // Mise à jour optimiste de la tâche avec la nouvelle date
                    const updates: any = {
                      workPeriod: {
                        startDate: newDate.toISOString(),
                        endDate: newEndDate.toISOString(),
                      },
                    };

                    // Gestion du changement de membre
                    const currentMembers = task.assignedMembers || [];
                    
                    if (newMemberId === null) {
                      // Drop sur la colonne non-assigné : retirer tous les membres
                      updates.assignedMembers = [];
                      updates.assignedMembersData = [];
                    } else if (newMemberId) {
                      // Drop sur une colonne membre
                      let updatedMembers = [...currentMembers];
                      
                      // Si on a un membre source et qu'il est différent du membre cible
                      if (sourceMemberId && sourceMemberId !== '' && sourceMemberId !== newMemberId) {
                        // Retirer le membre source de la liste
                        updatedMembers = updatedMembers.filter(id => id !== sourceMemberId);
                      }
                      
                      // Si le membre cible n'est pas déjà dans la liste, l'ajouter
                      if (!updatedMembers.includes(newMemberId)) {
                        updatedMembers.push(newMemberId);
                      }
                      
                      // Mettre à jour les membres si changement
                      if (updatedMembers.length !== currentMembers.length || 
                          !updatedMembers.every(id => currentMembers.includes(id))) {
                        updates.assignedMembers = updatedMembers;
                        
                        // Reconstruire assignedMembersData
                        updates.assignedMembersData = updatedMembers
                          .map(memberId => members.find(m => m.id === memberId))
                          .filter(Boolean)
                          .map(member => ({
                            id: member!.id,
                            name: member!.name,
                            email: member!.email || '',
                            teams: Array.isArray(member!.teams) ? member!.teams : []
                          }));
                      }
                    }

                    taskUpdate.mutate({
                      id: task.id,
                      updates,
                    });
                  }}
                  onTaskResize={(task, newStartDate, newEndDate) => {
                    // Resize de la tâche avec mise à jour optimiste
                    taskUpdate.mutate({
                      id: task.id,
                      updates: {
                        workPeriod: {
                          startDate: newStartDate.toISOString(),
                          endDate: newEndDate.toISOString(),
                        },
                      },
                    });
                  }}
                />
              ) : (
                <CalendarView
                  ref={calendarRef}
                  events={events}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                  onEventDrop={handleEventDrop}
                  onEventResize={handleEventResize}
                  onDatesChange={handleDatesChange}
                  onNavLinkDayClick={(date) => {
                    // Switch to day view and set the selected date
                    setCurrentView('day');
                    setCurrentDate(date);
                  }}
                  currentView={currentView === 'week' ? 'timeGridWeek' : 'dayGridMonth'}
                  currentDate={currentDate}
                  showWeekends={calendarConfig?.showWeekends ?? true}
                  viewConfig={currentView === 'week' ? calendarConfig?.weekView : calendarConfig?.monthView}
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
