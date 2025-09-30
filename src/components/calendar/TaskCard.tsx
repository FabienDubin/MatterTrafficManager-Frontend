import { useMemo, useState, useCallback, useRef } from 'react';
import { Task, TaskWithConflicts } from '@/types/task.types';
import { ViewConfig } from '@/types/calendar.types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { formatTaskForDayView } from '@/utils/taskFormatter';
import { format } from 'date-fns';
import { useClientColors } from '@/store/config.store';
import { getContrastColor } from '@/utils/colorUtils';
import { useTheme } from '@/providers/ThemeProvider';
import { ConflictBadge } from './ConflictBadge';
import { TTIndicator } from './TTIndicator';

export interface TaskCardProps {
  task: TaskWithConflicts;
  viewConfig?: ViewConfig;
  onClick?: () => void;
  className?: string;
  showTime?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  resizable?: boolean;
  onResizeStart?: (e: React.MouseEvent, type: 'top' | 'bottom', task: TaskWithConflicts) => void;
  onTaskResize?: (task: TaskWithConflicts, newStartDate: Date, newEndDate: Date) => void;
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
  resizable = false,
  onResizeStart,
}: TaskCardProps) {
  const { getClientColor, isColorsLoaded } = useClientColors();
  const { theme } = useTheme();
  
  // Get client color if available - now using clientId instead of client name
  const clientId = task.clientId; // Use clientId from enriched data
  const clientColor = isColorsLoaded && clientId ? getClientColor(clientId) : undefined;
  const isDarkTheme = theme === 'dark';
  const textColor = clientColor ? getContrastColor(clientColor, isDarkTheme) : undefined;

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

  // État simple pour l'affichage des handles
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className={cn(
        'relative px-2 py-1 rounded-md cursor-pointer transition-all',
        'hover:shadow-md hover:z-50',
        clientColor ? '' : 'bg-card text-card-foreground border border-border', // Use theme colors and border only if no client color
        className
      )}
      style={{
        backgroundColor: clientColor || undefined,
        color: textColor || undefined,
        ...style,
      }}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onClick={onClick}
      title={tooltipTitle}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Badges de conflits et télétravail */}
      {task.conflicts && task.conflicts.length > 0 && (
        <ConflictBadge conflicts={task.conflicts} />
      )}
      {task.taskType === 'remote' && (
        <TTIndicator 
          memberName={task.assignedMembersData?.[0]?.name}
        />
      )}

      {/* Handles de resize - seulement si resizable et pas compact */}
      {resizable && !compact && isHovering && (
        <>
          {/* Handle resize haut */}
          <div
            className={cn(
              'absolute top-0 left-0 right-0 h-1 cursor-ns-resize',
              'hover:bg-primary/30 transition-colors',
              'flex items-center justify-center'
            )}
            onMouseDown={(e) => onResizeStart?.(e, 'top', task)}
          >
            <div className="w-6 h-0.5 bg-primary/60 rounded-full" />
          </div>
          
          {/* Handle resize bas */}
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize',
              'hover:bg-primary/30 transition-colors',
              'flex items-center justify-center'
            )}
            onMouseDown={(e) => onResizeStart?.(e, 'bottom', task)}
          >
            <div className="w-6 h-0.5 bg-primary/60 rounded-full" />
          </div>
        </>
      )}
      
      <div className='flex flex-col overflow-hidden'>
        <p className={cn(
          'font-medium truncate',
          clientColor ? '' : 'text-foreground',
          compact ? 'text-[11px]' : 'text-xs'
        )}>
          {formattedTask.title}
        </p>

        {/* Show time if requested and available */}
        {showTime && timeString && !compact && (
          <p className={cn(
            'text-[10px]',
            clientColor ? 'opacity-90' : 'text-muted-foreground'
          )}>{timeString}</p>
        )}

        {/* Show subtitle if available and not too compact */}
        {!compact && formattedTask.subtitle && (
          <p className={cn(
            'text-[10px] truncate mt-auto',
            clientColor ? 'opacity-90' : 'text-muted-foreground'
          )}>
            {formattedTask.subtitle}
          </p>
        )}

        {/* Show badges if available and not compact */}
        {!compact && formattedTask.badges && formattedTask.badges.length > 0 && (
          <div className='flex gap-1 flex-wrap mt-1'>
            {formattedTask.badges.slice(0, 2).map((badge, i) => (
              <span
                key={i}
                className='text-[9px] px-1 py-0 bg-muted text-muted-foreground rounded-sm truncate max-w-[80px]'
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