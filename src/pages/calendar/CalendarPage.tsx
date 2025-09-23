import { useState, useEffect, useMemo, useCallback } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ThemeToggle } from '@/components/shared/feedback/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, RefreshCw, Loader2, Settings } from 'lucide-react';
import { EventInput } from '@fullcalendar/core';
import { useProgressiveCalendarTasks } from '@/hooks/useProgressiveCalendarTasks';
import { useOptimisticTaskUpdate } from '@/hooks/useOptimisticTaskUpdate';
import { SyncIndicator } from '@/components/shared/SyncIndicator';
import { toast } from 'sonner';
import { tasksToCalendarEvents, formatTaskForDisplay } from '@/utils/taskMapper';
import { addDays } from 'date-fns';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
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
    refreshAllRanges
  } = useProgressiveCalendarTasks({
    enablePolling: true,
    pollingInterval: 2 * 60 * 1000 // 2 minutes when active
  });
  
  // Initialize optimistic update hook
  const taskUpdate = useOptimisticTaskUpdate(tasks, setTasks, {
    tasksMapRef,
    onMutationSuccess: refreshAllRanges
  });
  
  // Track if initial load is complete
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    // Mark initial load as complete after first data arrives
    if (tasks.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [tasks.length, isInitialLoad]);

  // Convert tasks to calendar events
  const events = useMemo(() => {
    if (tasks && tasks.length > 0) {
      return tasksToCalendarEvents(tasks);
    }
    return [];
  }, [tasks]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Erreur", {
        description: "Impossible de se déconnecter",
      });
    }
  };

  const handleDateClick = (arg: any) => {
    toast.info("Date sélectionnée", {
      description: `Vous avez cliqué sur ${arg.dateStr}`,
    });
  };

  const handleEventClick = (arg: any) => {
    const task = {
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
      }
    };
    
    // Utiliser toast comme tooltip pour afficher les détails
    toast.info(arg.event.title, {
      description: formatTaskForDisplay(task),
      duration: 5000, // Afficher 5 secondes
    });
  };

  // Gérer le changement de période visible dans le calendrier
  const handleDatesChange = useCallback((start: Date, end: Date) => {
    setVisiblePeriod({ start, end });
    
    // Check if we're getting close to the edge of loaded data
    // We want to preload before user reaches the edge for smooth experience
    const marginDays = 7; // Preload when within 7 days of edge
    
    // Check if any loaded range covers the visible period
    const isCurrentlyCovered = loadedRanges.some(range => 
      start >= range.start && end <= range.end
    );
    
    if (!isCurrentlyCovered) {
      // Need to load data for current view
      const extendedStart = addDays(start, -marginDays);
      const extendedEnd = addDays(end, marginDays);
      fetchAdditionalRange(extendedStart, extendedEnd);
      return;
    }
    
    // Check if we're approaching the edges
    const earliestLoaded = loadedRanges.reduce((min, range) => 
      !min || range.start < min ? range.start : min, null as Date | null
    );
    
    const latestLoaded = loadedRanges.reduce((max, range) => 
      !max || range.end > max ? range.end : max, null as Date | null
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
  }, [loadedRanges, fetchAdditionalRange]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">MatterTraffic Calendar</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sync indicator for optimistic updates */}
            <SyncIndicator showDetails />
            
            {user && (
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            )}
            <ThemeToggle />
            
            {/* Admin button - only visible for admin users */}
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                <span>Administration</span>
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="h-4 w-4 text-foreground" />
              <span className="text-foreground">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Calendar Container */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="h-full max-w-[1600px] mx-auto">
          {isInitialLoad && tasks.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Chargement du calendrier...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-destructive">Erreur lors du chargement des tâches</p>
                <p className="text-sm text-muted-foreground mt-2">Affichage des données de démonstration</p>
              </div>
            </div>
          ) : (
            <>
              {/* Afficher indicateur de cache et nombre de tâches */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {tasks.length} tâche{tasks.length > 1 ? 's' : ''} trouvée{tasks.length > 1 ? 's' : ''}
                  </span>
                  {isLoadingBackground && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Chargement en arrière-plan
                    </span>
                  )}
                  {taskUpdate.hasPendingUpdates && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Synchronisation des modifications...
                    </span>
                  )}
                  {loadedRanges.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {loadedRanges.length} période{loadedRanges.length > 1 ? 's' : ''} chargée{loadedRanges.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {lastRefresh && (
                    <span className="text-xs text-muted-foreground" title={`Prochaine actualisation: ${nextRefresh?.toLocaleTimeString('fr-FR') || 'N/A'}`}>
                      Dernière MAJ: {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearCache();
                    // Reload initial range
                    const now = new Date();
                    fetchAdditionalRange(addDays(now, -30), addDays(now, 30));
                  }}
                  className="gap-2"
                  disabled={isLoadingBackground}
                >
                  <RefreshCw className={`h-3 w-3 ${isLoadingBackground ? 'animate-spin' : ''}`} />
                  {isLoadingBackground ? 'Chargement...' : 'Actualiser'}
                </Button>
              </div>
              
              {/* Calendrier ou message si aucune tâche */}
              {tasks.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-medium">Aucune tâche pour cette période</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Les tâches apparaîtront ici une fois synchronisées avec Notion
                    </p>
                  </div>
                </div>
              ) : (
                <CalendarView 
                  events={events}
                  onDateClick={handleDateClick}
                  onEventClick={handleEventClick}
                  onDatesChange={handleDatesChange}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}