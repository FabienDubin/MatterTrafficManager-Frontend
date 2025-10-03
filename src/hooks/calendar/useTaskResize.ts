import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Task, TaskWithConflicts } from '@/types/task.types';

export interface UseTaskResizeOptions {
  date: Date;
  hourGridHeight: number;
  onTaskResize?: (task: TaskWithConflicts, newStartDate: Date, newEndDate: Date) => void;
  tasks: Task[];
}

export interface ResizeState {
  taskId: string;
  type: 'top' | 'bottom';
  startY: number;
  originalStartDate: Date;
  originalEndDate: Date;
  tempStartDate?: Date;
  tempEndDate?: Date;
}

export interface UseTaskResizeReturn {
  resizingTask: ResizeState | null;
  resizeTooltip: { visible: boolean; x: number; y: number; timeRange: string } | null;
  handleResizeStart: (e: React.MouseEvent, type: 'top' | 'bottom', task: TaskWithConflicts) => void;
  getTaskResizeState: (taskId: string) => {
    isResizing: boolean;
    tempDates?: { start: Date; end: Date }
  };
}

/**
 * Hook to handle task resize with constraints and tooltip
 */
export function useTaskResize({
  date,
  hourGridHeight,
  onTaskResize,
  tasks
}: UseTaskResizeOptions): UseTaskResizeReturn {
  const [resizingTask, setResizingTask] = useState<ResizeState | null>(null);
  const [resizeTooltip, setResizeTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    timeRange: string;
  } | null>(null);

  // Mouse move handler
  useEffect(() => {
    if (!resizingTask) return;

    const handleMouseMove = (e: MouseEvent) => {
      const hourHeight = hourGridHeight > 0 ? hourGridHeight / 13 : 0;
      const deltaY = e.clientY - resizingTask.startY;
      const deltaMinutes = (deltaY / hourHeight) * 60;
      const roundedDeltaMinutes = Math.round(deltaMinutes / 15) * 15;

      let newStartDate = new Date(resizingTask.originalStartDate);
      let newEndDate = new Date(resizingTask.originalEndDate);

      if (resizingTask.type === 'top') {
        // Resize top - modify start
        newStartDate = new Date(
          resizingTask.originalStartDate.getTime() + roundedDeltaMinutes * 60000
        );

        const minDate = new Date(date);
        minDate.setHours(8, 0, 0, 0);
        const maxDate = new Date(resizingTask.originalEndDate.getTime() - 15 * 60000);

        newStartDate = new Date(
          Math.max(minDate.getTime(), Math.min(maxDate.getTime(), newStartDate.getTime()))
        );
      } else {
        // Resize bottom - modify end
        newEndDate = new Date(
          resizingTask.originalEndDate.getTime() + roundedDeltaMinutes * 60000
        );

        const maxDate = new Date(date);
        maxDate.setHours(20, 0, 0, 0);
        const minDate = new Date(resizingTask.originalStartDate.getTime() + 15 * 60000);

        newEndDate = new Date(
          Math.max(minDate.getTime(), Math.min(maxDate.getTime(), newEndDate.getTime()))
        );
      }

      // Max duration constraint: 12h
      const maxDuration = 12 * 60 * 60 * 1000;
      if (newEndDate.getTime() - newStartDate.getTime() > maxDuration) {
        if (resizingTask.type === 'top') {
          newStartDate = new Date(newEndDate.getTime() - maxDuration);
        } else {
          newEndDate = new Date(newStartDate.getTime() + maxDuration);
        }
      }

      setResizingTask(prev =>
        prev ? { ...prev, tempStartDate: newStartDate, tempEndDate: newEndDate } : null
      );

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
      if (resizingTask?.tempStartDate && resizingTask?.tempEndDate && onTaskResize) {
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
      setResizeTooltip(null);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setResizingTask(null);
        setResizeTooltip(null);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [resizingTask, tasks, date, onTaskResize, hourGridHeight]);

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

      setResizeTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY - 40,
        timeRange: `${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`,
      });
    },
    []
  );

  const getTaskResizeState = useCallback(
    (taskId: string) => {
      if (resizingTask?.taskId === taskId && resizingTask.tempStartDate && resizingTask.tempEndDate) {
        return {
          isResizing: true,
          tempDates: {
            start: resizingTask.tempStartDate,
            end: resizingTask.tempEndDate
          }
        };
      }
      return { isResizing: false };
    },
    [resizingTask]
  );

  return {
    resizingTask,
    resizeTooltip,
    handleResizeStart,
    getTaskResizeState
  };
}
