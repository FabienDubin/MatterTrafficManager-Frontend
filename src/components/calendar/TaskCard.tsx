import { useMemo } from 'react';
import { Task } from '@/types/task.types';
import { ViewConfig } from '@/types/calendar.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { getStatusColor } from '@/utils/taskMapper';
import { formatTaskForDayView } from '@/utils/taskFormatter';
import { format } from 'date-fns';

export interface TaskCardProps {
  task: Task;
  viewConfig?: ViewConfig;
  onClick?: () => void;
  className?: string;
  showTime?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

/**
 * Composant TaskCard réutilisable pour afficher une tâche
 * Utilisé dans DayView, MemberColumn, UnassignedColumn et CalendarView
 */
export function TaskCard({
  task,
  viewConfig,
  onClick,
  className,
  showTime = true,
  compact = false,
  style,
  draggable = false,
  onDragStart,
}: TaskCardProps) {
  const statusColor = getStatusColor(task.status);

  // Format task based on view configuration
  const formattedTask = useMemo(() => {
    if (!viewConfig) {
      return { title: task.title, subtitle: undefined, badges: undefined };
    }
    return formatTaskForDayView(task, viewConfig.fields, viewConfig.maxTitleLength);
  }, [task, viewConfig]);

  const handleDragStart = (e: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(e);
    } else {
      e.dataTransfer.setData('task', JSON.stringify(task));
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const timeString = task.workPeriod
    ? `${format(new Date(task.workPeriod.startDate), 'HH:mm')} - ${format(
        new Date(task.workPeriod.endDate),
        'HH:mm'
      )}`
    : '';

  const tooltipTitle = `${task.title}${timeString ? '\n' + timeString : ''}`;

  return (
    <div
      className={cn(
        'px-2 py-1 rounded-md border cursor-pointer transition-all',
        'hover:shadow-md hover:z-50',
        'bg-background',
        className
      )}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: statusColor,
        ...style,
      }}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onClick={onClick}
      title={tooltipTitle}
    >
      <div className='flex flex-col overflow-hidden'>
        <p className={cn('font-medium truncate', compact ? 'text-[11px]' : 'text-xs')}>
          {formattedTask.title}
        </p>

        {/* Show time if requested and available */}
        {showTime && timeString && !compact && (
          <p className='text-[10px] text-muted-foreground'>{timeString}</p>
        )}

        {/* Show subtitle if available and not too compact */}
        {!compact && formattedTask.subtitle && (
          <p className='text-[10px] text-muted-foreground truncate mt-auto'>
            {formattedTask.subtitle}
          </p>
        )}

        {/* Show badges if available and not compact */}
        {!compact && formattedTask.badges && formattedTask.badges.length > 0 && (
          <div className='flex gap-1 flex-wrap mt-1'>
            {formattedTask.badges.slice(0, 2).map((badge, i) => (
              <span
                key={i}
                className='text-[9px] px-1 py-0 bg-muted rounded-sm truncate max-w-[80px]'
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}