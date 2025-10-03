import { DragEvent, MouseEvent } from 'react';
import { Task, TaskWithConflicts } from '@/types/task.types';
import { TaskPosition, ViewConfig } from '@/types/calendar.types';
import { TaskCard } from '../TaskCard';

export interface PositionedTasksListProps {
  taskPositions: TaskPosition[];
  viewConfig?: ViewConfig;
  onTaskClick?: (task: Task) => void;
  onDragStart: (e: DragEvent, task: Task) => void;
  onResizeStart: (e: MouseEvent, type: 'top' | 'bottom', task: TaskWithConflicts) => void;
}

/**
 * Render positioned tasks with drag and resize handlers
 */
export function PositionedTasksList({
  taskPositions,
  viewConfig,
  onTaskClick,
  onDragStart,
  onResizeStart
}: PositionedTasksListProps) {
  return (
    <>
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
            onDragStart={e => onDragStart(e, pos.task)}
            onResizeStart={onResizeStart}
          />
        </div>
      ))}
    </>
  );
}
