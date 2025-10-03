import { useCallback, useRef, useEffect } from 'react';
import { Task } from '@/types/task.types';
import { toast } from 'sonner';

export interface UseTaskDragAndDropOptions {
  date: Date;
  memberId: string | null; // null for UnassignedColumn
  onTaskDrop: (task: Task, memberId: string | null, newDate: Date, sourceMemberId?: string) => void;
  holidayTask?: Task;
  schoolTask?: Task;
  memberName?: string;
}

export interface UseTaskDragAndDropReturn {
  handleDrop: (e: React.DragEvent, hour: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDragStart: (e: React.DragEvent, task: Task) => void;
}

/**
 * Hook to handle task drag and drop with auto-scroll
 */
export function useTaskDragAndDrop({
  date,
  memberId,
  onTaskDrop,
  holidayTask,
  schoolTask,
  memberName
}: UseTaskDragAndDropOptions): UseTaskDragAndDropReturn {
  const dragScrollInterval = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragScrollInterval.current) {
        clearInterval(dragScrollInterval.current);
      }
    };
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, hour: number) => {
      e.preventDefault();
      e.stopPropagation();

      // Get drag offset
      const dragOffset = parseInt(e.dataTransfer.getData('dragOffsetY') || '0');

      // Calculate position with minutes
      const rect = e.currentTarget.getBoundingClientRect();
      const relativeY = e.clientY - rect.top - dragOffset;
      const slotHeight = rect.height;
      const minuteOffset = Math.max(0, Math.floor((relativeY / slotHeight) * 60));
      const roundedMinutes = Math.round(minuteOffset / 15) * 15;

      const taskData = e.dataTransfer.getData('task');
      const sourceMemberId = e.dataTransfer.getData('sourceMemberId');

      if (taskData) {
        const task = JSON.parse(taskData) as Task;
        const dropDate = new Date(date);
        dropDate.setHours(hour, roundedMinutes % 60, 0, 0);

        if (roundedMinutes >= 60) {
          dropDate.setHours(hour + 1, 0, 0, 0);
        }

        // Warnings for holiday/school
        if (holidayTask && memberName) {
          toast.warning(`Attention : ${memberName} est en congé ce jour`);
        } else if (schoolTask && memberName) {
          toast.warning(`Attention : ${memberName} est en formation ce jour`);
        }

        onTaskDrop(task, memberId, dropDate, sourceMemberId);
      }
    },
    [date, memberId, onTaskDrop, holidayTask, schoolTask, memberName]
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
    const scrollZone = 50;
    const scrollSpeed = 10;

    if (dragScrollInterval.current) {
      clearInterval(dragScrollInterval.current);
      dragScrollInterval.current = null;
    }

    if (y > rect.bottom - scrollZone) {
      dragScrollInterval.current = setInterval(() => {
        scrollContainer.scrollTop += scrollSpeed;
      }, 20);
    } else if (y < rect.top + scrollZone) {
      dragScrollInterval.current = setInterval(() => {
        scrollContainer.scrollTop -= scrollSpeed;
      }, 20);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    if (dragScrollInterval.current) {
      clearInterval(dragScrollInterval.current);
      dragScrollInterval.current = null;
    }
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    e.dataTransfer.setData('task', JSON.stringify(task));
    e.dataTransfer.setData('dragOffsetY', offsetY.toString());
    e.dataTransfer.setData('sourceMemberId', memberId || '');
    e.dataTransfer.effectAllowed = 'move';
  }, [memberId]);

  return {
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleDragStart
  };
}
