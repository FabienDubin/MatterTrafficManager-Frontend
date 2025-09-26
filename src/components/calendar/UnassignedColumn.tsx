import { useMemo, useCallback } from 'react';
import { Task } from '@/types/task.types';
import { UnassignedColumnProps, TaskPosition } from '@/types/calendar.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { UserX } from 'lucide-react';
import { getStatusColor } from '@/utils/taskMapper';
import { format } from 'date-fns';

/**
 * Colonne pour les tâches non assignées
 */
export function UnassignedColumn({
  tasks,
  date,
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
      <div className="sticky top-0 z-10 bg-background border-b px-3 py-2">
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
          <UnassignedTaskCard
            key={pos.task.id}
            task={pos.task}
            position={pos}
            onClick={() => onTaskClick?.(pos.task)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Unassigned task card component with visual distinction
 */
function UnassignedTaskCard({
  task,
  position,
  onClick,
  index
}: {
  task: Task;
  position: TaskPosition;
  onClick?: () => void;
  index: number;
}) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('task', JSON.stringify(task));
    e.dataTransfer.effectAllowed = 'move';
  };

  const statusColor = getStatusColor(task.status);
  
  return (
    <div
      className={cn(
        "absolute px-2 py-1 rounded-md border-2 border-dashed cursor-pointer transition-all",
        "hover:shadow-md hover:z-50 hover:scale-[1.02]",
        "bg-background/80 backdrop-blur-sm",
        "opacity-90 hover:opacity-100"
      )}
      style={{
        top: `${position.top}px`,
        height: `${position.height}px`,
        left: `${position.left}%`,
        width: `${position.width}%`,
        borderColor: statusColor,
        zIndex: 10 + index
      }}
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      title={`${task.title} (Non assigné)\n${format(new Date(task.workPeriod!.startDate), 'HH:mm')} - ${format(new Date(task.workPeriod!.endDate), 'HH:mm')}`}
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-start gap-1">
          <UserX className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs font-medium truncate flex-1">{task.title}</p>
        </div>
        
        <p className="text-[10px] text-muted-foreground">
          {format(new Date(task.workPeriod!.startDate), 'HH:mm')} - 
          {format(new Date(task.workPeriod!.endDate), 'HH:mm')}
        </p>
        
        {/* Show client if available */}
        {position.height > 50 && task.clientData && (
          <p className="text-[10px] text-muted-foreground truncate mt-auto">
            Client: {task.clientData.name}
          </p>
        )}
        
        {/* Warning badge for unassigned */}
        {position.height > 60 && (
          <Badge 
            variant="outline" 
            className="text-[9px] py-0 px-1 mt-1 w-fit"
          >
            À assigner
          </Badge>
        )}
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