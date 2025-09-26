import { useState, useMemo } from 'react';
import { DayView } from '@/components/calendar/DayView';
import { Task } from '@/types/task.types';
import { Member } from '@/types/calendar.types';
import { useProgressiveCalendarTasks } from '@/hooks/useProgressiveCalendarTasks';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import { format, addDays } from 'date-fns';

/**
 * Page de test pour la vue Day personnalisée
 */
export default function DayViewTest() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Charger les tâches depuis l'API
  const { 
    tasks, 
    isLoadingBackground,
    error 
  } = useProgressiveCalendarTasks({
    enablePolling: false // Pas de polling pour les tests
  });

  // Extraire les membres uniques depuis les tâches
  const members: Member[] = useMemo(() => {
    const memberMap = new Map<string, Member>();
    
    // D'abord, créer une map de toutes les équipes disponibles (ID -> nom)
    // depuis teamsData et involvedTeamsData qui contiennent les objets complets
    const allTeamsMap = new Map<string, string>();
    
    tasks.forEach(task => {
      // Collecter les équipes depuis teamsData (objets complets)
      if (task.teamsData) {
        task.teamsData.forEach(team => {
          allTeamsMap.set(team.id, team.name);
        });
      }
      // Collecter aussi depuis involvedTeamsData (objets complets)
      if (task.involvedTeamsData) {
        task.involvedTeamsData.forEach(team => {
          allTeamsMap.set(team.id, team.name);
        });
      }
    });
    
    // Maintenant, créer les membres avec les noms d'équipes résolus
    tasks.forEach(task => {
      if (task.assignedMembersData) {
        task.assignedMembersData.forEach(memberData => {
          if (!memberMap.has(memberData.id)) {
            // memberData.teams contient des IDs d'équipes (string[])
            // On doit les résoudre en noms via notre map
            let resolvedTeams: string[] = [];
            
            if (memberData.teams && Array.isArray(memberData.teams)) {
              resolvedTeams = memberData.teams
                .map(teamId => allTeamsMap.get(teamId))
                .filter((name): name is string => !!name); // Garde seulement les noms résolus
            }
            
            memberMap.set(memberData.id, {
              id: memberData.id,
              name: memberData.name,
              email: memberData.email,
              teams: resolvedTeams.length > 0 ? resolvedTeams : undefined
            });
          }
        });
      }
    });

    // Ajouter quelques membres de test si aucun n'est trouvé
    if (memberMap.size === 0) {
      // Extraire depuis assignedMembers (IDs seulement)
      const memberIds = new Set<string>();
      tasks.forEach(task => {
        if (task.assignedMembers) {
          task.assignedMembers.forEach(id => memberIds.add(id));
        }
      });

      // Créer des membres basiques avec les IDs
      let counter = 1;
      memberIds.forEach(id => {
        memberMap.set(id, {
          id,
          name: `Membre ${counter++}`,
          email: `member${counter}@example.com`
        });
      });
    }

    // Si toujours aucun membre, ajouter des membres de démo
    if (memberMap.size === 0) {
      memberMap.set('demo-1', {
        id: 'demo-1',
        name: 'Alice Martin',
        email: 'alice@example.com',
        teams: ['Dev Team']
      });
      memberMap.set('demo-2', {
        id: 'demo-2',
        name: 'Bob Dupont',
        email: 'bob@example.com',
        teams: ['Design Team']
      });
      memberMap.set('demo-3', {
        id: 'demo-3',
        name: 'Charlie Durand',
        email: 'charlie@example.com',
        teams: ['Dev Team', 'QA Team']
      });
    }

    return Array.from(memberMap.values());
  }, [tasks]);

  // Handlers
  const handleTaskClick = (task: Task) => {
    toast.info('Tâche sélectionnée', {
      description: `${task.title} - ${task.status}`,
      duration: 2000
    });
  };

  const handleTimeSlotClick = (member: Member | null, date: Date, hour: number) => {
    const memberName = member ? member.name : 'Non assigné';
    toast.info('Créneau sélectionné', {
      description: `${memberName} - ${format(date, 'dd/MM/yyyy')} à ${hour}:00`,
      duration: 2000
    });
  };

  const handleTaskDrop = (task: Task, newMember: string | null, newDate: Date) => {
    const memberName = newMember ? 
      members.find(m => m.id === newMember)?.name || 'Inconnu' : 
      'Non assigné';
    
    toast.success('Tâche déplacée', {
      description: `${task.title} → ${memberName} le ${format(newDate, 'dd/MM HH:mm')}`,
      duration: 3000
    });
  };

  // Navigation entre les jours
  const navigateDay = (direction: number) => {
    setCurrentDate(prev => addDays(prev, direction));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500">Erreur de chargement</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header de test */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Calendar className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Test Vue Jour</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Aujourd'hui
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {members.length} membres • {tasks.length} tâches
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 p-2 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDay(-7)}
        >
          « Semaine
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDay(-1)}
        >
          ‹ Jour
        </Button>
        
        <div className="px-4 py-1 bg-primary/10 rounded-md">
          {format(currentDate, 'EEEE d MMMM yyyy')}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDay(1)}
        >
          Jour ›
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigateDay(7)}
        >
          Semaine »
        </Button>
      </div>

      {/* DayView Component */}
      <div className="flex-1 overflow-hidden">
        <DayView
          date={currentDate}
          tasks={tasks}
          members={members}
          onTaskClick={handleTaskClick}
          onTimeSlotClick={handleTimeSlotClick}
          onTaskDrop={handleTaskDrop}
        />
      </div>

      {/* Loading indicator */}
      {isLoadingBackground && (
        <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-md border">
          <p className="text-xs text-muted-foreground">Chargement...</p>
        </div>
      )}
    </div>
  );
}