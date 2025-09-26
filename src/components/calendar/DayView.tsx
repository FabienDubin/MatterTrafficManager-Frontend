import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Task } from '@/types/task.types';
import { Member, DayViewProps } from '@/types/calendar.types';
import { MemberColumn } from './MemberColumn';
import { UnassignedColumn } from './UnassignedColumn';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

/**
 * Vue Jour personnalisée avec colonnes par membre
 * Affiche les tâches dans des colonnes verticales pour chaque membre
 * Plus une colonne "Non assigné"
 */
export function DayView({
  date,
  tasks,
  members,
  onTaskClick,
  onTimeSlotClick,
  onTaskDrop
}: DayViewProps) {
  // Filtrer les tâches pour la journée actuelle
  const dayTasks = useMemo(() => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      if (!task.workPeriod) return false;
      
      const taskStart = new Date(task.workPeriod.startDate);
      const taskEnd = new Date(task.workPeriod.endDate);
      
      // Check if task overlaps with this day
      return taskStart <= dayEnd && taskEnd >= dayStart;
    });
  }, [tasks, date]);

  // Séparer les tâches assignées et non assignées
  const { assignedTasks, unassignedTasks } = useMemo(() => {
    const assigned: Map<string, Task[]> = new Map();
    const unassigned: Task[] = [];

    // Initialize map for each member
    members.forEach(member => {
      assigned.set(member.id, []);
    });

    dayTasks.forEach(task => {
      if (!task.assignedMembers || task.assignedMembers.length === 0) {
        unassigned.push(task);
      } else {
        // Add to each assigned member's column
        task.assignedMembers.forEach(memberId => {
          const memberTasks = assigned.get(memberId) || [];
          memberTasks.push(task);
          assigned.set(memberId, memberTasks);
        });
      }
    });

    return { assignedTasks: assigned, unassignedTasks: unassigned };
  }, [dayTasks, members]);

  // Navigate to previous/next day
  const navigateDay = (direction: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + direction);
    // This would need to be connected to the calendar navigation
    // For now, it's just a placeholder
    console.log('Navigate to:', newDate);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDay(-1)}
            title="Jour précédent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateDay(1)}
            title="Jour suivant"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {dayTasks.length} tâche{dayTasks.length > 1 ? 's' : ''} aujourd'hui
        </div>
      </div>

      {/* Time grid with member columns */}
      <ScrollArea className="flex-1">
        <div className="min-h-full">
          <div className="flex">
            {/* Time labels column */}
            <div className="w-20 flex-shrink-0 border-r bg-muted/10">
              <div className="sticky top-0 z-10 bg-background border-b px-2 py-3">
                <span className="text-xs font-medium text-muted-foreground">Heures</span>
              </div>
              
              {/* Hour labels */}
              <div className="relative">
                {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
                  <div
                    key={hour}
                    className="h-20 border-b text-xs text-muted-foreground px-2 py-1"
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Member columns */}
            <div className="flex-1 flex">
              {members.map(member => (
                <MemberColumn
                  key={member.id}
                  member={member}
                  tasks={assignedTasks.get(member.id) || []}
                  date={date}
                  onTaskClick={onTaskClick}
                  onTimeSlotClick={onTimeSlotClick}
                  onTaskDrop={onTaskDrop}
                />
              ))}

              {/* Unassigned tasks column */}
              {unassignedTasks.length > 0 && (
                <UnassignedColumn
                  tasks={unassignedTasks}
                  date={date}
                  onTaskClick={onTaskClick}
                  onTimeSlotClick={onTimeSlotClick}
                  onTaskDrop={onTaskDrop}
                />
              )}
            </div>
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}