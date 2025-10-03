import { useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { Task } from '@/types/task.types';
import { TaskEditFormData } from '@/schemas/taskEdit.schema';
import { normalizeTaskStatus } from '@/utils/taskHelpers';

export interface UseTaskFormInitializationOptions {
  task: Task | null;
  isCreateMode: boolean;
  open: boolean;
  initialDates?: { start: Date; end: Date };
  initialMember?: string;
  form: UseFormReturn<TaskEditFormData>;
}

/**
 * Hook to initialize task form based on mode (create/edit)
 */
export function useTaskFormInitialization({
  task,
  isCreateMode,
  open,
  initialDates,
  initialMember,
  form
}: UseTaskFormInitializationOptions) {
  useEffect(() => {
    if (task) {
      // Edit mode - prefill with task data
      const startDate = task.workPeriod?.startDate
        ? new Date(task.workPeriod.startDate)
        : undefined;
      const endDate = task.workPeriod?.endDate
        ? new Date(task.workPeriod.endDate)
        : undefined;

      form.reset({
        title: task.title || '',
        projectId: task.projectId || '',
        status: normalizeTaskStatus(task.status || 'not_started'),
        assignedMembers: task.assignedMembers || [],
        startDate,
        startTime: startDate ? format(startDate, 'HH:mm') : '09:00',
        endDate,
        endTime: endDate ? format(endDate, 'HH:mm') : '18:00',
        notes: task.notes || '',
        addToCalendar: false,
      });
    } else if (isCreateMode && open) {
      // Create mode - prefill with initial data
      const startDate = initialDates?.start;
      const endDate = initialDates?.end;

      form.reset({
        title: '',
        projectId: '',
        status: 'not_started',
        assignedMembers: initialMember ? [initialMember] : [],
        startDate,
        startTime: startDate ? format(startDate, 'HH:mm') : '09:00',
        endDate,
        endTime: endDate ? format(endDate, 'HH:mm') : '18:00',
        notes: '',
        addToCalendar: false,
      });
    }
  }, [task, form, isCreateMode, open, initialDates, initialMember]);
}
