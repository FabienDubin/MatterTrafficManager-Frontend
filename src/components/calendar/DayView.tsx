import { useMemo } from 'react';
import { Task } from '@/types/task.types';
import { DayViewProps } from '@/types/calendar.types';
import { MemberColumn } from './MemberColumn';
import { UnassignedColumn } from './UnassignedColumn';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

/**
 * Vue Jour personnalisée avec colonnes par membre
 * Affiche les tâches dans des colonnes verticales pour chaque membre
 * Plus une colonne "Non assigné"
 */
export function DayView({
  date,
  tasks,
  members,
  viewConfig,
  onTaskClick,
  onTimeSlotClick,
  onTaskDrop,
}: DayViewProps) {
  // Filtrer les tâches pour la journée actuelle
  const dayTasks = useMemo(() => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      if (!task.workPeriod) {return false;}

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


  return (
    <div className='h-full border border-border rounded-lg overflow-hidden'>
      <div className='flex flex-col h-full bg-background'>
        {/* Time grid with member columns */}
        <div className='flex-1 relative overflow-hidden'>
          <div className='flex h-full'>
            {/* Fixed Time labels column */}
            <div className='w-20 flex-shrink-0 border-r sticky left-0 z-20 bg-background'>
              <div className='bg-muted/30 border-b px-2 py-3'>
                <span className='text-xs font-medium text-muted-foreground'>Heures</span>
              </div>

              {/* Hour labels */}
              <div className='relative'>
                {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
                  <div
                    key={hour}
                    className='h-20 border-b text-xs text-muted-foreground px-2 py-1 bg-background'
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable columns container */}
            <ScrollArea className='flex-1'>
              <div className='flex min-h-full'>
                {/* Member columns */}
                {members.map(member => (
                  <MemberColumn
                    key={member.id}
                    member={member}
                    tasks={assignedTasks.get(member.id) || []}
                    date={date}
                    viewConfig={viewConfig}
                    onTaskClick={onTaskClick}
                    onTimeSlotClick={(date, hour) => onTimeSlotClick?.(member, date, hour)}
                    onTaskDrop={(task, newDate) => onTaskDrop?.(task, member.id, newDate)}
                  />
                ))}

                {/* Unassigned tasks column */}
                {unassignedTasks.length > 0 && (
                  <UnassignedColumn
                    tasks={unassignedTasks}
                    date={date}
                    viewConfig={viewConfig}
                    onTaskClick={onTaskClick}
                    onTimeSlotClick={(date, hour) => onTimeSlotClick?.(null, date, hour)}
                    onTaskDrop={(task, newDate) => onTaskDrop?.(task, null, newDate)}
                  />
                )}
              </div>
              <ScrollBar orientation='horizontal' />
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
