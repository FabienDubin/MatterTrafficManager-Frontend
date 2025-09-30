import { useMemo, useCallback, useRef, useEffect } from 'react';
import { Task } from '@/types/task.types';
import { Member, MemberColumnProps, TaskPosition } from '@/types/calendar.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Colonne pour un membre avec ses tâches positionnées
 */
export function MemberColumn({
  member,
  tasks,
  date,
  viewConfig,
  onTaskClick,
  onTimeSlotClick,
  onTaskDrop,
  holidayTask,
  remoteTask,
  schoolTask,
}: MemberColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragScrollInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate task positions to avoid overlaps
  const taskPositions = useMemo(() => {
    return calculateTaskPositions(tasks, date);
  }, [tasks, date]);

  // Auto-scroll pendant le drag et gestion ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Annuler le drag en cours
        const draggedElement = document.querySelector('[draggable="true"]:active');
        if (draggedElement) {
          // Force le navigateur à annuler le drag
          const event = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
          });
          draggedElement.dispatchEvent(event);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (dragScrollInterval.current) {
        clearInterval(dragScrollInterval.current);
      }
    };
  }, []);

  // Handle drop on time slot
  const handleDrop = useCallback(
    (e: React.DragEvent, hour: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Récupérer l'offset de drag stocké ou utiliser 0 par défaut
      const dragOffset = parseInt(e.dataTransfer.getData('dragOffsetY') || '0');
      
      // Calculer la position Y relative dans le slot pour déterminer les minutes
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top - dragOffset; // Soustraire l'offset pour positionner selon le haut de la tâche
      const slotHeight = rect.height;
      const minuteOffset = Math.max(0, Math.floor((relativeY / slotHeight) * 60));
      
      // Arrondir aux 15 minutes
      const roundedMinutes = Math.round(minuteOffset / 15) * 15;

      const taskData = e.dataTransfer.getData('task');
      const sourceMemberId = e.dataTransfer.getData('sourceMemberId');
      
      if (taskData && onTaskDrop) {
        const task = JSON.parse(taskData) as Task;
        const dropDate = new Date(date);
        dropDate.setHours(hour, roundedMinutes % 60, 0, 0);
        
        // Si les minutes arrondies dépassent 60, ajouter une heure
        if (roundedMinutes >= 60) {
          dropDate.setHours(hour + 1, 0, 0, 0);
        }

        console.log('Drop at', { 
          hour, 
          minuteOffset, 
          roundedMinutes, 
          finalTime: dropDate.toTimeString(),
          dragOffset,
          sourceMemberId,
          targetMemberId: member.id
        });

        // Alertes pour congés et formation (pas pour télétravail)
        if (holidayTask) {
          toast.warning(`Attention : ${member.name} est en congé ce jour`);
        } else if (schoolTask) {
          toast.warning(`Attention : ${member.name} est en formation ce jour`);
        }

        onTaskDrop(task, member.id, dropDate, sourceMemberId);
      }
    },
    [date, onTaskDrop, holidayTask, schoolTask, member.name]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Auto-scroll logic
    const container = e.currentTarget.closest('.flex-1.relative.overflow-hidden');
    if (!container) return;
    
    const scrollContainer = container.querySelector('.overflow-y-auto, [data-radix-scroll-area-viewport]') as HTMLElement;
    if (!scrollContainer) return;
    
    const rect = scrollContainer.getBoundingClientRect();
    const y = e.clientY;
    
    // Zone de déclenchement du scroll (50px du bord)
    const scrollZone = 50;
    const scrollSpeed = 10;
    
    // Clear existing interval
    if (dragScrollInterval.current) {
      clearInterval(dragScrollInterval.current);
      dragScrollInterval.current = null;
    }
    
    // Scroll vers le bas
    if (y > rect.bottom - scrollZone) {
      dragScrollInterval.current = setInterval(() => {
        scrollContainer.scrollTop += scrollSpeed;
      }, 20);
    }
    // Scroll vers le haut
    else if (y < rect.top + scrollZone) {
      dragScrollInterval.current = setInterval(() => {
        scrollContainer.scrollTop -= scrollSpeed;
      }, 20);
    }
  }, []);
  
  const handleDragLeave = useCallback(() => {
    // Stop scrolling when leaving the drop zone
    if (dragScrollInterval.current) {
      clearInterval(dragScrollInterval.current);
      dragScrollInterval.current = null;
    }
  }, []);

  // Handle time slot click for creating new task
  const handleTimeSlotClick = useCallback(
    (hour: number) => {
      if (onTimeSlotClick) {
        const clickDate = new Date(date);
        clickDate.setHours(hour, 0, 0, 0);
        onTimeSlotClick(clickDate, hour);
      }
    },
    [date, onTimeSlotClick]
  );

  // Get member initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Déterminer le style de la colonne selon le statut
  const columnClassName = cn(
    'flex-1 min-w-[200px] border-r',
    holidayTask && 'bg-muted/80', // Grisé pour congés
    schoolTask && 'bg-blue-50/80 dark:bg-blue-950/20' // Bleuté pour formation
    // Pas de style spécial pour télétravail
  );

  return (
    <div className={columnClassName}>
      {/* Member header */}
      <div className='sticky top-0 z-30 bg-muted/30 border-b px-3 h-[4.5rem] flex items-center'>
        <div className='flex items-center gap-2 w-full'>
          <Avatar className='h-7 w-7'>
            <AvatarImage src={`/avatars/${member.id}.png`} alt={member.name} />
            <AvatarFallback className='text-xs'>{getInitials(member.name)}</AvatarFallback>
          </Avatar>
          <div className='flex-1 min-w-0'>
            <p className='text-sm font-medium truncate'>{member.name}</p>
            {/* Afficher les équipes si disponibles */}
            {(() => {
              // Priorité 1: teamsData (données enrichies)
              if (member.teamsData && member.teamsData.length > 0) {
                return (
                  <p className='text-xs text-muted-foreground truncate'>
                    {member.teamsData.map(t => t.name).join(', ')}
                  </p>
                );
              }
              // Priorité 2: teams (peut être des strings ou des objets)
              if (member.teams && member.teams.length > 0) {
                const teamNames = member.teams.map(team =>
                  typeof team === 'object' && 'name' in team ? team.name : (team as string)
                );
                // N'afficher que si ce ne sont pas des IDs UUID
                const hasNames = teamNames.some(t => !t.includes('-'));
                if (hasNames) {
                  return (
                    <p className='text-xs text-muted-foreground truncate'>{teamNames.join(', ')}</p>
                  );
                }
              }
              return null;
            })()}
          </div>
          <div className='flex flex-col items-end gap-0.5'>
            {/* Badges de statut - emoji seulement avec tooltip */}
            {(holidayTask || remoteTask || schoolTask) && (
              <div className='flex gap-1'>
                <TooltipProvider>
                  {holidayTask && (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className='cursor-default'>
                          <Badge variant='secondary' className='text-xs px-1.5 h-5'>
                            🏖️
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='text-xs'>Congé</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {remoteTask && (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className='cursor-default'>
                          <Badge variant='outline' className='text-xs px-1.5 h-5'>
                            🏠
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='text-xs'>Télétravail</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {schoolTask && (
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <div className='cursor-default'>
                          <Badge variant='secondary' className='text-xs px-1.5 h-5'>
                            📚
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className='text-xs'>Formation</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            )}
            {/* Badge du nombre de tâches */}
            <Badge
              variant='secondary'
              className='text-xs h-5 min-w-[1.25rem] flex items-center justify-center'
            >
              {tasks.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Time slots with tasks */}
      <div className='relative'>
        {/* Hour slots for drop zones */}
        {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => {
          const slotHeight = `calc((100vh - 200px) / 13)`;
          return (
            <div
              key={hour}
              className='border-b hover:bg-muted/5 cursor-pointer transition-colors'
              style={{ height: slotHeight }}
              onDrop={e => handleDrop(e, hour)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => handleTimeSlotClick(hour)}
            >
              {/* Half-hour line */}
              <div className='border-b border-dashed border-muted-foreground/20' style={{ height: `calc(${slotHeight} / 2)` }} />
            </div>
          );
        })}

        {/* Positioned tasks */}
        {taskPositions.map((pos, index) => (
          <div
            key={pos.task.id}
            className='absolute'
            style={{
              top: `${pos.top}px`,
              height: `${pos.height}px`,
              left: `${pos.left}%`,
              width: `${pos.width}%`,
              zIndex: 10 + index,
            }}
          >
            <TaskCard
              task={pos.task}
              viewConfig={viewConfig}
              onClick={() => onTaskClick?.(pos.task)}
              showTime={true}
              compact={pos.height < 50}
              draggable={true}
              className='h-full hover:scale-[1.02]'
              onDragStart={(e) => {
                // Capturer l'offset Y du clic par rapport au haut de la tâche
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;
                
                e.dataTransfer.setData('task', JSON.stringify(pos.task));
                e.dataTransfer.setData('dragOffsetY', offsetY.toString());
                e.dataTransfer.setData('sourceMemberId', member.id); // Ajouter le membre source
                e.dataTransfer.effectAllowed = 'move';
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Calculate non-overlapping positions for tasks
 */
function calculateTaskPositions(tasks: Task[], date: Date): TaskPosition[] {
  if (tasks.length === 0) {
    return [];
  }

  // Calculate slot height dynamically (viewport - header - padding) / 13 hours
  const viewportHeight = window.innerHeight;
  const hourHeight = (viewportHeight - 200) / 13;

  // Filter and sort tasks by start time
  const dayStart = new Date(date);
  dayStart.setHours(8, 0, 0, 0); // Changed to 8 AM start

  const sortedTasks = tasks
    .filter(task => task.workPeriod)
    .sort((a, b) => {
      const aStart = new Date(a.workPeriod!.startDate);
      const bStart = new Date(b.workPeriod!.startDate);
      return aStart.getTime() - bStart.getTime();
    });

  const positions: TaskPosition[] = [];
  const columns: { endTime: number }[] = [];

  sortedTasks.forEach(task => {
    const startTime = new Date(task.workPeriod!.startDate);
    const endTime = new Date(task.workPeriod!.endDate);

    // Calculate vertical position (top and height)
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;

    // Position relative to 8:00 AM start
    const top = (startHour - 8) * hourHeight; // Dynamic height per hour
    const height = Math.max((endHour - startHour) * hourHeight, 20); // Minimum 20px height

    // Find available column
    let columnIndex = columns.findIndex(col => col.endTime <= startTime.getTime());
    if (columnIndex === -1) {
      columnIndex = columns.length;
      columns.push({ endTime: endTime.getTime() });
    } else {
      columns[columnIndex].endTime = endTime.getTime();
    }

    // Calculate horizontal position
    const totalColumns = Math.max(columns.length, 1);
    const width = 100 / totalColumns;
    const left = columnIndex * width;

    positions.push({
      task,
      top,
      height,
      left,
      width,
    });
  });

  // Adjust widths for all tasks based on max columns
  const maxColumns = columns.length;
  if (maxColumns > 1) {
    positions.forEach(pos => {
      pos.width = 100 / maxColumns;
    });
  }

  return positions;
}
