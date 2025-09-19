import { useState, useEffect, useMemo } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ThemeToggle } from '@/components/shared/feedback/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar, RefreshCw } from 'lucide-react';
import { EventInput } from '@fullcalendar/core';
import { useCalendarTasks } from '@/hooks/useCalendarTasks';
import { toast } from 'sonner';
import { tasksToCalendarEvents, formatTaskForDisplay } from '@/utils/taskMapper';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  // Date range for calendar - default to current month with some buffer
  const [dateRange] = useState(() => {
    const now = new Date();
    return {
      startDate: addDays(startOfMonth(now), -7), // 7 days before month start
      endDate: addDays(endOfMonth(now), 7) // 7 days after month end
    };
  });
  
  // Fetch tasks for calendar
  const { tasks, isLoading, error, cacheHit, refetch } = useCalendarTasks({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

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
      projectId: arg.event.extendedProps.projectId,
      clientId: arg.event.extendedProps.clientId,
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
            {user && (
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            )}
            <ThemeToggle />
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
          {isLoading ? (
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
                  {cacheHit && (
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      Depuis le cache
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Actualiser
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
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}