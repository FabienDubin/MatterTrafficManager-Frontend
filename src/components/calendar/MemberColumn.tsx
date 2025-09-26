import { useMemo, useCallback } from 'react';
import { Task } from '@/types/task.types';
import { Member, MemberColumnProps, TaskPosition } from '@/types/calendar.types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from './TaskCard';

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
}: MemberColumnProps) {
  // Calculate task positions to avoid overlaps
  const taskPositions = useMemo(() => {
    return calculateTaskPositions(tasks, date);
  }, [tasks, date]);

  // Handle drop on time slot
  const handleDrop = useCallback(
    (e: React.DragEvent, hour: number) => {
      e.preventDefault();
      e.stopPropagation();

      const taskData = e.dataTransfer.getData('task');
      if (taskData && onTaskDrop) {
        const task = JSON.parse(taskData) as Task;
        const dropDate = new Date(date);
        dropDate.setHours(hour, 0, 0, 0);
        onTaskDrop(task, dropDate);
      }
    },
    [date, onTaskDrop]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

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

  return (
    <div className='flex-1 min-w-[200px] border-r'>
      {/* Member header */}
      <div className='sticky top-0 z-10 bg-muted/30 border-b px-3 py-2'>
        <div className='flex items-center gap-2'>
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
          <Badge variant='secondary' className='text-xs'>
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Time slots with tasks */}
      <div className='relative'>
        {/* Hour slots for drop zones */}
        {Array.from({ length: 15 }, (_, i) => i + 7).map(hour => (
          <div
            key={hour}
            className='h-20 border-b hover:bg-muted/5 cursor-pointer transition-colors'
            onDrop={e => handleDrop(e, hour)}
            onDragOver={handleDragOver}
            onClick={() => handleTimeSlotClick(hour)}
          >
            {/* Half-hour line */}
            <div className='h-10 border-b border-dashed border-muted-foreground/20' />
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
            <TaskCard
              task={pos.task}
              viewConfig={viewConfig}
              onClick={() => onTaskClick?.(pos.task)}
              showTime={true}
              compact={pos.height < 50}
              draggable={true}
              className="h-full hover:scale-[1.02]"
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
