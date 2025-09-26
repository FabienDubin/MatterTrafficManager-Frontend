import { useMemo, useCallback } from 'react';
import { Task } from '@/types/task.types';
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
  onTaskDrop
}: UnassignedColumnProps) {
  // Calculate task positions
  const taskPositions = useMemo(() => {
    return calculateTaskPositions(tasks, date);
  }, [tasks, date]);

  // Handle drop on time slot
  const handleDrop = useCallback((e: React.DragEvent, hour: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    const taskData = e.dataTransfer.getData('task');
    if (taskData && onTaskDrop) {
      const task = JSON.parse(taskData) as Task;
      const dropDate = new Date(date);
      dropDate.setHours(hour, 0, 0, 0);
      onTaskDrop(task, dropDate);
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
      <div className="sticky top-0 z-10 bg-muted/30 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-full bg-muted">
            <UserX className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Non assigné</p>
            <p className="text-xs text-muted-foreground">
              À planifier
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Time slots with tasks */}
      <div className="relative">
        {/* Hour slots for drop zones */}
        {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
          <div
            key={hour}
            className="h-20 border-b hover:bg-muted/10 cursor-pointer transition-colors"
            onDrop={(e) => handleDrop(e, hour)}
            onDragOver={handleDragOver}
            onClick={() => handleTimeSlotClick(hour)}
          >
            {/* Half-hour line */}
            <div className="h-10 border-b border-dashed border-muted-foreground/20" />
          </div>
        ))}

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
                className="h-full border-dashed opacity-90 hover:opacity-100 hover:scale-[1.02] bg-background/80 backdrop-blur-sm"
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
    </div>
  );
}

/**
 * Calculate non-overlapping positions for unassigned tasks
 */
function calculateTaskPositions(tasks: Task[], date: Date): TaskPosition[] {
  if (tasks.length === 0) return [];

  // Filter and sort tasks by start time
  const dayStart = new Date(date);
  dayStart.setHours(7, 0, 0, 0);
  
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
    
    // Position relative to 7:00 AM start
    const top = (startHour - 7) * 80; // 80px per hour
    const height = Math.max((endHour - startHour) * 80, 20); // Minimum 20px height

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