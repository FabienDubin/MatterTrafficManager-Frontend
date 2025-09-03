import { useState, useEffect } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ThemeToggle } from '@/components/shared/feedback/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { LogOut, Calendar } from 'lucide-react';
import { EventInput } from '@fullcalendar/core';
import { useTasks } from '@/hooks/api/useTasks';
import { useToast } from '@/hooks/use-toast';
import { tasksToCalendarEvents, formatTaskForDisplay } from '@/utils/taskMapper';

export default function CalendarPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useAuthStore();
  const { data: tasks, isLoading, error } = useTasks();
  const [events, setEvents] = useState<EventInput[]>([]);

  // Convert tasks to calendar events
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      const calendarEvents = tasksToCalendarEvents(tasks);
      setEvents(calendarEvents);
    }
  }, [tasks]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  const handleDateClick = (arg: any) => {
    toast({
      title: "Date sélectionnée",
      description: `Vous avez cliqué sur ${arg.dateStr}`,
    });
  };

  const handleEventClick = (arg: any) => {
    const task = {
      id: arg.event.id,
      title: arg.event.title,
      status: arg.event.extendedProps.status,
      description: arg.event.extendedProps.description,
      assignedMembers: arg.event.extendedProps.assignedMembers,
      workPeriod: {
        startDate: arg.event.startStr,
        endDate: arg.event.endStr,
      }
    };
    
    toast({
      title: arg.event.title,
      description: formatTaskForDisplay(task),
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">MatterTraffic Calendar</h1>
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
              <LogOut className="h-4 w-4" />
              Déconnexion
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
            <CalendarView 
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
            />
          )}
        </div>
      </main>
    </div>
  );
}