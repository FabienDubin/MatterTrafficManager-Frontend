import { useMemo, useEffect, useRef, useState } from 'react';
import { Task } from '@/types/task.types';
import { DayViewProps } from '@/types/calendar.types';
import { MemberColumn } from './MemberColumn';
import { UnassignedColumn } from './UnassignedColumn';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useHolidays } from '@/hooks/useHolidays';
import { useHolidayAlert } from '@/hooks/useHolidayAlert';

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
  focusMemberId,
  onTaskClick,
  onTimeSlotClick,
  onTimeSlotSelect,
  onTaskDrop,
  onTaskResize,
}: DayViewProps) {
  const hourGridRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState(0);
  const [isHighlightActive, setIsHighlightActive] = useState(false);
  const lastFocusMemberRef = useRef<string | undefined>(undefined);

  // Hook pour détecter les jours fériés
  const holidays = useHolidays({
    startDate: date,
    endDate: date, // Juste la journée courante
  });

  // Hook pour les alertes de jours fériés
  const { isPublicHoliday, withHolidayAlert } = useHolidayAlert({ date });

  // Measure hour grid height after mount and on resize
  useEffect(() => {
    const measureHeight = () => {
      if (hourGridRef.current) {
        const height = hourGridRef.current.clientHeight;
        setGridHeight(height);
      }
    };

    // Measure on mount
    measureHeight();

    // Re-measure on window resize
    window.addEventListener('resize', measureHeight);
    return () => window.removeEventListener('resize', measureHeight);
  }, []);

  // Filtrer les tâches pour la journée actuelle
  const dayTasks = useMemo(() => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      if (!task.workPeriod) {
        return false;
      }

      const taskStart = new Date(task.workPeriod.startDate);
      const taskEnd = new Date(task.workPeriod.endDate);

      // Pour les tâches spéciales multi-jours qui doivent être splittées (congés, TT, école)
      // On vérifie si le jour courant est dans la période de la tâche
      if (task.shouldSplitDaily && task.isAllDay) {
        // La journée courante doit être comprise dans la période de la tâche
        // On compare juste les dates, pas les heures
        const taskStartDay = new Date(taskStart);
        taskStartDay.setHours(0, 0, 0, 0);
        const taskEndDay = new Date(taskEnd);
        taskEndDay.setHours(23, 59, 59, 999);

        return dayStart >= taskStartDay && dayStart <= taskEndDay;
      }

      // Pour les tâches normales, on vérifie le chevauchement standard
      return taskStart <= dayEnd && taskEnd >= dayStart;
    });
  }, [tasks, date]);

  // Séparer les tâches assignées et non assignées, et détecter les statuts spéciaux
  const { assignedTasks, unassignedTasks, specialTasksByMember } = useMemo(() => {
    const assigned: Map<string, Task[]> = new Map();
    const unassigned: Task[] = [];
    const holidayTasks: Map<string, Task> = new Map();
    const remoteTasks: Map<string, Task> = new Map();
    const schoolTasks: Map<string, Task> = new Map();

    // Initialize map for each member
    members.forEach(member => {
      assigned.set(member.id, []);
    });

    dayTasks.forEach(task => {
      // Détecter si c'est une tâche spéciale journée entière
      const isSpecialAllDay =
        task.isAllDay && ['holiday', 'remote', 'school'].includes(task.taskType || '');

      if (!Array.isArray(task.assignedMembers) || task.assignedMembers.length === 0) {
        // Ne pas ajouter les tâches spéciales journée entière aux non assignées
        if (!isSpecialAllDay) {
          unassigned.push(task);
        }
      } else {
        // Add to each assigned member's column
        task.assignedMembers.forEach(memberId => {
          // Pour les tâches spéciales journée entière, on les stocke seulement pour les badges
          if (isSpecialAllDay) {
            if (task.taskType === 'holiday') {
              holidayTasks.set(memberId, task);
            } else if (task.taskType === 'remote') {
              remoteTasks.set(memberId, task);
            } else if (task.taskType === 'school') {
              schoolTasks.set(memberId, task);
            }
          } else {
            // Les tâches normales sont ajoutées à la grille
            const memberTasks = assigned.get(memberId) || [];
            memberTasks.push(task);
            assigned.set(memberId, memberTasks);
          }
        });
      }
    });

    return {
      assignedTasks: assigned,
      unassignedTasks: unassigned,
      specialTasksByMember: {
        holiday: holidayTasks,
        remote: remoteTasks,
        school: schoolTasks,
      },
    };
  }, [dayTasks, members]);

  // Gérer l'annulation du drag avec ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Annuler le drag en cours
        // Le navigateur annule automatiquement le drag quand ESC est pressé
        // On peut ajouter un feedback visuel si nécessaire
        const isDragging = document.querySelector('[draggable="true"]:active');
        if (isDragging) {
          console.log('Drag annulé avec ESC');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Activer highlight lors de nouvelle navigation vers membre focusé
  useEffect(() => {
    if (focusMemberId && focusMemberId !== lastFocusMemberRef.current) {
      lastFocusMemberRef.current = focusMemberId;
      setIsHighlightActive(true);
    } else if (!focusMemberId) {
      setIsHighlightActive(false);
      lastFocusMemberRef.current = undefined;
    }
  }, [focusMemberId]);

  // Scroll automatique vers membre focusé depuis availability
  useEffect(() => {
    if (!focusMemberId || !scrollAreaRef.current) return;
    
    // Trouver l'index du membre dans la liste alphabétique
    const memberIndex = members.findIndex(m => m.id === focusMemberId);
    if (memberIndex === -1) return;
    
    // Calculer position scroll (largeur colonne * index)
    const columnWidth = 200; // min-w-[200px] de MemberColumn
    const scrollPosition = memberIndex * columnWidth;
    
    // Timer pour laisser le DOM se stabiliser après navigation
    const timer = setTimeout(() => {
      const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [focusMemberId, members]);

  // Désactiver highlight lors d'interactions utilisateur (clic, drag, resize)
  useEffect(() => {
    const handleInteraction = () => {
      if (isHighlightActive) {
        setIsHighlightActive(false);
      }
    };

    // Écouter plusieurs types d'interactions
    document.addEventListener('click', handleInteraction);
    document.addEventListener('mousedown', handleInteraction); // Pour drag
    document.addEventListener('dragstart', handleInteraction); // Pour drag de tâches
    document.addEventListener('pointerdown', handleInteraction); // Pour resize
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('dragstart', handleInteraction);
      document.removeEventListener('pointerdown', handleInteraction);
    };
  }, [isHighlightActive]);

  // Message si aucune donnée à afficher
  if (members.length === 0) {
    return (
      <div className='h-full border border-border rounded-lg overflow-hidden flex items-center justify-center'>
        <div className='text-center p-8 space-y-2'>
          <p className='text-lg font-medium text-muted-foreground'>
            Aucun membre ne correspond aux filtres sélectionnés
          </p>
          <p className='text-sm text-muted-foreground'>
            Modifie tes filtres pour afficher des résultats
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='h-full border border-border rounded-lg overflow-hidden'>
      <div className='flex flex-col h-full bg-background'>
        {/* Time grid with member columns */}
        <div className='flex-1 relative overflow-hidden'>
          <div className='flex h-full'>
            {/* Fixed Time labels column */}
            <div className='w-20 flex-shrink-0 border-r sticky left-0 z-20 bg-background flex flex-col'>
              <div className='bg-muted/30 border-b px-2 h-[4.5rem] flex items-center flex-shrink-0'>
                <span className='text-xs font-medium text-muted-foreground'>Heures</span>
              </div>

              {/* Hour labels */}
              <div ref={hourGridRef} className='flex-1 grid grid-rows-[repeat(13,1fr)]'>
                {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
                  <div
                    key={hour}
                    className='border-b text-xs text-muted-foreground flex items-start px-2 pt-1 bg-background'
                  >
                    {hour}:00
                  </div>
                ))}
              </div>
            </div>

            {/* Scrollable columns container */}
            <ScrollArea ref={scrollAreaRef} className='flex-1'>
              <div className='flex min-h-full'>
                {/* Member columns */}
                {members.map(member => (
                  <MemberColumn
                    key={member.id}
                    member={member}
                    tasks={assignedTasks.get(member.id) || []}
                    holidayTask={specialTasksByMember.holiday.get(member.id)}
                    remoteTask={specialTasksByMember.remote.get(member.id)}
                    schoolTask={specialTasksByMember.school.get(member.id)}
                    publicHolidayTask={isPublicHoliday}
                    date={date}
                    viewConfig={viewConfig}
                    hourGridHeight={gridHeight}
                    isFocused={member.id === focusMemberId && isHighlightActive}
                    onTaskClick={onTaskClick}
                    onTimeSlotClick={withHolidayAlert((date, hour) => onTimeSlotClick?.(member, date, hour))}
                    onTimeSlotSelect={withHolidayAlert((m, startDate, endDate) =>
                      onTimeSlotSelect?.(m, startDate, endDate)
                    )}
                    onTaskDrop={(task, memberId, newDate, sourceMemberId) =>
                      onTaskDrop?.(task, memberId, newDate, sourceMemberId)
                    }
                    onTaskResize={onTaskResize}
                  />
                ))}

                {/* Unassigned tasks column */}
                {unassignedTasks.length > 0 && (
                  <UnassignedColumn
                    tasks={unassignedTasks}
                    date={date}
                    viewConfig={viewConfig}
                    onTaskClick={onTaskClick}
                    onTimeSlotClick={withHolidayAlert((date, hour) => onTimeSlotClick?.(null, date, hour))}
                    onTimeSlotSelect={withHolidayAlert((startDate, endDate) =>
                      onTimeSlotSelect?.(null, startDate, endDate)
                    )}
                    onTaskDrop={(task, memberId, newDate, sourceMemberId) =>
                      onTaskDrop?.(task, memberId, newDate, sourceMemberId)
                    }
                    onTaskResize={onTaskResize}
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
