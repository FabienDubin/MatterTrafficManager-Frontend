import { useMemo, useCallback, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { format } from 'date-fns';
import { Task, TaskWithConflicts } from '@/types/task.types';
import { UnassignedColumnProps, TaskPosition } from '@/types/calendar.types';
import { Badge } from '@/components/ui/badge';
import { UserX } from 'lucide-react';
import { TaskCard } from './TaskCard';

/**
 * Colonne pour les tâches non assignées
 */
export function UnassignedColumn({
  tasks,
  date,
  viewConfig,
  onTaskClick,
  onTimeSlotClick,
  onTaskDrop,
  onTaskResize
}: UnassignedColumnProps) {
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

  // État pour le tooltip de resize
  const [resizeTooltip, setResizeTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    timeRange: string;
  } | null>(null);

  // Calculate task positions to avoid overlaps
  const taskPositions = useMemo(() => {
    const positions = calculateTaskPositions(tasks, date);
    
    // Override position pour la tâche en cours de resize
    if (resizingTask && resizingTask.tempStartDate && resizingTask.tempEndDate) {
      const resizeIndex = positions.findIndex(p => p.task.id === resizingTask.taskId);
      if (resizeIndex !== -1) {
        // Recalculer la position avec les dates temporaires
        const startHour = resizingTask.tempStartDate.getHours() + resizingTask.tempStartDate.getMinutes() / 60;
        const endHour = resizingTask.tempEndDate.getHours() + resizingTask.tempEndDate.getMinutes() / 60;
        
        const viewportHeight = window.innerHeight;
        const hourHeight = (viewportHeight - 200) / 13;
        
        positions[resizeIndex] = {
          ...positions[resizeIndex],
          top: (startHour - 8) * hourHeight,
          height: Math.max((endHour - startHour) * hourHeight, 20)
        };
      }
    }
    
    return positions;
  }, [tasks, date, resizingTask]);

  // Gestion du resize avec les événements mouse
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingTask) return;
      
      const viewportHeight = window.innerHeight;
      const hourHeight = (viewportHeight - 200) / 13;
      
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
        newStartDate = new Date(resizingTask.originalStartDate.getTime() + roundedDeltaMinutes * 60000);
        
        // Contraintes : 8h minimum, ne pas dépasser endDate - 15min
        const minDate = new Date(date);
        minDate.setHours(8, 0, 0, 0);
        const maxDate = new Date(resizingTask.originalEndDate.getTime() - 15 * 60000);
        
        newStartDate = new Date(Math.max(minDate.getTime(), Math.min(maxDate.getTime(), newStartDate.getTime())));
      } else {
        // Resize du bas - modifier endDate
        newEndDate = new Date(resizingTask.originalEndDate.getTime() + roundedDeltaMinutes * 60000);
        
        // Contraintes : 20h maximum, ne pas être avant startDate + 15min
        const maxDate = new Date(date);
        maxDate.setHours(20, 0, 0, 0);
        const minDate = new Date(resizingTask.originalStartDate.getTime() + 15 * 60000);
        
        newEndDate = new Date(Math.max(minDate.getTime(), Math.min(maxDate.getTime(), newEndDate.getTime())));
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
      setResizingTask(prev => prev ? {
        ...prev,
        tempStartDate: newStartDate,
        tempEndDate: newEndDate
      } : null);
      
      // Mettre à jour le tooltip avec les nouvelles heures
      setResizeTooltip(prev => prev ? {
        ...prev,
        x: e.clientX,
        y: e.clientY - 40,
        timeRange: `${format(newStartDate, 'HH:mm')} - ${format(newEndDate, 'HH:mm')}`
      } : null);
    };
    
    const handleMouseUp = () => {
      if (resizingTask && resizingTask.tempStartDate && resizingTask.tempEndDate && onTaskResize) {
        // Finaliser le resize
        const taskToResize = tasks.find(t => t.id === resizingTask.taskId);
        if (taskToResize) {
          onTaskResize(taskToResize as TaskWithConflicts, resizingTask.tempStartDate, resizingTask.tempEndDate);
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
    };
  }, [resizingTask, tasks, date, onTaskResize]);

  // Handler pour démarrer le resize
  const handleResizeStart = useCallback((e: React.MouseEvent, type: 'top' | 'bottom', task: TaskWithConflicts) => {
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
      originalEndDate: endDate
    });
    
    // Afficher le tooltip avec la plage horaire initiale
    setResizeTooltip({
      visible: true,
      x: e.clientX,
      y: e.clientY - 40, // Au-dessus de la souris
      timeRange: `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`
    });
  }, []);

  // Handle drop on time slot
  const handleDrop = useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskData = e.dataTransfer.getData('task');
    const sourceMemberId = e.dataTransfer.getData('sourceMemberId');
    
    if (taskData && onTaskDrop) {
      const task = JSON.parse(taskData) as Task;
      const dropDate = new Date(date);
      dropDate.setHours(hour, 0, 0, 0);
      onTaskDrop(task, null, dropDate, sourceMemberId); // null = non assigné
    }
  }, [date, onTaskDrop]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle time slot click for creating new task
  const handleTimeSlotClick = useCallback((hour: number) => {
    if (onTimeSlotClick) {
      const clickDate = new Date(date);
      clickDate.setHours(hour, 0, 0, 0);
      onTimeSlotClick(clickDate, hour);
    }
  }, [date, onTimeSlotClick]);

  return (
    <div className="flex-1 min-w-[180px] border-r bg-muted/5">
      {/* Unassigned header */}
      <div className="sticky top-0 z-30 bg-muted/30 border-b px-3 h-[4.5rem] flex items-center">
        <div className="flex items-center gap-2 w-full">
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted">
            <UserX className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Non assigné</p>
            <p className="text-xs text-muted-foreground">
              À planifier
            </p>
          </div>
          <Badge variant="outline" className="text-xs h-5 min-w-[1.25rem] flex items-center justify-center">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Time slots with tasks */}
      <div className="relative">
        {/* Hour slots for drop zones */}
        {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => {
          const slotHeight = `calc((100vh - 200px) / 13)`;
          return (
            <div
              key={hour}
              className="border-b hover:bg-muted/10 cursor-pointer transition-colors"
              style={{ height: slotHeight }}
              onDrop={(e) => handleDrop(e, hour)}
              onDragOver={handleDragOver}
              onClick={() => handleTimeSlotClick(hour)}
            >
              {/* Half-hour line */}
              <div className="border-b border-dashed border-muted-foreground/20" style={{ height: `calc(${slotHeight} / 2)` }} />
            </div>
          );
        })}

        {/* Positioned tasks */}
        {taskPositions.map((pos, index) => (
          <div
            key={pos.task.id}
            className="absolute"
            style={{
              top: `${pos.top}px`,
              height: `${pos.height}px`,
              left: `${pos.left}%`,
              width: `${pos.width}%`,
              zIndex: 10 + index,
            }}
          >
            <div className="relative h-full">
              <TaskCard
                task={pos.task}
                viewConfig={viewConfig}
                onClick={() => onTaskClick?.(pos.task)}
                showTime={true}
                compact={pos.height < 50}
                draggable={true}
                resizable={true}
                className="h-full border-dashed opacity-90 hover:opacity-100 hover:scale-[1.02] bg-background/80 backdrop-blur-sm"
                onDragStart={(e) => {
                  // Capturer l'offset Y du clic par rapport au haut de la tâche
                  const rect = e.currentTarget.getBoundingClientRect();
                  const offsetY = e.clientY - rect.top;
                  
                  e.dataTransfer.setData('task', JSON.stringify(pos.task));
                  e.dataTransfer.setData('dragOffsetY', offsetY.toString());
                  e.dataTransfer.setData('sourceMemberId', ''); // Pas de membre source (non assigné)
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onResizeStart={handleResizeStart}
              />
              {pos.height > 70 && (
                <Badge 
                  variant="outline" 
                  className="absolute bottom-1 left-2 text-[9px] py-0 px-1"
                >
                  À assigner
                </Badge>
              )}
              <UserX className="absolute top-1 left-2 h-3 w-3 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Tooltip de redimensionnement - Rendu via portal */}
      {resizeTooltip?.visible && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none"
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
 * Calculate non-overlapping positions for unassigned tasks
 */
function calculateTaskPositions(tasks: Task[], date: Date): TaskPosition[] {
  if (tasks.length === 0) {return [];}

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
    let startTime = new Date(task.workPeriod!.startDate);
    let endTime = new Date(task.workPeriod!.endDate);

    // For all-day tasks, force them to start at 8:00 and end at 20:00
    if (task.isAllDay) {
      startTime = new Date(startTime);
      startTime.setHours(8, 0, 0, 0);
      endTime = new Date(endTime);
      endTime.setHours(20, 0, 0, 0);
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

    // Calculate horizontal position with padding
    const totalColumns = Math.max(columns.length, 1);
    const width = (100 - (totalColumns - 1) * 2) / totalColumns; // 2% gap between columns
    const left = columnIndex * (width + 2) + 1; // 1% padding from edges

    positions.push({
      task,
      top,
      height,
      left,
      width: width - 2 // Account for padding
    });
  });

  return positions;
}