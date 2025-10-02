import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { format } from 'date-fns';
import { Task } from '@/types/task.types';
import { Member, MemberColumnProps, TaskPosition } from '@/types/calendar.types';
import { TaskWithConflicts } from '@/types/task.types';
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
  hourGridHeight,
  onTaskClick,
  onTimeSlotClick,
  onTimeSlotSelect,
  onTaskDrop,
  onTaskResize,
  holidayTask,
  remoteTask,
  schoolTask,
}: MemberColumnProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragScrollInterval = useRef<NodeJS.Timeout | null>(null);
  const timeSlotsRef = useRef<HTMLDivElement>(null);

  // État pour la gestion du resize
  const [resizingTask, setResizingTask] = useState<{
    taskId: string;
    type: 'top' | 'bottom';
    startY: number;
    originalStartDate: Date;
    originalEndDate: Date;
    tempStartDate?: Date;
    tempEndDate?: Date;
  } | null>(null);

  // État pour la sélection (click & drag)
  const [selecting, setSelecting] = useState<{
    startY: number;
    currentY: number;
    startHour: number;
    startMinute: number;
  } | null>(null);

  // État pour le tooltip de resize
  const [resizeTooltip, setResizeTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    timeRange: string;
  } | null>(null);

  // Calculate task positions to avoid overlaps
  const taskPositions = useMemo(() => {
    console.log('🔍 MemberColumn - hourGridHeight:', hourGridHeight);
    const positions = calculateTaskPositions(tasks, date, hourGridHeight);

    // Override position pour la tâche en cours de resize
    if (resizingTask && resizingTask.tempStartDate && resizingTask.tempEndDate) {
      const resizeIndex = positions.findIndex(p => p.task.id === resizingTask.taskId);
      if (resizeIndex !== -1) {
        // Recalculer la position avec les dates temporaires
        const startHour =
          resizingTask.tempStartDate.getHours() + resizingTask.tempStartDate.getMinutes() / 60;
        const endHour =
          resizingTask.tempEndDate.getHours() + resizingTask.tempEndDate.getMinutes() / 60;

        const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;

        positions[resizeIndex] = {
          ...positions[resizeIndex],
          top: (startHour - 8) * hourHeight,
          height: Math.max((endHour - startHour) * hourHeight, 20),
        };
      }
    }

    return positions;
  }, [tasks, date, resizingTask, hourGridHeight]);

  // Gestion du resize avec les événements mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingTask) return;

      const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;

      // Calculer le déplacement en pixels
      const deltaY = e.clientY - resizingTask.startY;

      // Convertir en minutes (1 heure = hourHeight pixels)
      const deltaMinutes = (deltaY / hourHeight) * 60;

      // Arrondir aux 15 minutes
      const roundedDeltaMinutes = Math.round(deltaMinutes / 15) * 15;

      let newStartDate = new Date(resizingTask.originalStartDate);
      let newEndDate = new Date(resizingTask.originalEndDate);

      if (resizingTask.type === 'top') {
        // Resize du haut - modifier startDate
        newStartDate = new Date(
          resizingTask.originalStartDate.getTime() + roundedDeltaMinutes * 60000
        );

        // Contraintes : 8h minimum, ne pas dépasser endDate - 15min
        const minDate = new Date(date);
        minDate.setHours(8, 0, 0, 0);
        const maxDate = new Date(resizingTask.originalEndDate.getTime() - 15 * 60000);

        newStartDate = new Date(
          Math.max(minDate.getTime(), Math.min(maxDate.getTime(), newStartDate.getTime()))
        );
      } else {
        // Resize du bas - modifier endDate
        newEndDate = new Date(resizingTask.originalEndDate.getTime() + roundedDeltaMinutes * 60000);

        // Contraintes : 20h maximum, ne pas être avant startDate + 15min
        const maxDate = new Date(date);
        maxDate.setHours(20, 0, 0, 0);
        const minDate = new Date(resizingTask.originalStartDate.getTime() + 15 * 60000);

        newEndDate = new Date(
          Math.max(minDate.getTime(), Math.min(maxDate.getTime(), newEndDate.getTime()))
        );
      }

      // Contrainte globale : durée maximale de 12h
      const maxDuration = 12 * 60 * 60 * 1000; // 12 heures en ms
      if (newEndDate.getTime() - newStartDate.getTime() > maxDuration) {
        if (resizingTask.type === 'top') {
          newStartDate = new Date(newEndDate.getTime() - maxDuration);
        } else {
          newEndDate = new Date(newStartDate.getTime() + maxDuration);
        }
      }

      // Mettre à jour l'état temporaire
      setResizingTask(prev =>
        prev
          ? {
              ...prev,
              tempStartDate: newStartDate,
              tempEndDate: newEndDate,
            }
          : null
      );

      // Mettre à jour le tooltip avec les nouvelles heures
      setResizeTooltip(prev =>
        prev
          ? {
              ...prev,
              x: e.clientX,
              y: e.clientY - 40,
              timeRange: `${format(newStartDate, 'HH:mm')} - ${format(newEndDate, 'HH:mm')}`,
            }
          : null
      );
    };

    const handleMouseUp = () => {
      if (resizingTask && resizingTask.tempStartDate && resizingTask.tempEndDate && onTaskResize) {
        // Finaliser le resize
        const taskToResize = tasks.find(t => t.id === resizingTask.taskId);
        if (taskToResize) {
          onTaskResize(
            taskToResize as TaskWithConflicts,
            resizingTask.tempStartDate,
            resizingTask.tempEndDate
          );
        }
      }
      setResizingTask(null);
      setResizeTooltip(null); // Masquer le tooltip
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Annuler le resize en cours
        if (resizingTask) {
          setResizingTask(null);
          setResizeTooltip(null); // Masquer le tooltip
          return;
        }

        // Annuler le drag en cours
        const draggedElement = document.querySelector('[draggable="true"]:active');
        if (draggedElement) {
          const event = new DragEvent('dragend', {
            bubbles: true,
            cancelable: true,
          });
          draggedElement.dispatchEvent(event);
        }
      }
    };

    if (resizingTask) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleEscape);
      if (dragScrollInterval.current) {
        clearInterval(dragScrollInterval.current);
      }
    };
  }, [resizingTask, tasks, date, onTaskResize]);

  // Handler pour démarrer le resize
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, type: 'top' | 'bottom', task: TaskWithConflicts) => {
      e.preventDefault();
      e.stopPropagation();

      if (!task.workPeriod) return;

      const startDate = new Date(task.workPeriod.startDate);
      const endDate = new Date(task.workPeriod.endDate);

      setResizingTask({
        taskId: task.id,
        type,
        startY: e.clientY,
        originalStartDate: startDate,
        originalEndDate: endDate,
      });

      // Afficher le tooltip avec la plage horaire initiale
      setResizeTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY - 40, // Au-dessus de la souris
        timeRange: `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`,
      });
    },
    []
  );

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
          targetMemberId: member.id,
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

    const scrollContainer = container.querySelector(
      '.overflow-y-auto, [data-radix-scroll-area-viewport]'
    ) as HTMLElement;
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

  // Gestion du click & drag pour sélection de plage horaire
  const handleSelectionStart = useCallback(
    (e: React.MouseEvent, containerRef: HTMLElement) => {
      // Ne pas démarrer la sélection si on clique sur une tâche
      const target = e.target as HTMLElement;
      if (target.closest('[data-task-card]')) {
        return;
      }

      e.preventDefault();

      const rect = containerRef.getBoundingClientRect();
      const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;

      const y = e.clientY - rect.top;
      const totalMinutes = (y / hourHeight) * 60;
      const startHour = Math.floor(totalMinutes / 60) + 8;
      const startMinute = Math.round((totalMinutes % 60) / 15) * 15; // Snap to 15min

      console.log('🖱️ Sélection démarrée:', { startHour, startMinute, y });

      setSelecting({
        startY: e.clientY,
        currentY: e.clientY,
        startHour,
        startMinute,
      });
    },
    [hourGridHeight]
  );

  const handleSelectionMove = useCallback(
    (e: MouseEvent) => {
      if (!selecting) return;

      setSelecting(prev => (prev ? { ...prev, currentY: e.clientY } : null));
    },
    [selecting]
  );

  const handleSelectionEnd = useCallback(() => {
    if (!selecting || !onTimeSlotSelect) {
      setSelecting(null);
      return;
    }

    const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;

    // Calculer la différence en minutes
    const deltaY = selecting.currentY - selecting.startY;
    const deltaMinutes = (deltaY / hourHeight) * 60;
    const roundedDeltaMinutes = Math.round(deltaMinutes / 15) * 15;

    // Créer les dates de début et fin
    const startDate = new Date(date);
    startDate.setHours(selecting.startHour, selecting.startMinute, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + Math.abs(roundedDeltaMinutes));

    // Si drag vers le haut, inverser les dates
    const finalStartDate = roundedDeltaMinutes < 0 ? endDate : startDate;
    const finalEndDate = roundedDeltaMinutes < 0 ? startDate : endDate;

    // Assurer une durée minimale de 30 minutes
    const durationMs = finalEndDate.getTime() - finalStartDate.getTime();
    if (durationMs < 30 * 60 * 1000) {
      finalEndDate.setMinutes(finalEndDate.getMinutes() + 30);
    }

    console.log('✅ Sélection terminée:', {
      start: finalStartDate,
      end: finalEndDate,
      duration: `${Math.round(durationMs / 60000)} min`,
    });

    // Appeler le callback avec les dates
    onTimeSlotSelect(member, finalStartDate, finalEndDate);

    setSelecting(null);
  }, [selecting, date, member, onTimeSlotSelect, hourGridHeight]);

  // Gérer les événements mouse au niveau global pendant la sélection
  useEffect(() => {
    if (!selecting) return;

    window.addEventListener('mousemove', handleSelectionMove);
    window.addEventListener('mouseup', handleSelectionEnd);

    return () => {
      window.removeEventListener('mousemove', handleSelectionMove);
      window.removeEventListener('mouseup', handleSelectionEnd);
    };
  }, [selecting, handleSelectionMove, handleSelectionEnd]);

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
    <div className={cn(columnClassName, 'flex flex-col')}>
      {/* Member header */}
      <div className='sticky top-0 z-30 bg-muted/30 border-b px-3 h-[4.5rem] flex items-center flex-shrink-0'>
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
      <div
        ref={timeSlotsRef}
        className='grid grid-rows-[repeat(13,1fr)] relative'
        style={{ height: hourGridHeight > 0 ? `${hourGridHeight}px` : undefined }}
        onMouseDown={e => {
          if (timeSlotsRef.current) {
            handleSelectionStart(e, timeSlotsRef.current);
          }
        }}
      >
        {/* Hour slots */}
        {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => {
          return (
            <div
              key={hour}
              className='border-b hover:bg-muted/5 cursor-pointer transition-colors relative'
              onDrop={e => handleDrop(e, hour)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => handleTimeSlotClick(hour)}
            >
              {/* Half-hour line */}
              <div className='absolute top-1/2 left-0 right-0 border-b border-dashed border-muted-foreground/20' />
            </div>
          );
        })}

        {/* Positioned tasks */}
        {taskPositions.map((pos, index) => (
          <div
            key={pos.task.id}
            className='absolute'
            data-task-card
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
              resizable={true}
              className='h-full hover:scale-[1.02]'
              onDragStart={e => {
                // Capturer l'offset Y du clic par rapport au haut de la tâche
                const rect = e.currentTarget.getBoundingClientRect();
                const offsetY = e.clientY - rect.top;

                e.dataTransfer.setData('task', JSON.stringify(pos.task));
                e.dataTransfer.setData('dragOffsetY', offsetY.toString());
                e.dataTransfer.setData('sourceMemberId', member.id); // Ajouter le membre source
                e.dataTransfer.effectAllowed = 'move';
              }}
              onResizeStart={handleResizeStart}
            />
          </div>
        ))}

        {/* Overlay de sélection */}
        {selecting &&
          (() => {
            const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;

            const deltaY = selecting.currentY - selecting.startY;
            const startOffset =
              (selecting.startHour - 8) * hourHeight + (selecting.startMinute / 60) * hourHeight;

            const height = Math.abs(deltaY);
            const top = deltaY < 0 ? startOffset + deltaY : startOffset;

            return (
              <div
                className='absolute left-0 right-0 bg-primary/20 pointer-events-none'
                style={{
                  top: `${top}px`,
                  height: `${height}px`,
                  zIndex: 100,
                }}
              />
            );
          })()}
      </div>

      {/* Tooltip de redimensionnement - Rendu via portal */}
      {resizeTooltip?.visible &&
        ReactDOM.createPortal(
          <div
            className='fixed z-[9999] px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none'
            style={{
              left: resizeTooltip.x,
              top: resizeTooltip.y,
            }}
          >
            {resizeTooltip.timeRange}
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Calculate non-overlapping positions for tasks
 */
function calculateTaskPositions(
  tasks: Task[],
  date: Date,
  containerHeight: number
): TaskPosition[] {
  if (tasks.length === 0) {
    return [];
  }

  // Calculate slot height from measured grid height
  const hourHeight = containerHeight > 0 ? containerHeight / 13 : 0;

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
    let startTime = new Date(task.workPeriod!.startDate);
    let endTime = new Date(task.workPeriod!.endDate);

    // For all-day tasks, force them to start at 8:00 and end at 20:00
    if (task.isAllDay) {
      startTime = new Date(startTime);
      startTime.setHours(8, 0, 0, 0);
      endTime = new Date(endTime);
      endTime.setHours(21, 0, 0, 0);
    }

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
